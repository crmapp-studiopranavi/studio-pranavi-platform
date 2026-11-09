import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import {
  useLeadDetail,
  useLeadActivities,
  useLeadTasks,
  useLeadAttachments,
  useLeadSiteVisits,
  useLeadQuotes,
  useAddActivity,
  useCreateTask,
  useUpdateTask,
  useScheduleLeadSiteVisit,
} from '@/lib/hooks/use-lead-detail';
import { useUpdateLeadStatus, useUpdateLeadField, useDeleteLead } from '@/lib/hooks/use-leads';
import { useConvertLead } from '@/lib/hooks/use-customers';
import { useStaffProfiles } from '@/lib/hooks/use-staff-profiles';
import { LeadStatusBadge, LEAD_STATUSES, NEXT_STATUS } from '@/components/leads/LeadStatusBadge';
import { LeadPriorityBadge, LEAD_PRIORITIES } from '@/components/leads/LeadPriorityBadge';
import type { Enums } from '@platform/types';
import {
  formatBudgetRange,
  formatCurrency,
  formatDate,
  formatDateTime,
  isOverdue,
  relativeDays,
} from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/supabase';

const ACTIVITY_ICONS: Record<string, string> = {
  note: '📝',
  call: '📞',
  email: '✉️',
  whatsapp: '💬',
  meeting: '🤝',
  site_visit: '🏠',
  status_change: '🔄',
  quote_sent: '📄',
  payment: '💰',
  system: '⚙️',
};

const PIPELINE_STAGES = [
  { key: 'new', label: 'New' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'site_visit_scheduled', label: 'Visit Sched.' },
  { key: 'site_visit_completed', label: 'Visit Done' },
  { key: 'quote_drafting', label: 'Quoting' },
  { key: 'quote_sent', label: 'Quote Sent' },
  { key: 'negotiation', label: 'Negotiation' },
  { key: 'won', label: 'Won' },
] as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PipelineBar({ lead }: { lead: any }) {
  const currentIdx = PIPELINE_STAGES.findIndex((s) => s.key === lead.status);
  const isTerminal = lead.status === 'lost';

  if (isTerminal) {
    return (
      <div className="flex items-center gap-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        <span className="font-medium">Lost</span>
        {lead.lost_reason && <span className="text-muted-foreground">— {lead.lost_reason}</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 overflow-x-auto py-2">
      {PIPELINE_STAGES.map((stage, idx) => {
        const isActive = stage.key === lead.status;
        const isDone = idx < currentIdx;
        return (
          <div key={stage.key} className="flex items-center gap-1 shrink-0">
            <div
              className={`rounded px-2 py-1 text-xs font-medium whitespace-nowrap ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : isDone
                    ? 'bg-green-100 text-green-700'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {isDone ? '✓ ' : ''}
              {stage.label}
            </div>
            {idx < PIPELINE_STAGES.length - 1 && (
              <span className="text-muted-foreground text-xs">→</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const navigate = useNavigate();

  const { data: lead, isLoading } = useLeadDetail(id!);
  const { data: activities = [] } = useLeadActivities(id!);
  const { data: tasks = [] } = useLeadTasks(id!);
  const { data: attachments = [] } = useLeadAttachments(id!);
  const { data: siteVisits = [] } = useLeadSiteVisits(id!);
  const { data: quotes = [] } = useLeadQuotes(id!);

  const { data: staff = [] } = useStaffProfiles();
  const updateStatus = useUpdateLeadStatus();
  const updateField = useUpdateLeadField();
  const deleteLead = useDeleteLead();
  const convertLead = useConvertLead();
  const addActivity = useAddActivity();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const scheduleVisit = useScheduleLeadSiteVisit();

  const [noteText, setNoteText] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDue, setTaskDue] = useState('');
  const [lostReason, setLostReason] = useState('');
  const [pendingStatus, setPendingStatus] = useState('');
  const [newFollowUp, setNewFollowUp] = useState('');
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Edit-mode draft state
  const [draftEmail, setDraftEmail] = useState('');
  const [draftPhone, setDraftPhone] = useState('');
  const [draftWhatsapp, setDraftWhatsapp] = useState('');
  const [draftLocation, setDraftLocation] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [draftBudgetMin, setDraftBudgetMin] = useState('');
  const [draftBudgetMax, setDraftBudgetMax] = useState('');
  const [draftSource, setDraftSource] = useState('');
  const [draftService, setDraftService] = useState('');

  // Site visit form
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [visitStart, setVisitStart] = useState('');
  const [visitEnd, setVisitEnd] = useState('');
  const [visitPurpose, setVisitPurpose] = useState('');
  const [visitAssignee, setVisitAssignee] = useState('');

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!lead) {
    return <div className="p-6 text-muted-foreground">Lead not found.</div>;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const owner = (lead as any).owner as { id: string; full_name: string | null } | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const service = (lead as any).service as { id: string; title: string } | null;

  const handleStatusChange = (s: string) => {
    const enumStatus = s as Enums<'lead_status'>;
    if (enumStatus === 'lost') {
      setPendingStatus('lost');
      setLostReason('');
      return;
    }
    if (!profile?.id) return;
    void updateStatus.mutateAsync({ leadId: lead.id, status: enumStatus, actorId: profile.id });
  };

  const confirmLost = () => {
    if (!profile?.id) return;
    void updateStatus
      .mutateAsync({ leadId: lead.id, status: 'lost', lostReason, actorId: profile.id })
      .then(() => setPendingStatus(''));
  };

  const handleAddNote = () => {
    if (!noteText.trim() || !profile?.id) return;
    void addActivity
      .mutateAsync({
        leadId: lead.id,
        actorId: profile.id,
        subject: noteText.trim(),
        activityType: 'note',
      })
      .then(() => setNoteText(''));
  };

  const handleAddTask = () => {
    if (!taskTitle.trim() || !profile?.id) return;
    void createTask
      .mutateAsync({
        leadId: lead.id,
        createdBy: profile.id,
        title: taskTitle.trim(),
        dueAt: taskDue || undefined,
      })
      .then(() => {
        setTaskTitle('');
        setTaskDue('');
      });
  };

  const handleCompleteTask = (taskId: string) => {
    void updateTask.mutateAsync({
      taskId,
      leadId: lead.id,
      update: { status: 'done', completed_at: new Date().toISOString() },
    });
  };

  const handleConvert = () => {
    void convertLead
      .mutateAsync(lead.id)
      .then((result) => navigate(`/customers/${result.customer_id}`));
  };

  const handleSetFollowUp = () => {
    if (!newFollowUp) return;
    void updateField
      .mutateAsync({ leadId: lead.id, field: 'next_follow_up_at', value: newFollowUp })
      .then(() => setNewFollowUp(''));
  };

  const handleScheduleVisit = () => {
    if (!visitStart) return;
    void scheduleVisit
      .mutateAsync({
        leadId: lead.id,
        scheduledStart: visitStart,
        scheduledEnd: visitEnd || null,
        assignedTo: visitAssignee || null,
        purpose: visitPurpose || null,
      })
      .then(() => {
        setShowVisitForm(false);
        setVisitStart('');
        setVisitEnd('');
        setVisitPurpose('');
        setVisitAssignee('');
      });
  };

  const handleDelete = async () => {
    await deleteLead.mutateAsync(lead.id);
    navigate('/leads');
  };

  const enterEditMode = () => {
    setDraftEmail(lead.email ?? '');
    setDraftPhone(lead.phone ?? '');
    setDraftWhatsapp(lead.whatsapp_number ?? '');
    setDraftLocation(lead.location_text ?? '');
    setDraftDescription(lead.project_description ?? '');
    setDraftBudgetMin(lead.budget_min_minor != null ? String(lead.budget_min_minor / 100) : '');
    setDraftBudgetMax(lead.budget_max_minor != null ? String(lead.budget_max_minor / 100) : '');
    setDraftSource(lead.source ?? '');
    setDraftService(lead.service_interest ?? '');
    setEditMode(true);
  };

  const saveEdits = async () => {
    const updates: Record<string, unknown> = {
      email: draftEmail.trim() || null,
      phone: draftPhone.trim() || null,
      whatsapp_number: draftWhatsapp.trim() || null,
      location_text: draftLocation.trim() || null,
      project_description: draftDescription.trim() || null,
      budget_min_minor: draftBudgetMin ? Math.round(parseFloat(draftBudgetMin) * 100) : null,
      budget_max_minor: draftBudgetMax ? Math.round(parseFloat(draftBudgetMax) * 100) : null,
      source: draftSource.trim() || null,
      service_interest: draftService.trim() || null,
    };
    for (const [field, value] of Object.entries(updates)) {
      await updateField.mutateAsync({ leadId: lead.id, field, value });
    }
    setEditMode(false);
  };

  const handleGetSignedUrl = async (attachmentId: string, storagePath: string) => {
    if (signedUrls[attachmentId]) {
      window.open(signedUrls[attachmentId], '_blank');
      return;
    }
    const { data, error } = await supabase.storage
      .from('lead-uploads')
      .createSignedUrl(storagePath, 3600);
    if (!error && data?.signedUrl) {
      setSignedUrls((prev) => ({ ...prev, [attachmentId]: data.signedUrl }));
      window.open(data.signedUrl, '_blank');
    }
  };

  const activeTasks = tasks.filter((t) => t.status !== 'done' && t.status !== 'cancelled');
  const doneTasks = tasks.filter((t) => t.status === 'done' || t.status === 'cancelled');

  const inp = 'mt-0.5 w-full rounded border border-border px-2 py-1.5 text-sm';

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link to="/leads" className="hover:underline">
            Leads
          </Link>
          <span>/</span>
          <span>#{lead.lead_number}</span>
        </div>

        {/* Pipeline Progress Bar */}
        <PipelineBar lead={lead} />

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{lead.full_name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Lead #{lead.lead_number} · Created {formatDate(lead.created_at)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Status */}
            <div className="flex flex-col gap-0.5">
              <label className="text-xs text-muted-foreground">Status</label>
              <select
                value={lead.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={updateStatus.isPending}
                className="rounded border border-border bg-background px-3 py-1.5 text-sm disabled:opacity-60"
              >
                {LEAD_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
            {/* Priority */}
            <div className="flex flex-col gap-0.5">
              <label className="text-xs text-muted-foreground">Priority</label>
              <select
                value={lead.priority}
                onChange={(e) =>
                  void updateField.mutateAsync({
                    leadId: lead.id,
                    field: 'priority',
                    value: e.target.value,
                  })
                }
                disabled={updateField.isPending}
                className="rounded border border-border bg-background px-3 py-1.5 text-sm disabled:opacity-60"
              >
                {LEAD_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            {/* Status/priority badges */}
            <div className="flex gap-1 self-end">
              <LeadStatusBadge status={lead.status} />
              <LeadPriorityBadge priority={lead.priority} />
            </div>
            {/* Advance status */}
            {NEXT_STATUS[lead.status] && (
              <button
                onClick={() => handleStatusChange(NEXT_STATUS[lead.status])}
                disabled={updateStatus.isPending}
                className="self-end rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-50"
              >
                → {NEXT_STATUS[lead.status].replace(/_/g, ' ')}
              </button>
            )}
            {/* Convert / View Customer */}
            {lead.converted_customer_id ? (
              <Link
                to={`/customers/${lead.converted_customer_id}`}
                className="self-end rounded bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700"
              >
                View Customer →
              </Link>
            ) : (
              <button
                onClick={handleConvert}
                disabled={convertLead.isPending}
                className="self-end rounded border border-green-600 px-3 py-1.5 text-sm text-green-700 hover:bg-green-50 disabled:opacity-50"
              >
                {convertLead.isPending ? 'Converting…' : 'Convert to Customer'}
              </button>
            )}
            {/* Edit / Save / Cancel */}
            <button
              onClick={editMode ? saveEdits : enterEditMode}
              disabled={updateField.isPending}
              className="self-end rounded border border-border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50"
            >
              {editMode ? (updateField.isPending ? 'Saving…' : 'Save Changes') : 'Edit'}
            </button>
            {editMode && (
              <button
                onClick={() => setEditMode(false)}
                className="self-end rounded border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
            )}
            {/* Delete */}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="self-end rounded border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left / Main */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Info */}
          <section className="rounded-lg border border-border p-4">
            <h2 className="mb-3 font-medium">Contact Info</h2>
            {editMode ? (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <label className="text-xs text-muted-foreground">Email</label>
                  <input
                    type="email"
                    value={draftEmail}
                    onChange={(e) => setDraftEmail(e.target.value)}
                    className={inp}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Phone</label>
                  <input
                    type="tel"
                    value={draftPhone}
                    onChange={(e) => setDraftPhone(e.target.value)}
                    className={inp}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">WhatsApp</label>
                  <input
                    type="tel"
                    value={draftWhatsapp}
                    onChange={(e) => setDraftWhatsapp(e.target.value)}
                    className={inp}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Preferred contact</label>
                  <p className="mt-0.5 text-sm capitalize">
                    {lead.preferred_contact_method ?? '—'}
                  </p>
                </div>
              </div>
            ) : (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Email</dt>
                <dd>
                  {lead.email ? (
                    <a href={`mailto:${lead.email}`} className="text-primary hover:underline">
                      {lead.email}
                    </a>
                  ) : (
                    '—'
                  )}
                </dd>
                <dt className="text-muted-foreground">Phone</dt>
                <dd>
                  {lead.phone ? (
                    <a href={`tel:${lead.phone}`} className="text-primary hover:underline">
                      {lead.phone}
                    </a>
                  ) : (
                    '—'
                  )}
                </dd>
                <dt className="text-muted-foreground">WhatsApp</dt>
                <dd>
                  {lead.whatsapp_number ? (
                    <a
                      href={`https://wa.me/${lead.whatsapp_number.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline"
                    >
                      {lead.whatsapp_number}
                    </a>
                  ) : (
                    '—'
                  )}
                </dd>
                <dt className="text-muted-foreground">Preferred contact</dt>
                <dd className="capitalize">{lead.preferred_contact_method ?? '—'}</dd>
              </dl>
            )}
          </section>

          {/* Project Details */}
          <section className="rounded-lg border border-border p-4">
            <h2 className="mb-3 font-medium">Project Details</h2>
            {editMode ? (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <label className="text-xs text-muted-foreground">Service</label>
                  <input
                    value={draftService}
                    onChange={(e) => setDraftService(e.target.value)}
                    className={inp}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Source</label>
                  <input
                    value={draftSource}
                    onChange={(e) => setDraftSource(e.target.value)}
                    className={inp}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground">Location</label>
                  <input
                    value={draftLocation}
                    onChange={(e) => setDraftLocation(e.target.value)}
                    className={inp}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Budget Min (₹)</label>
                  <input
                    type="number"
                    value={draftBudgetMin}
                    onChange={(e) => setDraftBudgetMin(e.target.value)}
                    className={inp}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Budget Max (₹)</label>
                  <input
                    type="number"
                    value={draftBudgetMax}
                    onChange={(e) => setDraftBudgetMax(e.target.value)}
                    className={inp}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground">Description</label>
                  <textarea
                    value={draftDescription}
                    onChange={(e) => setDraftDescription(e.target.value)}
                    rows={3}
                    className={inp}
                  />
                </div>
              </div>
            ) : (
              <>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <dt className="text-muted-foreground">Service</dt>
                  <dd>{service?.title ?? lead.service_interest ?? '—'}</dd>
                  <dt className="text-muted-foreground">Location</dt>
                  <dd>{lead.location_text ?? '—'}</dd>
                  <dt className="text-muted-foreground">Budget</dt>
                  <dd>{formatBudgetRange(lead.budget_min_minor, lead.budget_max_minor)}</dd>
                  <dt className="text-muted-foreground">Source</dt>
                  <dd className="capitalize">{lead.source ?? '—'}</dd>
                </dl>
                {lead.project_description && (
                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground mb-1">Description</p>
                    <p className="text-sm whitespace-pre-wrap">{lead.project_description}</p>
                  </div>
                )}
              </>
            )}
          </section>

          {/* Site Visits */}
          <section className="rounded-lg border border-border p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-medium">Site Visits</h2>
              <button
                onClick={() => setShowVisitForm((v) => !v)}
                className="text-xs text-primary hover:underline"
              >
                + Schedule Visit
              </button>
            </div>

            {showVisitForm && (
              <div className="mb-4 grid grid-cols-2 gap-2 rounded border border-border p-3 bg-muted/20">
                <div className="col-span-2">
                  <label className="mb-1 block text-xs text-muted-foreground">Start *</label>
                  <input
                    type="datetime-local"
                    value={visitStart}
                    onChange={(e) => setVisitStart(e.target.value)}
                    className="w-full rounded border border-border px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">End</label>
                  <input
                    type="datetime-local"
                    value={visitEnd}
                    onChange={(e) => setVisitEnd(e.target.value)}
                    className="w-full rounded border border-border px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Assigned to</label>
                  <select
                    value={visitAssignee}
                    onChange={(e) => setVisitAssignee(e.target.value)}
                    className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
                  >
                    <option value="">Unassigned</option>
                    {staff.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name ?? s.id}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-xs text-muted-foreground">Purpose</label>
                  <input
                    placeholder="e.g. Initial measurement, Site inspection…"
                    value={visitPurpose}
                    onChange={(e) => setVisitPurpose(e.target.value)}
                    className="w-full rounded border border-border px-2 py-1.5 text-sm"
                  />
                </div>
                <div className="col-span-2 flex justify-end gap-2">
                  <button
                    onClick={() => setShowVisitForm(false)}
                    className="rounded border border-border px-3 py-1 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleScheduleVisit}
                    disabled={!visitStart || scheduleVisit.isPending}
                    className="rounded bg-primary px-3 py-1 text-sm text-primary-foreground disabled:opacity-50"
                  >
                    Schedule
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {siteVisits.map((v) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const assignee = (v as any).assigned as { full_name: string | null } | null;
                return (
                  <div
                    key={v.id}
                    className="flex items-center justify-between rounded border border-border px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">{formatDateTime(v.scheduled_start)}</p>
                      {v.purpose && <p className="text-xs text-muted-foreground">{v.purpose}</p>}
                      {assignee?.full_name && (
                        <p className="text-xs text-muted-foreground">
                          Assigned: {assignee.full_name}
                        </p>
                      )}
                    </div>
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        v.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : v.status === 'cancelled'
                            ? 'bg-red-100 text-red-600'
                            : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {v.status}
                    </span>
                  </div>
                );
              })}
              {siteVisits.length === 0 && (
                <p className="text-sm text-muted-foreground">No site visits yet.</p>
              )}
            </div>
          </section>

          {/* Related Quotes */}
          <section className="rounded-lg border border-border p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-medium">Quotations</h2>
              {lead.converted_customer_id ? (
                <Link
                  to={`/quotes/new?customerId=${lead.converted_customer_id}&leadId=${lead.id}`}
                  className="text-xs text-primary hover:underline"
                >
                  + New Quote
                </Link>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Convert lead first to create quote
                </span>
              )}
            </div>
            {quotes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No quotations linked to this lead.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="pb-2 pr-3">Quote #</th>
                      <th className="pb-2 pr-3">Status</th>
                      <th className="pb-2 pr-3 text-right">Total</th>
                      <th className="pb-2 pr-3">Order</th>
                      <th className="pb-2">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {(quotes as any[]).map((q) => (
                      <tr key={q.id}>
                        <td className="py-2 pr-3">
                          <Link
                            to={`/quotes/${q.id}`}
                            className="font-mono text-primary hover:underline"
                          >
                            {q.quote_number}
                          </Link>
                        </td>
                        <td className="py-2 pr-3 capitalize text-muted-foreground">
                          {q.status.replace(/_/g, ' ')}
                        </td>
                        <td className="py-2 pr-3 text-right font-mono">
                          {q.current_version ? formatCurrency(q.current_version.total_minor) : '—'}
                        </td>
                        <td className="py-2 pr-3">
                          {q.order ? (
                            <Link
                              to={`/orders/${q.order.id}`}
                              className="font-mono text-primary hover:underline text-xs"
                            >
                              {q.order.order_number}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>
                        <td className="py-2 text-muted-foreground">{formatDate(q.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Activity Timeline */}
          <section className="rounded-lg border border-border p-4">
            <h2 className="mb-3 font-medium">Activity Timeline</h2>
            <div className="mb-4 flex gap-2">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={2}
                placeholder="Add a note…"
                className="flex-1 rounded border border-border px-3 py-2 text-sm"
              />
              <button
                onClick={handleAddNote}
                disabled={!noteText.trim() || addActivity.isPending}
                className="self-end rounded bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
              >
                Add Note
              </button>
            </div>
            <div className="space-y-3">
              {activities.map((act) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const actor = (act as any).actor as { full_name: string | null } | null;
                return (
                  <div key={act.id} className="flex gap-3 text-sm">
                    <span className="text-lg">{ACTIVITY_ICONS[act.activity_type] ?? '•'}</span>
                    <div className="flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-medium">{act.subject}</span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDateTime(act.occurred_at)}
                        </span>
                      </div>
                      {act.body && (
                        <p className="mt-0.5 text-muted-foreground whitespace-pre-wrap">
                          {act.body}
                        </p>
                      )}
                      {actor?.full_name && (
                        <p className="mt-0.5 text-xs text-muted-foreground">by {actor.full_name}</p>
                      )}
                    </div>
                  </div>
                );
              })}
              {activities.length === 0 && (
                <p className="text-sm text-muted-foreground">No activities yet.</p>
              )}
            </div>
          </section>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Lead Details */}
          <section className="rounded-lg border border-border p-4">
            <h2 className="mb-3 font-medium text-sm">Lead Details</h2>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Owner</dt>
                <dd>
                  <select
                    value={owner?.id ?? ''}
                    onChange={(e) =>
                      void updateField.mutateAsync({
                        leadId: lead.id,
                        field: 'owner_id',
                        value: e.target.value || null,
                      })
                    }
                    className="mt-0.5 w-full rounded border border-border bg-background px-2 py-1 text-sm"
                  >
                    <option value="">Unassigned</option>
                    {staff.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name ?? s.id}
                      </option>
                    ))}
                  </select>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Created</dt>
                <dd className="text-sm">{formatDateTime(lead.created_at)}</dd>
              </div>
              {lead.consented_at && (
                <div>
                  <dt className="text-xs text-muted-foreground">Consented</dt>
                  <dd className="text-sm">{formatDate(lead.consented_at)}</dd>
                </div>
              )}
              {lead.lost_reason && (
                <div>
                  <dt className="text-xs text-muted-foreground">Lost reason</dt>
                  <dd className="text-sm text-red-600">{lead.lost_reason}</dd>
                </div>
              )}
            </dl>
          </section>

          {/* Follow-up */}
          <section className="rounded-lg border border-border p-4">
            <h2 className="mb-3 font-medium text-sm">Follow-up</h2>
            {lead.next_follow_up_at && (
              <p
                className={`mb-2 text-sm ${isOverdue(lead.next_follow_up_at) ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}
              >
                {relativeDays(lead.next_follow_up_at)} · {formatDateTime(lead.next_follow_up_at)}
              </p>
            )}
            <input
              type="datetime-local"
              value={newFollowUp}
              onChange={(e) => setNewFollowUp(e.target.value)}
              className="w-full rounded border border-border px-2 py-1.5 text-sm"
            />
            <button
              onClick={handleSetFollowUp}
              disabled={!newFollowUp || updateField.isPending}
              className="mt-2 w-full rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-50"
            >
              Set Follow-up
            </button>
          </section>

          {/* Attachments */}
          <section className="rounded-lg border border-border p-4">
            <h2 className="mb-3 font-medium text-sm">Attachments</h2>
            {attachments.length === 0 && (
              <p className="text-sm text-muted-foreground">No attachments.</p>
            )}
            <div className="space-y-2">
              {attachments.map((att) => (
                <div key={att.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate text-muted-foreground">
                    {att.original_filename ?? att.storage_path.split('/').pop()}
                  </span>
                  <button
                    onClick={() => void handleGetSignedUrl(att.id, att.storage_path)}
                    className="shrink-0 text-xs text-primary hover:underline"
                  >
                    Get link
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Tasks */}
          <section className="rounded-lg border border-border p-4">
            <h2 className="mb-3 font-medium text-sm">Tasks</h2>
            <div className="mb-3 space-y-2">
              <input
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="New task title…"
                className="w-full rounded border border-border px-2 py-1.5 text-sm"
              />
              <input
                type="datetime-local"
                value={taskDue}
                onChange={(e) => setTaskDue(e.target.value)}
                className="w-full rounded border border-border px-2 py-1.5 text-sm"
              />
              <button
                onClick={handleAddTask}
                disabled={!taskTitle.trim() || createTask.isPending}
                className="w-full rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-50"
              >
                Add Task
              </button>
            </div>

            <div className="space-y-2">
              {activeTasks.map((task) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const assignee = (task as any).assignee as { full_name: string | null } | null;
                const overdue = task.due_at && isOverdue(task.due_at) && task.status === 'todo';
                return (
                  <div key={task.id} className="flex items-start gap-2 text-sm">
                    <button
                      onClick={() => handleCompleteTask(task.id)}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 border-border hover:border-green-500"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={overdue ? 'text-red-600 font-medium' : ''}>{task.title}</p>
                      {task.due_at && (
                        <p
                          className={`text-xs ${overdue ? 'text-red-500' : 'text-muted-foreground'}`}
                        >
                          {relativeDays(task.due_at)}
                        </p>
                      )}
                      {assignee?.full_name && (
                        <p className="text-xs text-muted-foreground">{assignee.full_name}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {doneTasks.length > 0 && (
              <details className="mt-3">
                <summary className="cursor-pointer text-xs text-muted-foreground">
                  {doneTasks.length} completed task{doneTasks.length !== 1 ? 's' : ''}
                </summary>
                <div className="mt-2 space-y-1">
                  {doneTasks.map((task) => (
                    <p key={task.id} className="text-sm line-through text-muted-foreground">
                      {task.title}
                    </p>
                  ))}
                </div>
              </details>
            )}
          </section>
        </div>
      </div>

      {/* Lost reason modal */}
      {pendingStatus === 'lost' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-lg border border-border bg-background p-6 shadow-xl">
            <h2 className="mb-3 text-base font-semibold">Mark as Lost</h2>
            <label className="mb-1 block text-sm text-muted-foreground">Reason for loss</label>
            <textarea
              value={lostReason}
              onChange={(e) => setLostReason(e.target.value)}
              rows={3}
              className="w-full rounded border border-border px-3 py-2 text-sm"
              placeholder="e.g. Budget too low, went with competitor…"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setPendingStatus('')}
                className="rounded border border-border px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmLost}
                disabled={!lostReason.trim() || updateStatus.isPending}
                className="rounded bg-red-600 px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                Confirm Lost
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-lg border border-border bg-background p-6 shadow-xl">
            <h2 className="mb-2 text-base font-semibold text-red-600">Delete Lead?</h2>
            <p className="mb-3 text-sm text-muted-foreground">
              This will permanently delete lead <strong>{lead.full_name}</strong> (#
              {lead.lead_number}).
            </p>
            {(siteVisits.length > 0 || quotes.length > 0) && (
              <div className="mb-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                ⚠ Warning: This lead has{' '}
                {[
                  siteVisits.length > 0 &&
                    `${siteVisits.length} site visit${siteVisits.length > 1 ? 's' : ''}`,
                  quotes.length > 0 && `${quotes.length} quotation${quotes.length > 1 ? 's' : ''}`,
                ]
                  .filter(Boolean)
                  .join(' and ')}{' '}
                linked to it. These will also be affected.
              </div>
            )}
            {lead.converted_customer_id && (
              <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                ⚠ This lead has already been converted to a customer. Deleting the lead will NOT
                delete the customer record.
              </div>
            )}
            {deleteLead.error && (
              <p className="mb-2 text-sm text-red-600">{(deleteLead.error as Error).message}</p>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded border border-border px-4 py-2 text-sm hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLead.isPending}
                className="rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteLead.isPending ? 'Deleting…' : 'Delete Lead'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

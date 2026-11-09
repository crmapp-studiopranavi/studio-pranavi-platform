/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  useProjectDetail,
  useProjectMilestones,
  useProjectInstallations,
  useProjectActivities,
  useUpdateProject,
  useCreateMilestone,
  useUpdateMilestone,
  useCreateInstallation,
  useUpdateInstallation,
} from '@/lib/hooks/use-project-detail';
import { formatCurrency, formatDate, formatDateTime, isOverdue } from '@/lib/format';
import { useAuth } from '@/lib/auth-context';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useMeasurements } from '@/lib/hooks/use-measurements';
import { useInstallations } from '@/lib/hooks/use-installations';
import { useInvoicesByProject } from '@/lib/hooks/use-invoices';

const PROJECT_STATUS_LABELS: Record<string, string> = {
  planned: 'Planned',
  active: 'Active',
  blocked: 'Blocked',
  on_hold: 'On Hold',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const PROJECT_STATUS_COLORS: Record<string, string> = {
  planned: 'bg-gray-100 text-gray-600',
  active: 'bg-blue-100 text-blue-700',
  blocked: 'bg-red-100 text-red-700',
  on_hold: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

const MILESTONE_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  blocked: 'bg-red-100 text-red-700',
  skipped: 'bg-gray-100 text-gray-400',
};

const MILESTONE_NEXT_STATUS: Record<string, string> = {
  pending: 'in_progress',
  in_progress: 'completed',
};

const INSTALLATION_STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-cyan-100 text-cyan-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  rescheduled: 'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

function ProjectStatusBadge({ status }: { status: string }) {
  const cls = PROJECT_STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {PROJECT_STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: project, isLoading, error } = useProjectDetail(id ?? '');
  const { data: milestones } = useProjectMilestones(id ?? '');
  const { data: installations } = useProjectInstallations(id ?? '');
  const { data: activities } = useProjectActivities(id ?? '');

  const updateProject = useUpdateProject();
  const createMilestone = useCreateMilestone();
  const updateMilestone = useUpdateMilestone();
  const createInstallation = useCreateInstallation();
  const updateInstallation = useUpdateInstallation();

  const [actionError, setActionError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'measurements' | 'installations'>(
    'overview'
  );

  const { profile } = useAuth();
  const qc = useQueryClient();
  const { data: measurements, isLoading: loadingMeasurements } = useMeasurements({
    projectId: id ?? '',
  });
  const { data: projectInstallationsList, isLoading: loadingInstallationsList } = useInstallations({
    projectId: id ?? '',
  });
  const { data: projectInvoices } = useInvoicesByProject(id ?? '');

  // Measurement quick-add form state
  const [measureArea, setMeasureArea] = useState('');
  const [measureW, setMeasureW] = useState('');
  const [measureH, setMeasureH] = useState('');
  const [measureD, setMeasureD] = useState('');
  const [measureQty, setMeasureQty] = useState('1');
  const [measureUnit, setMeasureUnit] = useState('');
  const [measureNotes, setMeasureNotes] = useState('');
  const [measureSaving, setMeasureSaving] = useState(false);

  // Installations tab form state
  const [showInstallTabForm, setShowInstallTabForm] = useState(false);
  const [installTabStart, setInstallTabStart] = useState('');
  const [installTabEnd, setInstallTabEnd] = useState('');
  const [installTabTeam, setInstallTabTeam] = useState('');
  const [installTabSaving, setInstallTabSaving] = useState(false);

  // Milestone add form
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [msName, setMsName] = useState('');
  const [msDueDate, setMsDueDate] = useState('');

  // Installation schedule form
  const [showScheduleInstall, setShowScheduleInstall] = useState(false);
  const [instStart, setInstStart] = useState('');
  const [instEnd, setInstEnd] = useState('');
  const [instTeam, setInstTeam] = useState('');

  // Installation complete form
  const [completingInstall, setCompletingInstall] = useState<string | null>(null);
  const [instNotes, setInstNotes] = useState('');
  const [instSignoff, setInstSignoff] = useState('');

  // Internal notes edit
  const [editInternalNotes, setEditInternalNotes] = useState(false);
  const [internalNotesValue, setInternalNotesValue] = useState('');

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground text-sm">
        Loading project…
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex h-64 items-center justify-center text-destructive text-sm">
        Project not found.{' '}
        <Link to="/projects" className="ml-2 underline">
          Back
        </Link>
      </div>
    );
  }

  const status = project.status as string;
  const customer = (project as any).customer as { id: string; display_name: string } | null;
  const manager = (project as any).manager as { id: string; full_name: string } | null;
  const linkedOrder = (project as any).order as {
    id: string;
    order_number: string;
    status: string;
    total_minor: number;
  } | null;

  const doUpdateStatus = async (newStatus: string) => {
    if (!id) return;
    setActionError(null);
    try {
      const today = new Date().toISOString().split('T')[0];
      await updateProject.mutateAsync({
        projectId: id,
        update: {
          status: newStatus as any,
          ...(newStatus === 'completed' ? { actual_completion_date: today } : {}),
        },
      });
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Status update failed');
    }
  };

  const doAddMilestone = async () => {
    if (!id || !msName.trim()) return;
    setActionError(null);
    try {
      await createMilestone.mutateAsync({
        projectId: id,
        name: msName.trim(),
        dueDate: msDueDate || undefined,
        sortOrder: (milestones?.length ?? 0) + 1,
      });
      setMsName('');
      setMsDueDate('');
      setShowAddMilestone(false);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Add milestone failed');
    }
  };

  const doAdvanceMilestone = async (msId: string, currentStatus: string, projectId: string) => {
    const next = MILESTONE_NEXT_STATUS[currentStatus];
    if (!next) return;
    setActionError(null);
    try {
      await updateMilestone.mutateAsync({
        milestoneId: msId,
        projectId,
        update: {
          status: next as any,
          ...(next === 'completed' ? { completed_at: new Date().toISOString() } : {}),
        },
      });
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Milestone update failed');
    }
  };

  const doScheduleInstallation = async () => {
    if (!id) return;
    setActionError(null);
    try {
      await createInstallation.mutateAsync({
        projectId: id,
        scheduledStart: instStart || undefined,
        scheduledEnd: instEnd || undefined,
        assignedTeam: instTeam || undefined,
      });
      setInstStart('');
      setInstEnd('');
      setInstTeam('');
      setShowScheduleInstall(false);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Schedule installation failed');
    }
  };

  const doCompleteInstallation = async () => {
    if (!completingInstall || !id) return;
    setActionError(null);
    try {
      await updateInstallation.mutateAsync({
        installationId: completingInstall,
        projectId: id,
        update: {
          status: 'completed',
          completion_notes: instNotes || null,
          customer_signoff_name: instSignoff || null,
          signed_off_at: instSignoff ? new Date().toISOString() : null,
        },
      });
      setCompletingInstall(null);
      setInstNotes('');
      setInstSignoff('');
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Complete installation failed');
    }
  };

  const doSaveInternalNotes = async () => {
    if (!id) return;
    await updateProject.mutateAsync({
      projectId: id,
      update: { internal_notes: internalNotesValue },
    });
    setEditInternalNotes(false);
  };

  const canEdit = ['admin', 'manager', 'operations'].includes(profile?.role ?? '');

  const doAddMeasurement = async () => {
    if (!id || !measureArea.trim()) return;
    setMeasureSaving(true);
    setActionError(null);
    try {
      const { error } = await supabase.from('measurements').insert({
        project_id: id,
        area_or_item: measureArea.trim(),
        width_mm: measureW ? parseFloat(measureW) : undefined,
        height_mm: measureH ? parseFloat(measureH) : undefined,
        depth_mm: measureD ? parseFloat(measureD) : undefined,
        quantity: measureQty ? parseFloat(measureQty) : 1,
        unit: measureUnit.trim() || undefined,
        notes: measureNotes.trim() || undefined,
        recorded_by: profile?.id ?? undefined,
      });
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['measurements'] });
      setMeasureArea('');
      setMeasureW('');
      setMeasureH('');
      setMeasureD('');
      setMeasureQty('1');
      setMeasureUnit('');
      setMeasureNotes('');
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to add measurement');
    } finally {
      setMeasureSaving(false);
    }
  };

  const doDeleteMeasurement = async (measurementId: string) => {
    setActionError(null);
    try {
      const { error } = await supabase.from('measurements').delete().eq('id', measurementId);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['measurements'] });
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to delete measurement');
    }
  };

  const doScheduleInstallTab = async () => {
    if (!id) return;
    setInstallTabSaving(true);
    setActionError(null);
    try {
      const { error } = await supabase.from('installations').insert({
        project_id: id,
        scheduled_start: installTabStart || null,
        scheduled_end: installTabEnd || null,
        assigned_team: installTabTeam.trim() || null,
        status: 'scheduled',
      });
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['installations'] });
      setInstallTabStart('');
      setInstallTabEnd('');
      setInstallTabTeam('');
      setShowInstallTabForm(false);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to schedule installation');
    } finally {
      setInstallTabSaving(false);
    }
  };

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/projects" className="hover:underline">
          Projects
        </Link>
        <span>/</span>
        <span className="font-mono">{project.project_number}</span>
      </div>

      {/* Header */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{project.name}</h1>
            <ProjectStatusBadge status={status} />
          </div>
          <p className="mt-0.5 font-mono text-sm text-muted-foreground">{project.project_number}</p>
          {customer && (
            <p className="mt-1 text-sm text-muted-foreground">
              Customer:{' '}
              <Link to={`/customers/${customer.id}`} className="text-primary hover:underline">
                {customer.display_name}
              </Link>
            </p>
          )}
        </div>

        {/* Status select */}
        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => doUpdateStatus(e.target.value)}
            disabled={updateProject.isPending}
            className="rounded border border-border bg-background px-3 py-1.5 text-sm"
          >
            {Object.entries(PROJECT_STATUS_LABELS).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {actionError && (
        <div className="mb-4 rounded bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {actionError}
        </div>
      )}

      {/* Tab navigation */}
      <div className="mb-5 flex gap-1 border-b border-border">
        {(['overview', 'measurements', 'installations'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main left column */}
          <div className="space-y-6 lg:col-span-2">
            {/* Project info */}
            <div className="rounded border border-border p-4">
              <h2 className="mb-3 font-medium">Project Info</h2>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Start Date</dt>
                <dd>{formatDate(project.start_date) ?? '—'}</dd>
                <dt className="text-muted-foreground">Target Completion</dt>
                <dd>{formatDate(project.target_completion_date) ?? '—'}</dd>
                {project.actual_completion_date && (
                  <>
                    <dt className="text-muted-foreground">Actual Completion</dt>
                    <dd>{formatDate(project.actual_completion_date)}</dd>
                  </>
                )}
                {linkedOrder && (
                  <>
                    <dt className="text-muted-foreground">Linked Order</dt>
                    <dd>
                      <Link
                        to={`/orders/${linkedOrder.id}`}
                        className="font-mono text-primary hover:underline"
                      >
                        {linkedOrder.order_number}
                      </Link>
                      <span className="ml-2 text-muted-foreground">
                        {formatCurrency(linkedOrder.total_minor)}
                      </span>
                    </dd>
                  </>
                )}
              </dl>
              {project.scope && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Scope</p>
                  <p className="text-sm whitespace-pre-wrap">{project.scope}</p>
                </div>
              )}
            </div>

            {/* Milestones */}
            <div className="rounded border border-border p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-medium">Milestones</h2>
                <button
                  onClick={() => setShowAddMilestone(!showAddMilestone)}
                  className="rounded border border-border px-2 py-1 text-xs hover:bg-muted"
                >
                  + Add Milestone
                </button>
              </div>

              {showAddMilestone && (
                <div className="mb-4 space-y-2 rounded bg-muted/40 p-3">
                  <input
                    type="text"
                    placeholder="Milestone name *"
                    value={msName}
                    onChange={(e) => setMsName(e.target.value)}
                    className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
                  />
                  <input
                    type="date"
                    value={msDueDate}
                    onChange={(e) => setMsDueDate(e.target.value)}
                    className="rounded border border-border bg-background px-3 py-1.5 text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={doAddMilestone}
                      disabled={!msName.trim() || createMilestone.isPending}
                      className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setShowAddMilestone(false)}
                      className="rounded border border-border px-3 py-1 text-xs hover:bg-muted"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {!milestones || milestones.length === 0 ? (
                <p className="text-sm text-muted-foreground">No milestones yet.</p>
              ) : (
                <ul className="space-y-2">
                  {milestones.map((ms: any) => {
                    const overdue =
                      isOverdue(ms.due_date) && !['completed', 'skipped'].includes(ms.status ?? '');
                    const nextMs = MILESTONE_NEXT_STATUS[ms.status ?? ''];
                    return (
                      <li
                        key={ms.id}
                        className={`flex items-start justify-between rounded border px-3 py-2 text-sm ${overdue ? 'border-red-200 bg-red-50' : 'border-border'}`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${overdue ? 'text-red-700' : ''}`}>
                              {ms.name}
                            </span>
                            <span
                              className={`inline-flex rounded-full px-1.5 py-0.5 text-xs font-medium ${MILESTONE_STATUS_COLORS[ms.status ?? ''] ?? 'bg-gray-100 text-gray-600'}`}
                            >
                              {(ms.status ?? '').replace(/_/g, ' ')}
                            </span>
                            {overdue && (
                              <span className="text-xs text-red-600 font-medium">Overdue</span>
                            )}
                          </div>
                          {ms.due_date && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              Due: {formatDate(ms.due_date)}
                            </p>
                          )}
                          {ms.assignee && (
                            <p className="text-xs text-muted-foreground">
                              Assignee: {ms.assignee.full_name}
                            </p>
                          )}
                        </div>
                        {nextMs && (
                          <button
                            onClick={() => doAdvanceMilestone(ms.id, ms.status, id ?? '')}
                            className="ml-2 shrink-0 rounded border border-border px-2 py-0.5 text-xs hover:bg-muted capitalize"
                          >
                            → {nextMs.replace(/_/g, ' ')}
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Installations */}
            <div className="rounded border border-border p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-medium">Installations</h2>
                <button
                  onClick={() => setShowScheduleInstall(!showScheduleInstall)}
                  className="rounded border border-border px-2 py-1 text-xs hover:bg-muted"
                >
                  + Schedule Installation
                </button>
              </div>

              {showScheduleInstall && (
                <div className="mb-4 space-y-2 rounded bg-muted/40 p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium">Start</label>
                      <input
                        type="datetime-local"
                        value={instStart}
                        onChange={(e) => setInstStart(e.target.value)}
                        className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium">End</label>
                      <input
                        type="datetime-local"
                        value={instEnd}
                        onChange={(e) => setInstEnd(e.target.value)}
                        className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
                      />
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="Team name"
                    value={instTeam}
                    onChange={(e) => setInstTeam(e.target.value)}
                    className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={doScheduleInstallation}
                      disabled={createInstallation.isPending}
                      className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      Schedule
                    </button>
                    <button
                      onClick={() => setShowScheduleInstall(false)}
                      className="rounded border border-border px-3 py-1 text-xs hover:bg-muted"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {!installations || installations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No installations scheduled.</p>
              ) : (
                <ul className="space-y-3">
                  {installations.map((inst: any) => (
                    <li key={inst.id} className="rounded border border-border p-3 text-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex rounded-full px-1.5 py-0.5 text-xs font-medium ${INSTALLATION_STATUS_COLORS[inst.status ?? ''] ?? 'bg-gray-100 text-gray-600'}`}
                            >
                              {(inst.status ?? '').replace(/_/g, ' ')}
                            </span>
                            {inst.assigned_team && (
                              <span className="text-xs text-muted-foreground">
                                Team: {inst.assigned_team}
                              </span>
                            )}
                          </div>
                          {inst.scheduled_start && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {formatDateTime(inst.scheduled_start)}
                              {inst.scheduled_end && ` → ${formatDateTime(inst.scheduled_end)}`}
                            </p>
                          )}
                          {inst.installer && (
                            <p className="text-xs text-muted-foreground">
                              Lead: {inst.installer.full_name}
                            </p>
                          )}
                          {inst.status === 'completed' && (
                            <div className="mt-1 space-y-0.5">
                              {inst.completion_notes && (
                                <p className="text-xs">Notes: {inst.completion_notes}</p>
                              )}
                              {inst.customer_signoff_name && (
                                <p className="text-xs text-green-700">
                                  Signed off by: {inst.customer_signoff_name}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                        {['scheduled', 'in_progress'].includes(inst.status ?? '') && (
                          <div className="shrink-0 flex gap-1">
                            {inst.status === 'scheduled' && (
                              <button
                                onClick={() =>
                                  updateInstallation.mutateAsync({
                                    installationId: inst.id,
                                    projectId: id ?? '',
                                    update: { status: 'in_progress' },
                                  })
                                }
                                className="rounded border border-blue-300 px-2 py-0.5 text-xs text-blue-600 hover:bg-blue-50"
                              >
                                Start
                              </button>
                            )}
                            <button
                              onClick={() => setCompletingInstall(inst.id)}
                              className="rounded border border-green-300 px-2 py-0.5 text-xs text-green-700 hover:bg-green-50"
                            >
                              Complete
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Inline complete form */}
                      {completingInstall === inst.id && (
                        <div className="mt-3 space-y-2 rounded bg-muted/40 p-3">
                          <textarea
                            placeholder="Completion notes"
                            value={instNotes}
                            onChange={(e) => setInstNotes(e.target.value)}
                            rows={2}
                            className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
                          />
                          <input
                            type="text"
                            placeholder="Customer sign-off name"
                            value={instSignoff}
                            onChange={(e) => setInstSignoff(e.target.value)}
                            className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={doCompleteInstallation}
                              disabled={updateInstallation.isPending}
                              className="rounded bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-700 disabled:opacity-50"
                            >
                              Mark Complete
                            </button>
                            <button
                              onClick={() => setCompletingInstall(null)}
                              className="rounded border border-border px-3 py-1 text-xs hover:bg-muted"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Invoices */}
            <div className="rounded border border-border p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-medium">Invoices</h2>
                {project && customer && (
                  <Link
                    to={`/invoices/new?customerId=${project.customer_id}&projectId=${id}`}
                    className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
                  >
                    + Create Invoice
                  </Link>
                )}
              </div>
              {!projectInvoices || projectInvoices.length === 0 ? (
                <p className="text-sm text-muted-foreground">No invoices yet.</p>
              ) : (
                <ul className="space-y-2">
                  {(projectInvoices as any[]).map((inv) => (
                    <li key={inv.id} className="flex items-center justify-between text-sm">
                      <Link
                        to={`/invoices/${inv.id}`}
                        className="font-mono text-primary hover:underline"
                      >
                        {inv.invoice_number}
                      </Link>
                      <div className="flex items-center gap-3 text-muted-foreground text-xs">
                        <span className="capitalize">{inv.status?.replace(/_/g, ' ')}</span>
                        <span>{formatCurrency(inv.total_minor)}</span>
                        {inv.balance_minor > 0 && (
                          <span className="text-amber-600">
                            Due: {formatCurrency(inv.balance_minor)}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          {/* Right sidebar */}
          <div className="space-y-4">
            {/* Project details */}
            <div className="rounded border border-border p-4">
              <h3 className="mb-3 text-sm font-medium">Project Details</h3>
              <dl className="space-y-2 text-sm">
                {manager && (
                  <>
                    <dt className="text-muted-foreground">Manager</dt>
                    <dd>{manager.full_name}</dd>
                  </>
                )}
                <dt className="text-muted-foreground">Start Date</dt>
                <dd>{formatDate(project.start_date) ?? '—'}</dd>
                <dt className="text-muted-foreground">Target Completion</dt>
                <dd>{formatDate(project.target_completion_date) ?? '—'}</dd>
                {project.actual_completion_date && (
                  <>
                    <dt className="text-muted-foreground">Completed</dt>
                    <dd>{formatDate(project.actual_completion_date)}</dd>
                  </>
                )}
              </dl>
            </div>

            {/* Internal notes */}
            <div className="rounded border border-border p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-medium">Internal Notes</h3>
                {!editInternalNotes && (
                  <button
                    onClick={() => {
                      setInternalNotesValue(project.internal_notes ?? '');
                      setEditInternalNotes(true);
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Edit
                  </button>
                )}
              </div>
              {editInternalNotes ? (
                <div className="space-y-2">
                  <textarea
                    value={internalNotesValue}
                    onChange={(e) => setInternalNotesValue(e.target.value)}
                    rows={4}
                    className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={doSaveInternalNotes}
                      disabled={updateProject.isPending}
                      className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditInternalNotes(false)}
                      className="rounded border border-border px-3 py-1 text-xs hover:bg-muted"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {project.internal_notes || 'No internal notes.'}
                </p>
              )}
            </div>

            {/* Activity timeline */}
            <div className="rounded border border-border p-4">
              <h3 className="mb-3 text-sm font-medium">Activity</h3>
              {!activities || activities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity yet.</p>
              ) : (
                <ul className="space-y-3">
                  {activities.slice(0, 10).map((a: any) => (
                    <li key={a.id} className="text-xs">
                      <p className="font-medium text-foreground">{a.subject}</p>
                      <p className="text-muted-foreground mt-0.5">
                        {a.actor?.full_name ?? 'System'} · {formatDateTime(a.occurred_at)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Measurements Tab ── */}
      {activeTab === 'measurements' && (
        <div className="space-y-4">
          {loadingMeasurements ? (
            <p className="text-sm text-muted-foreground">Loading measurements…</p>
          ) : !measurements || measurements.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No measurements recorded for this project.
            </p>
          ) : (
            <div className="overflow-x-auto rounded border border-border">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                      Area / Item
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                      W × H × D (mm)
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                      Qty / Unit
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Notes</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                      Site Visit
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                      Recorded By
                    </th>
                    {canEdit && <th className="px-3 py-2" />}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(measurements as any[]).map((m) => (
                    <tr key={m.id} className="hover:bg-muted/20">
                      <td className="px-3 py-2 font-medium">{m.area_or_item}</td>
                      <td className="px-3 py-2 font-mono text-xs">
                        {[m.width_mm, m.height_mm, m.depth_mm]
                          .filter((v) => v != null)
                          .join(' × ') || '—'}
                      </td>
                      <td className="px-3 py-2">
                        {m.quantity ?? '—'}
                        {m.unit && <span className="ml-1 text-muted-foreground">{m.unit}</span>}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground max-w-xs truncate">
                        {m.notes || '—'}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {m.site_visit?.scheduled_start
                          ? formatDate(m.site_visit.scheduled_start)
                          : '—'}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {(m.recorded_by as any)?.full_name ?? '—'}
                      </td>
                      {canEdit && (
                        <td className="px-3 py-2">
                          <button
                            onClick={() => doDeleteMeasurement(m.id)}
                            className="text-xs text-red-500 hover:text-red-700"
                          >
                            Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Quick-add form */}
          {canEdit && (
            <div className="rounded border border-border p-4">
              <h3 className="mb-3 text-sm font-medium">Add Measurement</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Area / Item *"
                  value={measureArea}
                  onChange={(e) => setMeasureArea(e.target.value)}
                  className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
                />
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    placeholder="Width (mm)"
                    value={measureW}
                    onChange={(e) => setMeasureW(e.target.value)}
                    className="rounded border border-border bg-background px-2 py-1.5 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Height (mm)"
                    value={measureH}
                    onChange={(e) => setMeasureH(e.target.value)}
                    className="rounded border border-border bg-background px-2 py-1.5 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Depth (mm)"
                    value={measureD}
                    onChange={(e) => setMeasureD(e.target.value)}
                    className="rounded border border-border bg-background px-2 py-1.5 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Quantity"
                    value={measureQty}
                    onChange={(e) => setMeasureQty(e.target.value)}
                    className="rounded border border-border bg-background px-2 py-1.5 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Unit (e.g. piece, sqft)"
                    value={measureUnit}
                    onChange={(e) => setMeasureUnit(e.target.value)}
                    className="rounded border border-border bg-background px-2 py-1.5 text-sm"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Notes"
                  value={measureNotes}
                  onChange={(e) => setMeasureNotes(e.target.value)}
                  className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
                />
                <button
                  onClick={doAddMeasurement}
                  disabled={!measureArea.trim() || measureSaving}
                  className="rounded bg-blue-600 px-4 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {measureSaving ? 'Saving…' : 'Add Measurement'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Installations Tab ── */}
      {activeTab === 'installations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Installations</h2>
            {canEdit && (
              <button
                onClick={() => setShowInstallTabForm(!showInstallTabForm)}
                className="rounded border border-border px-2 py-1 text-xs hover:bg-muted"
              >
                + Schedule Installation
              </button>
            )}
          </div>

          {canEdit && showInstallTabForm && (
            <div className="rounded border border-border p-4 space-y-3">
              <h3 className="text-sm font-medium">New Installation</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-xs font-medium">Start</label>
                  <input
                    type="datetime-local"
                    value={installTabStart}
                    onChange={(e) => setInstallTabStart(e.target.value)}
                    className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium">End</label>
                  <input
                    type="datetime-local"
                    value={installTabEnd}
                    onChange={(e) => setInstallTabEnd(e.target.value)}
                    className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
                  />
                </div>
              </div>
              <input
                type="text"
                placeholder="Assigned team"
                value={installTabTeam}
                onChange={(e) => setInstallTabTeam(e.target.value)}
                className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
              />
              <div className="flex gap-2">
                <button
                  onClick={doScheduleInstallTab}
                  disabled={installTabSaving}
                  className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {installTabSaving ? 'Saving…' : 'Schedule'}
                </button>
                <button
                  onClick={() => setShowInstallTabForm(false)}
                  className="rounded border border-border px-3 py-1.5 text-sm hover:bg-muted"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {loadingInstallationsList ? (
            <p className="text-sm text-muted-foreground">Loading installations…</p>
          ) : !projectInstallationsList || projectInstallationsList.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No installations scheduled for this project.
            </p>
          ) : (
            <ul className="space-y-3">
              {(projectInstallationsList as any[]).map((inst) => (
                <li key={inst.id} className="rounded border border-border p-3 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex rounded-full px-1.5 py-0.5 text-xs font-medium ${INSTALLATION_STATUS_COLORS[inst.status ?? ''] ?? 'bg-gray-100 text-gray-600'}`}
                        >
                          {(inst.status ?? '').replace(/_/g, ' ')}
                        </span>
                        {inst.assigned_team && (
                          <span className="text-xs text-muted-foreground">
                            Team: {inst.assigned_team}
                          </span>
                        )}
                      </div>
                      {inst.scheduled_start && (
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(inst.scheduled_start)}
                          {inst.scheduled_end && ` → ${formatDateTime(inst.scheduled_end)}`}
                        </p>
                      )}
                      {inst.status === 'completed' && (
                        <div className="space-y-0.5">
                          {inst.completion_notes && (
                            <p className="text-xs">Notes: {inst.completion_notes}</p>
                          )}
                          {inst.customer_signoff_name ? (
                            <p className="text-xs text-green-700">
                              Signed off by: {inst.customer_signoff_name}
                              {inst.signed_off_at && ` · ${formatDate(inst.signed_off_at)}`}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">No sign-off recorded</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

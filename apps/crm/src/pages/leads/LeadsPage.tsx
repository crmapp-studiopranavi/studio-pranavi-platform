import { useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  useLeads,
  useLeadsKanban,
  useUpdateLeadStatus,
  useCreateLead,
} from '@/lib/hooks/use-leads';
import { useStaffProfiles } from '@/lib/hooks/use-staff-profiles';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import {
  EXPORT_CONFIGS,
  generateCsvBlob,
  downloadBlob,
  sanitiseValue,
} from '@/lib/data-export/export-engine';
import {
  LeadStatusBadge,
  LEAD_STATUSES,
  STATUS_LABEL,
  NEXT_STATUS,
} from '@/components/leads/LeadStatusBadge';
import {
  LeadPriorityBadge,
  LEAD_PRIORITIES,
  PRIORITY_LABEL,
} from '@/components/leads/LeadPriorityBadge';
import { formatBudgetRange, formatDate, isOverdue } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';
import type { Enums } from '@platform/types';

const KANBAN_COLS = [
  'new',
  'contacted',
  'site_visit_scheduled',
  'site_visit_completed',
  'quote_drafting',
  'quote_sent',
  'negotiation',
];

type ViewMode = 'table' | 'kanban';

// ── New Lead dialog ───────────────────────────────────────────────────────────

function NewLeadDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const { profile } = useAuth();
  const createLead = useCreateLead();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [source, setSource] = useState('');
  const [service, setService] = useState('');
  const [priority, setPriority] = useState<'medium' | 'low' | 'high' | 'urgent'>('medium');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await createLead.mutateAsync({
      full_name: fullName.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      whatsapp_number: whatsapp.trim() || null,
      source: source.trim() || null,
      service_interest: service.trim() || null,
      priority,
      budget_min_minor: budgetMin ? Math.round(parseFloat(budgetMin) * 100) : null,
      budget_max_minor: budgetMax ? Math.round(parseFloat(budgetMax) * 100) : null,
      location_text: location.trim() || null,
      project_description: description.trim() || null,
      owner_id: profile?.id ?? null,
    });
    onCreated(result.id);
  };

  const inp =
    'w-full rounded border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-lg bg-background border border-border shadow-xl p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">New Lead</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inp}
              placeholder="e.g. Rahul Sharma"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inp}
                placeholder="rahul@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inp}
                placeholder="+91 98765 43210"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">WhatsApp</label>
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className={inp}
                placeholder="+91 98765 43210"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as typeof priority)}
                className={inp}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Source</label>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className={inp}
                placeholder="e.g. Website, Referral"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Service Interest</label>
              <input
                type="text"
                value={service}
                onChange={(e) => setService(e.target.value)}
                className={inp}
                placeholder="e.g. Decorative Glass"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={inp}
              placeholder="City or area"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Budget Min (₹)</label>
              <input
                type="number"
                min="0"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
                className={inp}
                placeholder="50000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Budget Max (₹)</label>
              <input
                type="number"
                min="0"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                className={inp}
                placeholder="200000"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Project Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={inp}
              placeholder="Brief description of the project…"
            />
          </div>
          {createLead.error && (
            <p className="text-sm text-red-600">{(createLead.error as Error).message}</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-border px-4 py-1.5 text-sm hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createLead.isPending}
              className="rounded bg-primary text-primary-foreground px-4 py-1.5 text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {createLead.isPending ? 'Creating…' : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function LeadsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<ViewMode>('table');
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [status, setStatus] = useState(searchParams.get('status') ?? '');
  const [priority, setPriority] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [page, setPage] = useState(0);
  const [lostReason, setLostReason] = useState('');
  const [pendingLost, setPendingLost] = useState<string | null>(null);
  const [showNewLead, setShowNewLead] = useState(false);
  const [exportLoading, setExportLoading] = useState<'csv' | 'xlsx' | null>(null);

  const { profile } = useAuth();
  const { data: staffData } = useStaffProfiles();

  const { data, isLoading } = useLeads({ search, status, priority, ownerId, page });
  const { data: kanban, isLoading: kanbanLoading } = useLeadsKanban();
  const updateStatus = useUpdateLeadStatus();

  const updateSearch = useCallback(
    (v: string) => {
      setSearch(v);
      setPage(0);
      const p = new URLSearchParams(searchParams);
      if (v) p.set('search', v);
      else p.delete('search');
      setSearchParams(p, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const handleAdvance = (leadId: string, currentStatus: string) => {
    const next = NEXT_STATUS[currentStatus as Enums<'lead_status'>] as
      Enums<'lead_status'> | undefined;
    if (!next || !profile?.id) return;
    void updateStatus.mutateAsync({ leadId, status: next, actorId: profile.id });
  };

  const handleMarkLost = (leadId: string) => {
    setPendingLost(leadId);
    setLostReason('');
  };

  const confirmLost = () => {
    if (!pendingLost || !profile?.id) return;
    void updateStatus
      .mutateAsync({
        leadId: pendingLost,
        status: 'lost',
        lostReason,
        actorId: profile.id,
      })
      .then(() => setPendingLost(null));
  };

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;

  async function handleExport(format: 'csv' | 'xlsx') {
    setExportLoading(format);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: rows, error } = await (supabase.from('leads') as any).select('*');
      if (error) throw new Error((error as { message: string }).message);
      const records = (rows ?? []) as Record<string, unknown>[];
      const config = EXPORT_CONFIGS['leads'];
      const today = new Date().toISOString().slice(0, 10);
      if (format === 'csv') {
        const blob = generateCsvBlob(config, records);
        downloadBlob(blob, `leads_export_${today}.csv`);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ExcelJS = (await import('exceljs')) as any;
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Leads');
        sheet.addRow(config.columns.map((c: { header: string }) => sanitiseValue(c.header)));
        for (const record of records) {
          sheet.addRow(config.columns.map((c: { key: string }) => sanitiseValue(record[c.key])));
        }
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        downloadBlob(blob, `leads_export_${today}.xlsx`);
      }
    } catch (err) {
      console.error('[LeadsPage] export failed:', err);
    } finally {
      setExportLoading(null);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Leads</h1>
        <div className="flex flex-wrap items-center gap-2">
          {/* View toggle */}
          <button
            onClick={() => setView('table')}
            className={`rounded px-3 py-1.5 text-sm ${view === 'table' ? 'bg-primary text-primary-foreground' : 'border border-border bg-background'}`}
          >
            Table
          </button>
          <button
            onClick={() => setView('kanban')}
            className={`rounded px-3 py-1.5 text-sm ${view === 'kanban' ? 'bg-primary text-primary-foreground' : 'border border-border bg-background'}`}
          >
            Kanban
          </button>
          <span className="w-px h-5 bg-border" />
          {/* Export */}
          <button
            onClick={() => void handleExport('csv')}
            disabled={exportLoading !== null}
            className="rounded border border-border px-3 py-1 text-sm hover:bg-muted transition-colors disabled:opacity-50"
          >
            {exportLoading === 'csv' ? 'Exporting…' : '↓ CSV'}
          </button>
          <button
            onClick={() => void handleExport('xlsx')}
            disabled={exportLoading !== null}
            className="rounded border border-border px-3 py-1 text-sm hover:bg-muted transition-colors disabled:opacity-50"
          >
            {exportLoading === 'xlsx' ? 'Exporting…' : '↓ Excel'}
          </button>
          {/* Import */}
          <Link
            to="/admin/data-management"
            className="rounded border border-border px-3 py-1 text-sm hover:bg-muted transition-colors"
          >
            ↑ Import
          </Link>
          {/* New Lead */}
          <button
            onClick={() => setShowNewLead(true)}
            className="rounded bg-primary text-primary-foreground px-3 py-1 text-sm hover:bg-primary/90 transition-colors"
          >
            + New Lead
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        <input
          type="search"
          placeholder="Search name, email, phone…"
          value={search}
          onChange={(e) => updateSearch(e.target.value)}
          className="rounded border border-border bg-background px-3 py-1.5 text-sm w-56"
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(0);
          }}
          className="rounded border border-border bg-background px-3 py-1.5 text-sm"
        >
          <option value="">All statuses</option>
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL(s)}
            </option>
          ))}
        </select>
        <select
          value={priority}
          onChange={(e) => {
            setPriority(e.target.value);
            setPage(0);
          }}
          className="rounded border border-border bg-background px-3 py-1.5 text-sm"
        >
          <option value="">All priorities</option>
          {LEAD_PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {PRIORITY_LABEL(p)}
            </option>
          ))}
        </select>
        <select
          value={ownerId}
          onChange={(e) => {
            setOwnerId(e.target.value);
            setPage(0);
          }}
          className="rounded border border-border bg-background px-3 py-1.5 text-sm"
        >
          <option value="">All owners</option>
          {(staffData ?? []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.full_name ?? s.id}
            </option>
          ))}
        </select>
      </div>

      {view === 'table' && (
        <>
          <div className="overflow-x-auto rounded border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-left">#</th>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Priority</th>
                  <th className="px-4 py-2 text-left">Budget</th>
                  <th className="px-4 py-2 text-left">Owner</th>
                  <th className="px-4 py-2 text-left">Follow-up</th>
                  <th className="px-4 py-2 text-left">Created</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {isLoading &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-t border-border">
                      {Array.from({ length: 9 }).map((__, j) => (
                        <td key={j} className="px-4 py-2">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))}
                {!isLoading &&
                  (data?.leads ?? []).map((lead) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const owner = (lead as any).owner as { full_name: string | null } | null;
                    const followupOverdue = isOverdue(lead.next_follow_up_at);
                    return (
                      <tr key={lead.id} className="border-t border-border hover:bg-muted/30">
                        <td className="px-4 py-2 text-muted-foreground">{lead.lead_number}</td>
                        <td className="px-4 py-2 font-medium">
                          <Link to={`/leads/${lead.id}`} className="hover:underline text-primary">
                            {lead.full_name}
                          </Link>
                        </td>
                        <td className="px-4 py-2">
                          <LeadStatusBadge status={lead.status} />
                        </td>
                        <td className="px-4 py-2">
                          <LeadPriorityBadge priority={lead.priority} />
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {formatBudgetRange(lead.budget_min_minor, lead.budget_max_minor)}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {owner?.full_name ?? '—'}
                        </td>
                        <td
                          className={`px-4 py-2 ${followupOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}
                        >
                          {formatDate(lead.next_follow_up_at)}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {formatDate(lead.created_at)}
                        </td>
                        <td className="px-4 py-2">
                          <Link
                            to={`/leads/${lead.id}`}
                            className="text-xs text-primary hover:underline"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                {!isLoading && data?.leads.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                      No leads found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-3 flex items-center gap-3 text-sm">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="rounded border border-border px-3 py-1 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-muted-foreground">
                Page {page + 1} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="rounded border border-border px-3 py-1 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {view === 'kanban' && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {KANBAN_COLS.map((col) => {
              const leads = kanban?.[col] ?? [];
              return (
                <div key={col} className="w-64 rounded-lg border border-border bg-muted/20 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <LeadStatusBadge status={col} />
                    <span className="text-xs text-muted-foreground">{leads.length}</span>
                  </div>
                  {kanbanLoading && <Skeleton className="h-16 w-full" />}
                  <div className="flex flex-col gap-2">
                    {leads.map((lead) => {
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      const owner = (lead as any).owner as { full_name: string | null } | null;
                      const next = NEXT_STATUS[lead.status];
                      return (
                        <div
                          key={lead.id}
                          className="rounded-md border border-border bg-background p-3 text-sm shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <Link
                              to={`/leads/${lead.id}`}
                              className="font-medium hover:underline text-primary line-clamp-1"
                            >
                              {lead.full_name}
                            </Link>
                            <LeadPriorityBadge priority={lead.priority} />
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {formatBudgetRange(lead.budget_min_minor, lead.budget_max_minor)}
                          </div>
                          {owner?.full_name && (
                            <div className="mt-0.5 text-xs text-muted-foreground">
                              {owner.full_name}
                            </div>
                          )}
                          <div className="mt-2 flex gap-1.5">
                            {next && (
                              <button
                                onClick={() => handleAdvance(lead.id, lead.status)}
                                disabled={updateStatus.isPending}
                                className="flex-1 rounded bg-primary px-2 py-1 text-xs text-primary-foreground disabled:opacity-60"
                              >
                                Advance →
                              </button>
                            )}
                            {lead.status !== 'lost' &&
                              lead.status !== 'won' &&
                              lead.status !== 'archived' && (
                                <button
                                  onClick={() => handleMarkLost(lead.id)}
                                  className="rounded border border-red-200 px-2 py-1 text-xs text-red-600"
                                >
                                  Lost
                                </button>
                              )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Won / Lost columns */}
            {['won', 'lost'].map((col) => {
              const leads = kanban?.[col] ?? [];
              return (
                <div key={col} className="w-56 rounded-lg border border-border bg-muted/10 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <LeadStatusBadge status={col} />
                    <span className="text-xs text-muted-foreground">{leads.length}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {leads.slice(0, 10).map((lead) => (
                      <div
                        key={lead.id}
                        className="rounded-md border border-border bg-background p-2 text-xs"
                      >
                        <Link
                          to={`/leads/${lead.id}`}
                          className="font-medium hover:underline text-primary"
                        >
                          {lead.full_name}
                        </Link>
                      </div>
                    ))}
                    {leads.length > 10 && (
                      <p className="text-xs text-muted-foreground">+{leads.length - 10} more</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* New Lead dialog */}
      {showNewLead && (
        <NewLeadDialog
          onClose={() => setShowNewLead(false)}
          onCreated={() => setShowNewLead(false)}
        />
      )}

      {/* Lost reason modal */}
      {pendingLost && (
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
                onClick={() => setPendingLost(null)}
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
    </div>
  );
}

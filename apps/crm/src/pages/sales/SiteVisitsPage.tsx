import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { useSiteVisits, useCreateSiteVisit } from '@/lib/hooks/use-site-visits';
import { useLeads } from '@/lib/hooks/use-leads';
import { useCustomers } from '@/lib/hooks/use-customers';
import { useStaffProfiles } from '@/lib/hooks/use-staff-profiles';
import { formatDateTime } from '@/lib/format';

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700 border border-blue-200',
  confirmed: 'bg-green-100 text-green-700 border border-green-200',
  completed: 'bg-green-600 text-white',
  cancelled: 'bg-slate-100 text-slate-600 border border-slate-200',
  rescheduled: 'bg-amber-100 text-amber-700 border border-amber-200',
};

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_STYLES[status] ?? 'bg-muted text-muted-foreground';
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium capitalize ${cls}`}>
      {status}
    </span>
  );
}

// ── Filter tabs ───────────────────────────────────────────────────────────────

const FILTER_TABS = [
  { label: 'All', value: '' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
] as const;

// ── Quick-create dialog ───────────────────────────────────────────────────────

function CreateSiteVisitDialog({ onClose }: { onClose: () => void }) {
  const { mutate, isPending, error } = useCreateSiteVisit();
  const { data: leadsData } = useLeads({});
  const { data: customersData } = useCustomers({});
  const { data: staff = [] } = useStaffProfiles();

  const [leadId, setLeadId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [leadSearch, setLeadSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [scheduledStart, setScheduledStart] = useState('');
  const [scheduledEnd, setScheduledEnd] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [purpose, setPurpose] = useState('');

  const filteredLeads = (leadsData?.leads ?? []).filter(
    (l) => !leadSearch || l.full_name?.toLowerCase().includes(leadSearch.toLowerCase())
  );
  const filteredCustomers = (customersData?.customers ?? []).filter(
    (c) => !customerSearch || c.display_name?.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduledStart) return;
    mutate(
      {
        lead_id: leadId || null,
        customer_id: customerId || null,
        scheduled_start: scheduledStart,
        scheduled_end: scheduledEnd || null,
        assigned_to: assignedTo || null,
        purpose: purpose.trim() || null,
      },
      { onSuccess: onClose }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-lg bg-background border border-border shadow-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Schedule Site Visit</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Lead (optional)</label>
            <input
              type="search"
              placeholder="Search leads…"
              value={leadSearch}
              onChange={(e) => setLeadSearch(e.target.value)}
              className="mb-1 w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
            />
            <select
              value={leadId}
              onChange={(e) => setLeadId(e.target.value)}
              size={3}
              className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
            >
              <option value="">— None —</option>
              {filteredLeads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.full_name ?? l.id}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Customer (optional)</label>
            <input
              type="search"
              placeholder="Search customers…"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="mb-1 w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
            />
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              size={3}
              className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
            >
              <option value="">— None —</option>
              {filteredCustomers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.display_name ?? c.id}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Scheduled Start <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              required
              value={scheduledStart}
              onChange={(e) => setScheduledStart(e.target.value)}
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Scheduled End</label>
            <input
              type="datetime-local"
              value={scheduledEnd}
              onChange={(e) => setScheduledEnd(e.target.value)}
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Assigned To</label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">Unassigned</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name ?? s.id}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Purpose</label>
            <input
              type="text"
              placeholder="e.g. Measurement, Installation check"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
            />
          </div>

          {error && <p className="text-sm text-red-600">{(error as Error).message}</p>}

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
              disabled={isPending || !scheduledStart || (!leadId && !customerId)}
              className="rounded bg-primary text-primary-foreground px-4 py-1.5 text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isPending ? 'Saving…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const CAN_CREATE_ROLES = new Set(['admin', 'manager', 'sales']);

export default function SiteVisitsPage() {
  const { profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCreate, setShowCreate] = useState(false);

  const mineParam = searchParams.get('mine') === '1';
  const statusParam = searchParams.get('status') ?? '';

  const { data, isLoading } = useSiteVisits({
    mine: mineParam,
    status: statusParam || undefined,
  });

  const setParam = (key: string, value: string | null) => {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value);
    else p.delete(key);
    setSearchParams(p, { replace: true });
  };

  const canCreate = profile?.role ? CAN_CREATE_ROLES.has(profile.role) : false;

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Site Visits</h1>

        <div className="flex items-center gap-2">
          {/* Mine toggle */}
          <button
            onClick={() => setParam('mine', mineParam ? null : '1')}
            className={`rounded border px-3 py-1 text-sm transition-colors ${
              mineParam
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border hover:bg-muted text-muted-foreground'
            }`}
          >
            {mineParam ? 'My visits' : 'All visits'}
          </button>

          {/* Quick-create */}
          {canCreate && (
            <button
              onClick={() => setShowCreate(true)}
              className="rounded bg-primary text-primary-foreground px-3 py-1 text-sm hover:bg-primary/90 transition-colors"
            >
              + Schedule Visit
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex gap-1 rounded border border-border p-0.5 bg-muted/30 w-fit">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setParam('status', tab.value || null)}
            className={`rounded px-3 py-1 text-sm transition-colors ${
              statusParam === tab.value
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="px-4 py-2 text-left">Date / Time</th>
              <th className="px-4 py-2 text-left">Lead / Customer</th>
              <th className="px-4 py-2 text-left">Assigned To</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Purpose</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {/* Skeleton rows */}
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t border-border">
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j} className="px-4 py-2">
                      <span className="block animate-pulse bg-muted rounded h-4" />
                    </td>
                  ))}
                </tr>
              ))}

            {/* Empty state */}
            {!isLoading && (data ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center">
                  <p className="font-medium text-muted-foreground">No site visits scheduled</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {canCreate
                      ? 'Click "Schedule Visit" to add one.'
                      : 'Check back later or contact your manager.'}
                  </p>
                </td>
              </tr>
            )}

            {/* Data rows */}
            {!isLoading &&
              (data ?? []).map((visit) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const lead = visit.lead as any as { id: string; full_name: string | null } | null;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const customer = visit.customer as any as {
                  id: string;
                  display_name: string | null;
                } | null;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const assigned = visit.assigned as any as {
                  id: string;
                  full_name: string | null;
                } | null;

                const contactName = lead?.full_name ?? customer?.display_name ?? '—';
                const actionHref = lead?.id
                  ? `/leads/${lead.id}`
                  : customer?.id
                    ? `/customers/${customer.id}`
                    : null;

                return (
                  <tr key={visit.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">
                      {formatDateTime(visit.scheduled_start)}
                    </td>
                    <td className="px-4 py-2 font-medium">{contactName}</td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {assigned?.full_name ?? '—'}
                    </td>
                    <td className="px-4 py-2">
                      <StatusBadge status={visit.status} />
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{visit.purpose ?? '—'}</td>
                    <td className="px-4 py-2 text-right">
                      {actionHref ? (
                        <Link
                          to={actionHref}
                          className="rounded border border-border px-3 py-1 text-xs hover:bg-muted transition-colors"
                        >
                          View
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Create dialog */}
      {showCreate && <CreateSiteVisitDialog onClose={() => setShowCreate(false)} />}
    </div>
  );
}

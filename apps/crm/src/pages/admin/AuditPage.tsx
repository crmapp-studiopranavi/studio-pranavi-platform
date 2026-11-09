import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { formatDateTime } from '@/lib/format';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuditRow {
  id: number;
  action: string;
  entity_type: string;
  entity_id: string | null;
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
  created_at: string;
  actor: { full_name: string } | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ENTITY_TYPES = [
  'customers',
  'leads',
  'quotes',
  'orders',
  'projects',
  'invoices',
  'payments',
  'profile',
] as const;

const ACTION_BADGE: Record<string, string> = {
  insert: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  update: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  delete: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

const ACTION_LABELS: Record<string, string> = {
  insert: 'Insert',
  update: 'Update',
  delete: 'Delete',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function truncateId(id: string | null): string {
  if (!id) return '—';
  return id.slice(0, 8);
}

// ── Query ─────────────────────────────────────────────────────────────────────

function useAuditLog({
  limit,
  entityType,
  dateFrom,
  dateTo,
}: {
  limit: number;
  entityType: string;
  dateFrom: string;
  dateTo: string;
}) {
  return useQuery({
    queryKey: ['audit-log', limit, entityType, dateFrom, dateTo],
    queryFn: async () => {
      let q = supabase
        .from('audit_log')
        .select(
          `
          id, action, entity_type, entity_id, before_data, after_data, created_at,
          actor:profiles!actor_id(full_name)
        `
        )
        .order('created_at', { ascending: false })
        .limit(limit);

      if (entityType) {
        q = q.eq('entity_type', entityType);
      }
      if (dateFrom) {
        q = q.gte('created_at', `${dateFrom}T00:00:00.000Z`);
      }
      if (dateTo) {
        q = q.lte('created_at', `${dateTo}T23:59:59.999Z`);
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as AuditRow[];
    },
  });
}

// ── Expanded changes row ───────────────────────────────────────────────────────

function ChangesCell({
  beforeData,
  afterData,
}: {
  beforeData: Record<string, unknown> | null;
  afterData: Record<string, unknown> | null;
}) {
  const [expanded, setExpanded] = useState(false);

  const combined: Record<string, unknown> = {};
  if (beforeData) combined.before = beforeData;
  if (afterData) combined.after = afterData;

  if (Object.keys(combined).length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  const json = JSON.stringify(combined, null, 2);
  const preview = JSON.stringify(combined);
  const truncated = preview.length > 60 ? preview.slice(0, 60) + '…' : preview;

  return (
    <div>
      {expanded ? (
        <div>
          <pre className="max-w-xs overflow-x-auto rounded bg-muted p-2 text-xs">{json}</pre>
          <button
            onClick={() => setExpanded(false)}
            className="mt-1 text-xs text-primary hover:underline"
          >
            Collapse
          </button>
        </div>
      ) : (
        <button
          onClick={() => setExpanded(true)}
          className="font-mono text-xs text-muted-foreground hover:text-foreground hover:underline text-left"
          title="Click to expand"
        >
          {truncated}
        </button>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AuditPage() {
  const [entityType, setEntityType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [limit, setLimit] = useState(50);

  const { data, isLoading, isError, isFetching } = useAuditLog({
    limit,
    entityType,
    dateFrom,
    dateTo,
  });

  const rows = data ?? [];

  function handleLoadMore() {
    setLimit((prev) => prev + 50);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Audit History</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A log of data changes made by team members.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* Entity type filter */}
        <select
          value={entityType}
          onChange={(e) => {
            setEntityType(e.target.value);
            setLimit(50);
          }}
          className="rounded border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          aria-label="Filter by entity type"
        >
          <option value="">All entity types</option>
          {ENTITY_TYPES.map((et) => (
            <option key={et} value={et}>
              {et.charAt(0).toUpperCase() + et.slice(1)}
            </option>
          ))}
        </select>

        {/* Date from */}
        <div className="flex items-center gap-1.5">
          <label className="text-sm text-muted-foreground" htmlFor="audit-date-from">
            From
          </label>
          <input
            id="audit-date-from"
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setLimit(50);
            }}
            className="rounded border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Date to */}
        <div className="flex items-center gap-1.5">
          <label className="text-sm text-muted-foreground" htmlFor="audit-date-to">
            To
          </label>
          <input
            id="audit-date-to"
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setLimit(50);
            }}
            className="rounded border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Clear filters */}
        {(entityType || dateFrom || dateTo) && (
          <button
            onClick={() => {
              setEntityType('');
              setDateFrom('');
              setDateTo('');
              setLimit(50);
            }}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Error banner */}
      {isError && (
        <div className="mb-4 rounded border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Failed to load audit records. Please refresh and try again.
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left">
              <th className="px-4 py-3 font-medium whitespace-nowrap">Timestamp</th>
              <th className="px-4 py-3 font-medium">Actor</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium hidden sm:table-cell">Entity Type</th>
              <th className="px-4 py-3 font-medium hidden md:table-cell">Entity ID</th>
              <th className="px-4 py-3 font-medium hidden lg:table-cell">Changes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {/* Skeleton rows */}
            {isLoading &&
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <span className="block h-4 animate-pulse rounded bg-muted" />
                    </td>
                  ))}
                </tr>
              ))}

            {/* Empty state */}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <p className="text-muted-foreground">No audit records found</p>
                </td>
              </tr>
            )}

            {/* Data rows */}
            {!isLoading &&
              rows.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-muted/30">
                  {/* Timestamp */}
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {formatDateTime(row.created_at)}
                  </td>

                  {/* Actor */}
                  <td className="px-4 py-3">
                    {row.actor?.full_name ?? <span className="text-muted-foreground">System</span>}
                  </td>

                  {/* Action badge */}
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${ACTION_BADGE[row.action] ?? 'bg-muted text-muted-foreground'}`}
                    >
                      {ACTION_LABELS[row.action] ?? row.action}
                    </span>
                  </td>

                  {/* Entity type */}
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    {row.entity_type}
                  </td>

                  {/* Entity ID */}
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="font-mono text-xs text-muted-foreground">
                      {truncateId(row.entity_id)}
                    </span>
                  </td>

                  {/* Changes */}
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <ChangesCell beforeData={row.before_data} afterData={row.after_data} />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Load more */}
      {!isLoading && rows.length >= limit && (
        <div className="mt-4 text-center">
          <button
            onClick={handleLoadMore}
            disabled={isFetching}
            className="rounded border border-border px-4 py-2 text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
          >
            {isFetching ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuotes } from '@/lib/hooks/use-quotes';
import {
  QuoteStatusBadge,
  QUOTE_STATUSES,
  QUOTE_STATUS_LABEL,
} from '@/components/quotes/QuoteStatusBadge';
import { formatDate, formatCurrency } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';

export function QuotesPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuotes({ search, status, page });
  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Quotations</h1>
        <Link
          to="/quotes/new"
          className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90"
        >
          + New Quote
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          type="search"
          placeholder="Search by quote number…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
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
          {QUOTE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {QUOTE_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="px-4 py-2 text-left">Quote #</th>
              <th className="px-4 py-2 text-left">Customer</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Version</th>
              <th className="px-4 py-2 text-right">Total</th>
              <th className="px-4 py-2 text-left">Issue Date</th>
              <th className="px-4 py-2 text-left">Valid Until</th>
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
              (data?.quotes ?? []).map((q) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const customer = (q as any).customer as { display_name: string } | null;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const cv = (q as any).current_version as {
                  version_number: number;
                  total_minor: number;
                  issue_date: string;
                  valid_until: string;
                } | null;
                return (
                  <tr key={q.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-4 py-2 font-mono font-medium">
                      <Link to={`/quotes/${q.id}`} className="hover:underline text-primary">
                        {q.quote_number}
                      </Link>
                    </td>
                    <td className="px-4 py-2">{customer?.display_name ?? '—'}</td>
                    <td className="px-4 py-2">
                      <QuoteStatusBadge status={q.status} />
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {cv ? `v${cv.version_number}` : '—'}
                    </td>
                    <td className="px-4 py-2 text-right font-medium">
                      {cv ? formatCurrency(cv.total_minor) : '—'}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {cv ? formatDate(cv.issue_date) : '—'}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {cv ? formatDate(cv.valid_until) : '—'}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{formatDate(q.created_at)}</td>
                    <td className="px-4 py-2">
                      <Link to={`/quotes/${q.id}`} className="text-xs text-primary hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            {!isLoading && data?.quotes.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                  No quotations yet.{' '}
                  <Link to="/quotes/new" className="text-primary hover:underline">
                    Create one
                  </Link>
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
    </div>
  );
}

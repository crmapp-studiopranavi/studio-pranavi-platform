 
import { useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/format';

// ── Types ─────────────────────────────────────────────────────────────────────

interface OutstandingInvoice {
  id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  total_minor: number;
  amount_paid_minor: number;
  balance_minor: number;
  status: string;
  currency: string;
  customer: { id: string; display_name: string } | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, string> = {
  issued: 'bg-blue-100 text-blue-700',
  partially_paid: 'bg-amber-100 text-amber-800',
  overdue: 'bg-red-100 text-red-700',
};

const STATUS_LABEL: Record<string, string> = {
  issued: 'Issued',
  partially_paid: 'Partially Paid',
  overdue: 'Overdue',
};

function ageDays(issueDateStr: string): number {
  const issueDate = new Date(issueDateStr);
  return Math.floor((Date.now() - issueDate.getTime()) / 86400000);
}

function ageRowClass(days: number): string {
  if (days > 60) return 'bg-red-50';
  if (days > 30) return 'bg-amber-50';
  return '';
}

// ── Query ─────────────────────────────────────────────────────────────────────

function useOutstandingInvoices() {
  return useQuery({
    queryKey: ['outstanding-invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select(
          `
          id, invoice_number, issue_date, due_date,
          total_minor, amount_paid_minor, balance_minor,
          status, currency,
          customer:customers!customer_id(id, display_name)
        `
        )
        .in('status', ['issued', 'partially_paid', 'overdue'])
        .is('archived_at', null)
        .order('issue_date', { ascending: true })
        .limit(200);

      if (error) throw error;
      return (data ?? []) as unknown as OutstandingInvoice[];
    },
  });
}

// ── Page ──────────────────────────────────────────────────────────────────────

const AGE_OPTIONS = [
  { label: 'All', value: '' },
  { label: '30+ days', value: '30' },
  { label: '60+ days', value: '60' },
];

export default function OutstandingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const ageParam = searchParams.get('age') ?? '';

  const { data, isLoading, isError } = useOutstandingInvoices();
  const all = data ?? [];

  // Apply age filter
  const invoices: OutstandingInvoice[] = ageParam
    ? all.filter((inv) => ageDays(inv.issue_date) >= Number(ageParam))
    : all;

  // Footer total
  const totalBalance = invoices.reduce((sum, inv) => sum + (inv.balance_minor ?? 0), 0);

  function setAge(val: string) {
    setSearchParams(val ? { age: val } : {});
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Outstanding Invoices</h1>
      </div>

      {/* Ageing filter buttons */}
      <div className="mb-4 flex flex-wrap gap-2">
        {AGE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setAge(opt.value)}
            className={`rounded-full border px-3 py-1 text-sm transition-colors ${
              ageParam === opt.value
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border hover:bg-muted'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {isError && (
        <div className="mb-4 rounded border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Failed to load outstanding invoices. Please refresh and try again.
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left">
              <th className="px-4 py-3 font-medium">Invoice #</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium hidden md:table-cell">Issue Date</th>
              <th className="px-4 py-3 font-medium hidden md:table-cell">Due Date</th>
              <th className="px-4 py-3 font-medium text-right">Total</th>
              <th className="px-4 py-3 font-medium text-right hidden lg:table-cell">Paid</th>
              <th className="px-4 py-3 font-medium text-right">Balance</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Age (days)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {/* Skeleton rows */}
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t border-border">
                  {Array.from({ length: 9 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <span className="block h-4 animate-pulse rounded bg-muted" />
                    </td>
                  ))}
                </tr>
              ))}

            {/* Empty state */}
            {!isLoading && invoices.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center">
                  <p className="text-muted-foreground">
                    {ageParam
                      ? `No invoices older than ${ageParam} days`
                      : 'No outstanding invoices'}
                  </p>
                </td>
              </tr>
            )}

            {/* Data rows */}
            {!isLoading &&
              invoices.map((inv) => {
                const days = ageDays(inv.issue_date);
                const rowClass = ageRowClass(days);
                return (
                  <tr key={inv.id} className={`transition-colors hover:bg-muted/30 ${rowClass}`}>
                    <td className="px-4 py-3">
                      <Link
                        to={`/invoices/${inv.id}`}
                        className="font-mono text-primary hover:underline"
                      >
                        {inv.invoice_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {inv.customer ? (
                        <Link
                          to={`/customers/${inv.customer.id}`}
                          className="text-primary hover:underline"
                        >
                          {inv.customer.display_name}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground whitespace-nowrap">
                      {formatDate(inv.issue_date)}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground whitespace-nowrap">
                      {formatDate(inv.due_date)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {formatCurrency(inv.total_minor)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums hidden lg:table-cell text-muted-foreground">
                      {formatCurrency(inv.amount_paid_minor)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums font-semibold">
                      {formatCurrency(inv.balance_minor)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[inv.status] ?? 'bg-muted text-muted-foreground'}`}
                      >
                        {STATUS_LABEL[inv.status] ?? inv.status}
                      </span>
                    </td>
                    <td
                      className={`px-4 py-3 text-right tabular-nums ${
                        days > 60
                          ? 'text-red-600 font-semibold'
                          : days > 30
                            ? 'text-amber-700 font-medium'
                            : 'text-muted-foreground'
                      }`}
                    >
                      {days}
                    </td>
                  </tr>
                );
              })}
          </tbody>

          {/* Footer total */}
          {!isLoading && invoices.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-border bg-muted/50 font-semibold">
                <td colSpan={6} className="px-4 py-3 text-right text-sm text-muted-foreground">
                  Total Outstanding Balance
                </td>
                <td className="px-4 py-3 text-right font-mono tabular-nums text-foreground">
                  {formatCurrency(totalBalance)}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

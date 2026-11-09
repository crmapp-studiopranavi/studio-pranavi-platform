import { useState } from 'react';
import { usePayments } from '@/lib/hooks/use-payments';
import { formatCurrency, formatDate } from '@/lib/format';

// ── Helpers ───────────────────────────────────────────────────────────────────

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7); // YYYY-MM
}

function monthLabel(yyyyMM: string): string {
  // e.g. "2026-11" → "November 2026"
  const [year, month] = yyyyMM.split('-');
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
}

const STATUS_BADGE: Record<string, string> = {
  cleared: 'bg-green-100 text-green-800',
  pending: 'bg-amber-100 text-amber-800',
  failed: 'bg-red-100 text-red-800',
  reversed: 'bg-slate-100 text-slate-700',
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PaymentsPage() {
  const [month, setMonth] = useState<string>(currentMonth());

  const { data, isLoading } = usePayments({ month });

  const payments = data ?? [];

  // Total of cleared payments
  const totalCleared = payments
    .filter((p) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (p as any).status === 'cleared';
    })
    .reduce((sum, p) => sum + (p.amount_minor ?? 0), 0);

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Payments</h1>

        {/* Month picker */}
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="px-4 py-2 text-left">Payment #</th>
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Customer</th>
              <th className="px-4 py-2 text-left">Invoice #</th>
              <th className="px-4 py-2 text-right">Amount</th>
              <th className="px-4 py-2 text-left">Method</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Reference</th>
            </tr>
          </thead>
          <tbody>
            {/* Skeleton rows */}
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t border-border">
                  {Array.from({ length: 8 }).map((__, j) => (
                    <td key={j} className="px-4 py-2">
                      <span className="block animate-pulse bg-muted rounded h-4" />
                    </td>
                  ))}
                </tr>
              ))}

            {/* Empty state */}
            {!isLoading && payments.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center">
                  <p className="font-medium text-muted-foreground">
                    No payments in {monthLabel(month)}
                  </p>
                </td>
              </tr>
            )}

            {/* Data rows */}
            {!isLoading &&
              payments.map((p) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const invoice = p.invoice as any as { id: string; invoice_number: string } | null;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const customer = p.customer as any as { id: string; display_name: string } | null;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const status = (p as any).status as string;

                return (
                  <tr key={p.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-4 py-2 font-medium">{p.payment_number}</td>
                    <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">
                      {formatDate(p.payment_date)}
                    </td>
                    <td className="px-4 py-2">{customer?.display_name ?? '—'}</td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {invoice?.invoice_number ?? '—'}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {formatCurrency(p.amount_minor)}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground capitalize">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {(p as any).method ?? '—'}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_BADGE[status] ?? 'bg-muted text-muted-foreground'}`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{p.reference ?? '—'}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Total cleared */}
      {!isLoading && payments.length > 0 && (
        <div className="mt-3 flex justify-end">
          <p className="text-sm font-medium text-foreground">
            Total cleared: <span className="text-green-700">{formatCurrency(totalCleared)}</span>
          </p>
        </div>
      )}
    </div>
  );
}

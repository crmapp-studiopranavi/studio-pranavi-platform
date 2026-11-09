/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useInvoices } from '@/lib/hooks/use-invoices';
import { formatCurrency, formatDate } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'issued', label: 'Issued' },
  { value: 'partially_paid', label: 'Partially Paid' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'void', label: 'Void' },
];

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  issued: 'bg-blue-100 text-blue-700',
  partially_paid: 'bg-orange-100 text-orange-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
  void: 'bg-slate-100 text-slate-500',
};

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  issued: 'Issued',
  partially_paid: 'Partially Paid',
  paid: 'Paid',
  overdue: 'Overdue',
  void: 'Void',
};

function daysOverdue(dueDateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr);
  return Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
}

export function InvoicesPage() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);

  const { data, isLoading, isError } = useInvoices({ status, page });
  const invoices = data?.invoices ?? [];
  const total = data?.total ?? 0;
  const pageSize = data?.pageSize ?? 20;

  // Ageing buckets — computed from outstanding invoices in current page
  const outstanding = invoices.filter((inv: any) =>
    ['issued', 'partially_paid', 'overdue'].includes(inv.status)
  );
  const buckets = {
    current: outstanding.filter((inv: any) => daysOverdue(inv.due_date) <= 0),
    d1_30: outstanding.filter(
      (inv: any) => daysOverdue(inv.due_date) >= 1 && daysOverdue(inv.due_date) <= 30
    ),
    d31_60: outstanding.filter(
      (inv: any) => daysOverdue(inv.due_date) >= 31 && daysOverdue(inv.due_date) <= 60
    ),
    d61plus: outstanding.filter((inv: any) => daysOverdue(inv.due_date) > 60),
  };
  const bucketTotal = (items: any[]) =>
    items.reduce((sum: number, inv: any) => sum + (inv.balance_minor ?? 0), 0);

  const totalPages = Math.ceil(total / pageSize);

  if (isError) {
    return (
      <div className="flex h-40 items-center justify-center p-8 text-center">
        <p className="text-sm text-destructive">
          Failed to load invoices. Please refresh and try again.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Invoices</h1>
        <Link
          to="/invoices/new"
          className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
        >
          New Invoice
        </Link>
      </div>

      {/* Status filter */}
      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => {
              setStatus(opt.value);
              setPage(0);
            }}
            className={`rounded-full px-3 py-1 text-sm border transition-colors ${
              status === opt.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border hover:bg-muted'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Ageing summary */}
      {outstanding.length > 0 && !status && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Current', items: buckets.current },
            { label: '1-30 days', items: buckets.d1_30 },
            { label: '31-60 days', items: buckets.d31_60 },
            { label: '61+ days', items: buckets.d61plus },
          ].map(({ label, items }) => (
            <div key={label} className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-lg font-semibold">{formatCurrency(bucketTotal(items))}</p>
              <p className="text-xs text-muted-foreground">
                {items.length} invoice{items.length !== 1 ? 's' : ''}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : invoices.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground">
            No invoices found.{' '}
            <Link to="/invoices/new" className="text-primary hover:underline">
              Create one.
            </Link>
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left">
                <th className="px-4 py-3 font-medium">Invoice #</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Order</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Issued</th>
                <th className="px-4 py-3 font-medium">Due</th>
                <th className="px-4 py-3 font-medium text-right">Total</th>
                <th className="px-4 py-3 font-medium text-right hidden lg:table-cell">Paid</th>
                <th className="px-4 py-3 font-medium text-right">Balance</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoices.map((inv: any) => {
                const customer = inv.customer as { id: string; display_name: string } | null;
                const order = inv.order as { id: string; order_number: string } | null;
                const isOverdueRow = inv.status === 'overdue';
                return (
                  <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        to={`/invoices/${inv.id}`}
                        className="font-mono text-primary hover:underline"
                      >
                        {inv.invoice_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{customer?.display_name ?? '—'}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {order ? (
                        <Link
                          to={`/orders/${order.id}`}
                          className="text-primary hover:underline text-xs"
                        >
                          {order.order_number}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                      {formatDate(inv.issue_date)}
                    </td>
                    <td
                      className={`px-4 py-3 ${isOverdueRow ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}
                    >
                      {formatDate(inv.due_date)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {formatCurrency(inv.total_minor)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono hidden lg:table-cell text-muted-foreground">
                      {formatCurrency(inv.amount_paid_minor)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-mono ${
                        inv.balance_minor > 0 ? 'font-semibold' : 'text-muted-foreground'
                      }`}
                    >
                      {formatCurrency(inv.balance_minor)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[inv.status] ?? 'bg-gray-100 text-gray-600'}`}
                      >
                        {STATUS_LABEL[inv.status] ?? inv.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, total)} of {total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded border border-border px-3 py-1 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="rounded border border-border px-3 py-1 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

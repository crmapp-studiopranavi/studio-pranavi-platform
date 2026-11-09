import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ReportFilters } from './ReportFilters';
import type { FinanceReport as FinData, ReportFiltersState } from '@/lib/reports/report-types';
import Papa from 'papaparse';
import { downloadBlob } from '@/lib/data-export/export-engine';

interface Props {
  filters: ReportFiltersState;
  onFiltersChange: (f: ReportFiltersState) => void;
}

function fmt(minor: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(minor / 100);
}

export function FinanceReport({ filters, onFiltersChange }: Props) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['finance-report', filters],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_finance_report', {
        p_from: filters.from || null,
        p_to: filters.to || null,
        p_customer_id: filters.customerId || null,
      });
      if (error) throw new Error(error.message);
      return data as unknown as FinData;
    },
    staleTime: 60_000,
  });

  function exportAgeingBuckets() {
    if (!data) return;
    const rows = data.ageing_buckets.map((b) => ({
      Bucket: b.bucket_label,
      Invoices: b.count,
      'Amount (₹)': (b.amount_minor / 100).toFixed(2),
    }));
    downloadBlob(
      new Blob([Papa.unparse(rows)], { type: 'text/csv;charset=utf-8;' }),
      'finance_ageing.csv'
    );
  }

  function exportOutstanding() {
    if (!data) return;
    const rows = data.top_customers_outstanding.map((r) => ({
      Customer: r.customer,
      'Outstanding (₹)': (r.outstanding_minor / 100).toFixed(2),
    }));
    downloadBlob(
      new Blob([Papa.unparse(rows)], { type: 'text/csv;charset=utf-8;' }),
      'outstanding_by_customer.csv'
    );
  }

  if (isLoading)
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  if (error)
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
        {(error as Error).message}
      </div>
    );
  if (!data) return null;

  const s = data.summary;

  return (
    <div className="space-y-6">
      <ReportFilters filters={filters} onChange={onFiltersChange} show={{ customer: true }} />

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: 'Quoted Value', value: fmt(s.quoted_value_minor) },
          { label: 'Order Value', value: fmt(s.order_value_minor) },
          { label: 'Invoiced', value: fmt(s.invoiced_minor) },
          { label: 'Received', value: fmt(s.received_minor) },
          { label: 'Outstanding', value: fmt(s.outstanding_minor) },
          { label: 'Overdue', value: fmt(s.overdue_minor) },
        ].map((c) => (
          <div key={c.label} className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Ageing buckets */}
      <section className="rounded-lg border bg-card">
        <div className="border-b px-4 py-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Invoice Ageing</h2>
          <button onClick={exportAgeingBuckets} className="text-xs text-primary hover:underline">
            Export CSV
          </button>
        </div>
        {data.ageing_buckets.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground text-center">
            No outstanding invoices
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Bucket</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                    Invoices
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.ageing_buckets.map((b) => (
                  <tr key={b.bucket_label} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-2">{b.bucket_label}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{b.count}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{fmt(b.amount_minor)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t bg-muted/20 font-semibold">
                  <td className="px-4 py-2">Total</td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {data.ageing_buckets.reduce((a, b) => a + b.count, 0)}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {fmt(data.ageing_buckets.reduce((a, b) => a + b.amount_minor, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      {/* Monthly received */}
      {data.monthly_received.length > 0 && (
        <section className="rounded-lg border bg-card">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Monthly Received Payments</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Month</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                    Amount Received
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.monthly_received.map((r) => (
                  <tr key={r.month} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-2">{r.month}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{fmt(r.amount_minor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Top customers by outstanding */}
      {data.top_customers_outstanding.length > 0 && (
        <section className="rounded-lg border bg-card">
          <div className="border-b px-4 py-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Top Customers — Outstanding Balance</h2>
            <button onClick={exportOutstanding} className="text-xs text-primary hover:underline">
              Export CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                    Customer
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                    Outstanding
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.top_customers_outstanding.map((r) => (
                  <tr key={r.customer} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-2">{r.customer}</td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {fmt(r.outstanding_minor)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

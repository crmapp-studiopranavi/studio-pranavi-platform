import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ReportFilters } from './ReportFilters';
import type {
  SalesReport as SalesReportData,
  ReportFiltersState,
} from '@/lib/reports/report-types';
import Papa from 'papaparse';
import { downloadBlob } from '@/lib/data-export/export-engine';

interface Props {
  filters: ReportFiltersState;
  onFiltersChange: (f: ReportFiltersState) => void;
}

function formatPct(n: number | null): string {
  if (n == null) return '—';
  return n.toFixed(1) + '%';
}

function formatDays(n: number | null): string {
  if (n == null) return '—';
  return n.toFixed(1) + ' days';
}

export function SalesReport({ filters, onFiltersChange }: Props) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['sales-report', filters],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_sales_report', {
        p_from: filters.from || null,
        p_to: filters.to || null,
        p_source: filters.source || null,
        p_service_id: filters.serviceId || null,
        p_owner_id: filters.ownerId || null,
      });
      if (error) throw new Error(error.message);
      return data as unknown as SalesReportData;
    },
    staleTime: 60_000,
  });

  function exportLeadsBySource() {
    if (!data) return;
    const rows = data.leads_by_source.map((r) => ({
      Source: r.source,
      'Total Leads': r.count,
      Won: r.won,
      'Conversion %': r.count > 0 ? ((r.won / r.count) * 100).toFixed(1) : '0',
    }));
    const csv = Papa.unparse(rows);
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), 'sales_by_source.csv');
  }

  function exportSalesPerformance() {
    if (!data) return;
    const rows = data.sales_performance.map((r) => ({
      Owner: r.owner,
      Total: r.total,
      Won: r.won,
      Lost: r.lost,
      'Conversion %': r.conversion_rate != null ? r.conversion_rate.toFixed(1) : '—',
    }));
    const csv = Papa.unparse(rows);
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), 'sales_performance.csv');
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
      <ReportFilters
        filters={filters}
        onChange={onFiltersChange}
        show={{ source: true, service: true, owner: true }}
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: 'Total Leads', value: s.total_leads.toString() },
          { label: 'Won', value: s.won_leads.toString() },
          { label: 'Lost', value: s.lost_leads.toString() },
          { label: 'Conversion', value: formatPct(s.conversion_rate) },
          { label: 'Avg First Response', value: formatDays(s.avg_first_response_days) },
          { label: 'Avg Lead→Quote', value: formatDays(s.avg_lead_to_quote_days) },
        ].map((c) => (
          <div key={c.label} className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Leads by month */}
      {data.leads_by_month.length > 0 && (
        <section className="rounded-lg border bg-card">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Leads by Month</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Month</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                    New Leads
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.leads_by_month.map((r) => (
                  <tr key={r.month} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-2">{r.month}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{r.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Leads by source */}
      <section className="rounded-lg border bg-card">
        <div className="border-b px-4 py-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Leads by Source</h2>
          <button onClick={exportLeadsBySource} className="text-xs text-primary hover:underline">
            Export CSV
          </button>
        </div>
        {data.leads_by_source.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground text-center">No data</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Source</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">Leads</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">Won</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">Conv %</th>
                </tr>
              </thead>
              <tbody>
                {data.leads_by_source.map((r) => (
                  <tr key={r.source} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-2 capitalize">{r.source.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{r.count}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{r.won}</td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {r.count > 0 ? ((r.won / r.count) * 100).toFixed(1) + '%' : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Leads by service */}
      {data.leads_by_service.length > 0 && (
        <section className="rounded-lg border bg-card">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Leads by Service</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Service</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">Leads</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">Won</th>
                </tr>
              </thead>
              <tbody>
                {data.leads_by_service.map((r) => (
                  <tr key={r.service} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-2">{r.service}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{r.count}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{r.won}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Pipeline */}
      {data.pipeline.length > 0 && (
        <section className="rounded-lg border bg-card">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Active Pipeline by Stage</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Stage</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">Leads</th>
                </tr>
              </thead>
              <tbody>
                {data.pipeline.map((r) => (
                  <tr key={r.status} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-2 capitalize">{r.status.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{r.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Won/lost reasons */}
      {data.won_lost_reasons.length > 0 && (
        <section className="rounded-lg border bg-card">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Lost Reasons</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Reason</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">Count</th>
                </tr>
              </thead>
              <tbody>
                {data.won_lost_reasons.map((r) => (
                  <tr key={r.reason} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-2">{r.reason}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{r.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Sales performance — only shown when RPC returns data (admin/manager only) */}
      {data.sales_performance.length > 0 && (
        <section className="rounded-lg border bg-card">
          <div className="border-b px-4 py-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Sales Performance by Owner</h2>
            <button
              onClick={exportSalesPerformance}
              className="text-xs text-primary hover:underline"
            >
              Export CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Owner</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">Total</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">Won</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">Lost</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">Conv %</th>
                </tr>
              </thead>
              <tbody>
                {data.sales_performance.map((r) => (
                  <tr key={r.owner} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-2">{r.owner}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{r.total}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{r.won}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{r.lost}</td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {formatPct(r.conversion_rate)}
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

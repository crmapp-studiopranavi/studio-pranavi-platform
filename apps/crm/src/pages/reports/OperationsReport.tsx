import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ReportFilters } from './ReportFilters';
import type { OperationsReport as OpsData, ReportFiltersState } from '@/lib/reports/report-types';
import Papa from 'papaparse';
import { downloadBlob } from '@/lib/data-export/export-engine';

interface Props {
  filters: ReportFiltersState;
  onFiltersChange: (f: ReportFiltersState) => void;
}

export function OperationsReport({ filters, onFiltersChange }: Props) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['operations-report', filters],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_operations_report', {
        p_from: filters.from || null,
        p_to: filters.to || null,
        p_project_status: filters.projectStatus || null,
        p_owner_id: filters.ownerId || null,
      });
      if (error) throw new Error(error.message);
      return data as unknown as OpsData;
    },
    staleTime: 60_000,
  });

  function exportDelayed() {
    if (!data) return;
    const rows = data.delayed_projects_list.map((r) => ({
      'Project Number': r.project_number,
      'Project Name': r.name,
      Customer: r.customer,
      'Target Completion': r.target_completion_date,
      'Days Delayed': r.days_delayed,
      Status: r.status,
    }));
    downloadBlob(
      new Blob([Papa.unparse(rows)], { type: 'text/csv;charset=utf-8;' }),
      'delayed_projects.csv'
    );
  }

  function exportOverdueMilestones() {
    if (!data) return;
    const rows = data.overdue_milestones_list.map((r) => ({
      Project: r.project_name,
      Milestone: r.milestone_name,
      'Due Date': r.due_date,
      'Days Overdue': r.days_overdue,
      Status: r.status,
    }));
    downloadBlob(
      new Blob([Papa.unparse(rows)], { type: 'text/csv;charset=utf-8;' }),
      'overdue_milestones.csv'
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
  const installRate =
    s.installation_total > 0
      ? ((s.installation_completed / s.installation_total) * 100).toFixed(1) + '%'
      : '—';

  return (
    <div className="space-y-6">
      <ReportFilters
        filters={filters}
        onChange={onFiltersChange}
        show={{ owner: true, projectStatus: true }}
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: 'Active Projects', value: s.active_projects.toString() },
          { label: 'Delayed Projects', value: s.delayed_projects.toString() },
          { label: 'Overdue Milestones', value: s.overdue_milestones.toString() },
          { label: 'Upcoming Installs (30d)', value: s.upcoming_installations_30d.toString() },
          { label: 'Install Completion', value: installRate },
          {
            label: 'Avg Order→Complete',
            value:
              s.avg_order_to_completion_days != null
                ? s.avg_order_to_completion_days.toFixed(1) + ' days'
                : '—',
          },
        ].map((c) => (
          <div key={c.label} className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Projects by status */}
      {data.projects_by_status.length > 0 && (
        <section className="rounded-lg border bg-card">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Projects by Status</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">Count</th>
                </tr>
              </thead>
              <tbody>
                {data.projects_by_status.map((r) => (
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

      {/* Delayed projects */}
      <section className="rounded-lg border bg-card">
        <div className="border-b px-4 py-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Delayed Projects</h2>
          {data.delayed_projects_list.length > 0 && (
            <button onClick={exportDelayed} className="text-xs text-primary hover:underline">
              Export CSV
            </button>
          )}
        </div>
        {data.delayed_projects_list.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground text-center">No delayed projects</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Project</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                    Customer
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                    Target Date
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                    Days Delayed
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.delayed_projects_list.map((r) => (
                  <tr key={r.project_number} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-2 font-medium">
                      {r.project_number}
                      <span className="ml-2 font-normal text-muted-foreground">{r.name}</span>
                    </td>
                    <td className="px-4 py-2">{r.customer}</td>
                    <td className="px-4 py-2">{r.target_completion_date}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-destructive font-medium">
                      {r.days_delayed}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Overdue milestones */}
      <section className="rounded-lg border bg-card">
        <div className="border-b px-4 py-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Overdue Milestones</h2>
          {data.overdue_milestones_list.length > 0 && (
            <button
              onClick={exportOverdueMilestones}
              className="text-xs text-primary hover:underline"
            >
              Export CSV
            </button>
          )}
        </div>
        {data.overdue_milestones_list.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground text-center">
            No overdue milestones
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Project</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                    Milestone
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                    Due Date
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                    Days Overdue
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.overdue_milestones_list.map((r, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-2">{r.project_name}</td>
                    <td className="px-4 py-2">{r.milestone_name}</td>
                    <td className="px-4 py-2">{r.due_date}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-destructive font-medium">
                      {r.days_overdue}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Upcoming installations */}
      <section className="rounded-lg border bg-card">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-semibold">Upcoming Installations (next 30 days)</h2>
        </div>
        {data.upcoming_installations.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground text-center">
            No upcoming installations
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Project</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                    Scheduled Start
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Team</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.upcoming_installations.map((r, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-2">
                      {r.project_number}
                      <span className="ml-2 text-muted-foreground">{r.project_name}</span>
                    </td>
                    <td className="px-4 py-2">
                      {new Date(r.scheduled_start).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-2">{r.assigned_team || '—'}</td>
                    <td className="px-4 py-2 capitalize">{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

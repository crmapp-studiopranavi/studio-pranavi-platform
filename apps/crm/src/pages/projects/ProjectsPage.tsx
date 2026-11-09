/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProjects } from '@/lib/hooks/use-projects';
import { formatDate } from '@/lib/format';

const PROJECT_STATUS_LABELS: Record<string, string> = {
  planned: 'Planned',
  active: 'Active',
  blocked: 'Blocked',
  on_hold: 'On Hold',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const PROJECT_STATUS_COLORS: Record<string, string> = {
  planned: 'bg-gray-100 text-gray-600',
  active: 'bg-blue-100 text-blue-700',
  blocked: 'bg-red-100 text-red-700',
  on_hold: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

function ProjectStatusBadge({ status }: { status: string }) {
  const cls = PROJECT_STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {PROJECT_STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function ProjectsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);

  const { data, isLoading, isError } = useProjects({ status: statusFilter || undefined, page });
  const projects = data?.projects ?? [];
  const total = data?.total ?? 0;
  const pageSize = data?.pageSize ?? 20;
  const totalPages = Math.ceil(total / pageSize);

  if (isError) {
    return (
      <div className="flex h-40 items-center justify-center p-8 text-center">
        <p className="text-sm text-destructive">
          Failed to load projects. Please refresh and try again.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Projects</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {total} project{total !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Filters */}
      <div className="mb-4 flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(0);
          }}
          className="rounded border border-border bg-background px-3 py-1.5 text-sm"
        >
          <option value="">All Statuses</option>
          {Object.entries(PROJECT_STATUS_LABELS).map(([val, label]) => (
            <option key={val} value={val}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
          Loading projects…
        </div>
      ) : projects.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
          <p>No projects found.</p>
          <p className="text-xs">Projects are created from order detail pages.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Project #</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Customer</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Manager</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Start Date
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {projects.map((project) => {
                const customer = (project as any).customer as {
                  id: string;
                  display_name: string;
                } | null;
                const manager = (project as any).manager as {
                  id: string;
                  full_name: string;
                } | null;
                return (
                  <tr key={project.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Link
                        to={`/projects/${project.id}`}
                        className="font-mono text-primary hover:underline"
                      >
                        {project.project_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-medium">{project.name}</td>
                    <td className="px-4 py-3">
                      {customer ? (
                        <Link to={`/customers/${customer.id}`} className="hover:underline">
                          {customer.display_name}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{manager?.full_name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <ProjectStatusBadge status={project.status ?? ''} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(project.start_date)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(project.target_completion_date)}
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
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {page + 1} of {totalPages}
          </span>
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

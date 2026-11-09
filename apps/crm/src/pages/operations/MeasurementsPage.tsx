import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMeasurements } from '@/lib/hooks/use-measurements';
import { formatDate } from '@/lib/format';

// ── Dimension helper ──────────────────────────────────────────────────────────

function formatDimensions(w: number | null, h: number | null, d: number | null): string {
  const parts: string[] = [];
  if (w != null) parts.push(String(w));
  if (h != null) parts.push(String(h));
  if (d != null) parts.push(String(d));
  if (parts.length === 0) return '—';
  return parts.join(' × ') + ' mm';
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MeasurementsPage() {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');

  const isPending = searchParams.get('pending') === '1';

  const { data, isLoading } = useMeasurements();

  // Client-side filter by area_or_item
  const filtered = (data ?? []).filter((m) => {
    if (!search.trim()) return true;
    return m.area_or_item?.toLowerCase().includes(search.trim().toLowerCase());
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">
            {isPending ? 'Measurements Needed' : 'Measurements'}
          </h1>
          {isPending && (
            <p className="mt-1 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-1.5">
              These are site visits that have been completed but have no measurements recorded yet.
            </p>
          )}
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search by area / item…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded border border-border bg-background px-3 py-1.5 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="px-4 py-2 text-left">Project</th>
              <th className="px-4 py-2 text-left">Area / Item</th>
              <th className="px-4 py-2 text-left">Dimensions</th>
              <th className="px-4 py-2 text-left">Qty</th>
              <th className="px-4 py-2 text-left">Recorded By</th>
              <th className="px-4 py-2 text-left">Site Visit</th>
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
            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center">
                  <p className="font-medium text-muted-foreground">
                    {search.trim()
                      ? 'No measurements match your search'
                      : 'No measurements recorded yet'}
                  </p>
                </td>
              </tr>
            )}

            {/* Data rows */}
            {!isLoading &&
              filtered.map((m) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const project = m.project as any as {
                  id: string;
                  project_number: string | null;
                  name: string | null;
                } | null;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const siteVisit = m.site_visit as any as {
                  id: string;
                  scheduled_start: string | null;
                } | null;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const recorder = m.recorded_by as any as { full_name: string | null } | null;

                return (
                  <tr key={m.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-4 py-2">
                      {project ? (
                        <Link
                          to={`/projects/${project.id}`}
                          className="text-primary hover:underline font-medium"
                        >
                          {[project.project_number, project.name].filter(Boolean).join(' — ')}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2 font-medium">{m.area_or_item}</td>
                    <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">
                      {formatDimensions(m.width_mm, m.height_mm, m.depth_mm)}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">
                      {m.quantity != null ? `${m.quantity} ${m.unit ?? ''}`.trim() : '—'}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {recorder?.full_name ?? '—'}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">
                      {siteVisit?.scheduled_start ? formatDate(siteVisit.scheduled_start) : '—'}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useInstallations, useUpdateInstallation } from '@/lib/hooks/use-installations';
import { formatDate, formatDateTime } from '@/lib/format';

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = 'upcoming' | 'in_progress' | 'completed' | 'all';

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-amber-100 text-amber-800',
  completed: 'bg-green-100 text-green-800',
  rescheduled: 'bg-purple-100 text-purple-800',
  cancelled: 'bg-slate-100 text-slate-600',
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Scheduled',
  in_progress: 'In Progress',
  completed: 'Completed',
  rescheduled: 'Rescheduled',
  cancelled: 'Cancelled',
};

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-600';
  const label = STATUS_LABELS[status] ?? status;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}
    >
      {label}
    </span>
  );
}

// ── Sign-off modal ─────────────────────────────────────────────────────────────

interface SignOffModalProps {
  installationId: string;
  onClose: () => void;
}

function SignOffModal({ installationId, onClose }: SignOffModalProps) {
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const updateInstallation = useUpdateInstallation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await updateInstallation.mutateAsync({
        id: installationId,
        updates: {
          customer_signoff_name: name.trim(),
          signed_off_at: new Date().toISOString(),
          status: 'completed',
        },
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-lg border border-border bg-background p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold">Customer Sign-off</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Customer Name</label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name of customer representative"
              className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-border px-4 py-1.5 text-sm hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="rounded bg-primary px-4 py-1.5 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {submitting ? 'Saving…' : 'Confirm Sign-off'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Tabs config ───────────────────────────────────────────────────────────────

const TABS: { key: Tab; label: string }[] = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'all', label: 'All' },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function InstallationsPage() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>('upcoming');
  const [signOffId, setSignOffId] = useState<string | null>(null);

  const isWeekOnly = searchParams.get('week') === '1';

  // Build filters based on active tab
  const filters = (() => {
    if (isWeekOnly) {
      // ?week=1 overrides tab and shows next 7 days regardless
      return { week: true };
    }
    switch (activeTab) {
      case 'upcoming':
        return { statusIn: ['scheduled', 'in_progress'], fromNow: true };
      case 'in_progress':
        return { status: 'in_progress' };
      case 'completed':
        return { status: 'completed' };
      case 'all':
      default:
        return {};
    }
  })();

  const { data, isLoading } = useInstallations(filters);

  const COLS = 7;

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">
          {isWeekOnly ? 'Installations This Week' : 'Installations'}
        </h1>
      </div>

      {/* Tabs (hidden when ?week=1) */}
      {!isWeekOnly && (
        <div className="mb-4 flex gap-1 border-b border-border">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="px-4 py-2 text-left">Project</th>
              <th className="px-4 py-2 text-left">Customer</th>
              <th className="px-4 py-2 text-left">Scheduled Start</th>
              <th className="px-4 py-2 text-left">Scheduled End</th>
              <th className="px-4 py-2 text-left">Team</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Sign-off</th>
            </tr>
          </thead>
          <tbody>
            {/* Skeleton rows */}
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t border-border">
                  {Array.from({ length: COLS }).map((__, j) => (
                    <td key={j} className="px-4 py-2">
                      <span className="block animate-pulse rounded bg-muted h-4" />
                    </td>
                  ))}
                </tr>
              ))}

            {/* Empty state */}
            {!isLoading && (data ?? []).length === 0 && (
              <tr>
                <td colSpan={COLS} className="px-4 py-10 text-center">
                  <p className="font-medium text-muted-foreground">No installations scheduled</p>
                </td>
              </tr>
            )}

            {/* Data rows */}
            {!isLoading &&
              (data ?? []).map((inst) => {
                const project = inst.project as any as {
                  id: string;
                  project_number: string | null;
                  name: string | null;
                  customer: { id: string; display_name: string } | null;
                } | null;

                const isCompleted = inst.status === 'completed';
                const hasSignoff = !!inst.customer_signoff_name;

                return (
                  <tr key={inst.id} className="border-t border-border hover:bg-muted/30">
                    {/* Project */}
                    <td className="px-4 py-2 font-medium">
                      {project ? (
                        <span>
                          {[project.project_number, project.name].filter(Boolean).join(' — ')}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-2 text-muted-foreground">
                      {project?.customer?.display_name ?? '—'}
                    </td>

                    {/* Scheduled Start */}
                    <td className="px-4 py-2 whitespace-nowrap text-muted-foreground">
                      {formatDateTime(inst.scheduled_start)}
                    </td>

                    {/* Scheduled End */}
                    <td className="px-4 py-2 whitespace-nowrap text-muted-foreground">
                      {formatDate(inst.scheduled_end)}
                    </td>

                    {/* Team */}
                    <td className="px-4 py-2 text-muted-foreground">{inst.assigned_team ?? '—'}</td>

                    {/* Status */}
                    <td className="px-4 py-2">
                      <StatusBadge status={inst.status} />
                    </td>

                    {/* Sign-off */}
                    <td className="px-4 py-2">
                      {isCompleted && !hasSignoff ? (
                        <button
                          onClick={() => setSignOffId(inst.id)}
                          className="rounded bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                        >
                          Sign Off
                        </button>
                      ) : hasSignoff ? (
                        <span className="text-sm text-muted-foreground">
                          {inst.customer_signoff_name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Sign-off modal */}
      {signOffId && <SignOffModal installationId={signOffId} onClose={() => setSignOffId(null)} />}
    </div>
  );
}

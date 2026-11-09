import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { LeadStatusBadge } from '@/components/leads/LeadStatusBadge';
import { isOverdue, relativeDays } from '@/lib/format';

type FollowUpLead = {
  id: string;
  full_name: string | null;
  phone: string | null;
  status: string;
  next_follow_up_at: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  owner: { id: string; full_name: string | null } | null | any;
};

function useFollowUps(overdueOnly: boolean) {
  return useQuery({
    queryKey: ['follow-ups', overdueOnly],
    queryFn: async () => {
      let q = supabase
        .from('leads')
        .select(
          `id, full_name, phone, status, next_follow_up_at,
           owner:profiles!owner_id(id, full_name)`
        )
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .not('status', 'in', '("won","lost","archived")' as any)
        .not('next_follow_up_at', 'is', null)
        .order('next_follow_up_at', { ascending: true })
        .limit(100);

      if (overdueOnly) {
        q = q.lte('next_follow_up_at', new Date().toISOString());
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as FollowUpLead[];
    },
    placeholderData: (prev) => prev,
  });
}

function rowBg(nextFollowUpAt: string | null): string {
  if (!nextFollowUpAt) return '';
  const date = new Date(nextFollowUpAt);
  const now = new Date();
  if (date < now) return 'bg-red-50';
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  if (date <= todayEnd) return 'bg-amber-50';
  return '';
}

export default function FollowUpsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const overdueOnly = searchParams.get('overdue') === '1';

  const { data, isLoading } = useFollowUps(overdueOnly);

  const setOverdue = (val: boolean) => {
    const p = new URLSearchParams(searchParams);
    if (val) p.set('overdue', '1');
    else p.delete('overdue');
    setSearchParams(p, { replace: true });
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Follow-ups</h1>

        {/* Filter tabs */}
        <div className="flex gap-1 rounded border border-border p-0.5 bg-muted/30">
          <button
            onClick={() => setOverdue(false)}
            className={`rounded px-3 py-1 text-sm transition-colors ${
              !overdueOnly
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setOverdue(true)}
            className={`rounded px-3 py-1 text-sm transition-colors ${
              overdueOnly
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            Overdue
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Phone</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Follow-up Due</th>
              <th className="px-4 py-2 text-left">Owner</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
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

            {!isLoading && (data ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No follow-ups scheduled.{' '}
                  <Link to="/leads" className="text-primary hover:underline">
                    View all leads
                  </Link>
                </td>
              </tr>
            )}

            {!isLoading &&
              (data ?? []).map((lead) => {
                const bg = rowBg(lead.next_follow_up_at);
                const overdue = isOverdue(lead.next_follow_up_at);
                const owner = lead.owner as { full_name: string | null } | null;
                return (
                  <tr key={lead.id} className={`border-t border-border ${bg}`}>
                    <td className="px-4 py-2 font-medium">
                      <Link to={`/leads/${lead.id}`} className="hover:underline text-primary">
                        {lead.full_name ?? '—'}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{lead.phone ?? '—'}</td>
                    <td className="px-4 py-2">
                      <LeadStatusBadge status={lead.status} />
                    </td>
                    <td
                      className={`px-4 py-2 ${overdue ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}
                    >
                      {relativeDays(lead.next_follow_up_at)}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{owner?.full_name ?? '—'}</td>
                    <td className="px-4 py-2">
                      <Link
                        to={`/leads/${lead.id}`}
                        className="rounded border border-border px-3 py-1 text-xs hover:bg-muted transition-colors"
                      >
                        Open Lead
                      </Link>
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

import { useSalesMetrics } from '@/lib/hooks/use-dashboard-metrics';
import { MetricCard, SkeletonCard } from './MetricCard';

export function SalesDashboard() {
  const { data: metrics, isLoading, error, refetch } = useSalesMetrics();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50/50 p-6 text-center">
        <p className="text-sm text-red-600">Failed to load dashboard metrics.</p>
        <button
          onClick={() => refetch()}
          className="mt-2 text-sm font-medium text-red-700 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  const m = metrics!;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      <MetricCard label="My Leads" value={m.my_leads} to="/leads?mine=1" />
      <MetricCard
        label="Overdue Follow-ups"
        value={m.overdue_followups}
        to="/follow-ups?overdue=1"
        urgent
      />
      <MetricCard
        label="Site Visits Pending"
        value={m.site_visits_pending}
        to="/site-visits?mine=1"
      />
      <MetricCard label="Quotes Awaiting" value={m.quotes_awaiting} to="/quotes?status=awaiting" />
      <MetricCard
        label="Quotes Expiring"
        value={m.quotes_expiring}
        to="/quotes?expiring=1"
        urgent
      />
      <MetricCard label="Pipeline Leads" value={m.pipeline_leads} to="/leads?stage=pipeline" />
    </div>
  );
}

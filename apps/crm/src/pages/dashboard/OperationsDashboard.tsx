import { useOperationsMetrics } from '@/lib/hooks/use-dashboard-metrics';
import { MetricCard, SkeletonCard } from './MetricCard';

export function OperationsDashboard() {
  const { data: metrics, isLoading, error, refetch } = useOperationsMetrics();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
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
      <MetricCard label="Orders in Production" value={m.orders_in_production} to="/production" />
      <MetricCard
        label="Blocked Projects"
        value={m.blocked_projects}
        to="/projects?status=blocked"
        urgent
      />
      <MetricCard
        label="Overdue Milestones"
        value={m.overdue_milestones}
        to="/projects?milestones=overdue"
        urgent
      />
      <MetricCard
        label="Measurements Pending"
        value={m.measurements_pending}
        to="/measurements?pending=1"
      />
      <MetricCard
        label="Upcoming Installations"
        value={m.upcoming_installations}
        to="/installations?week=1"
      />
    </div>
  );
}

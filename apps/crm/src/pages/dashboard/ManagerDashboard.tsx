import { useManagerMetrics } from '@/lib/hooks/use-dashboard-metrics';
import { formatCurrency } from '@/lib/format';
import { MetricCard, SkeletonCard } from './MetricCard';

export function ManagerDashboard() {
  const { data: metrics, isLoading, error, refetch } = useManagerMetrics();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
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
    <div className="space-y-6">
      {/* Row 1: Sales */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Sales
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <MetricCard label="New Leads" value={m.new_leads} to="/leads?status=new" />
          <MetricCard label="Follow-ups Due" value={m.followups_due} to="/follow-ups" urgent />
          <MetricCard
            label="Quotes Awaiting"
            value={m.quotes_awaiting}
            to="/quotes?status=awaiting"
          />
        </div>
      </div>

      {/* Row 2: Operations */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Operations
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MetricCard label="Active Orders" value={m.active_orders} to="/orders" />
          <MetricCard label="Active Projects" value={m.active_projects} to="/projects" />
          <MetricCard
            label="Delayed Projects"
            value={m.delayed_projects}
            to="/projects?delayed=1"
            urgent
          />
          <MetricCard
            label="Installs This Week"
            value={m.installs_this_week}
            to="/installations?week=1"
          />
        </div>
      </div>

      {/* Row 3: Finance */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Finance
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <MetricCard label="Invoiced" value={formatCurrency(m.invoiced_minor)} to="/invoices" />
          <MetricCard label="Received" value={formatCurrency(m.received_minor)} to="/payments" />
          <MetricCard
            label="Outstanding"
            value={formatCurrency(m.outstanding_minor)}
            to="/outstanding"
            urgent={m.outstanding_minor > 0}
          />
        </div>
      </div>
    </div>
  );
}

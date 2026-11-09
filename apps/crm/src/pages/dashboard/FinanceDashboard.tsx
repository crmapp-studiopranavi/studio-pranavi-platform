import { useFinanceMetrics } from '@/lib/hooks/use-dashboard-metrics';
import { formatCurrency } from '@/lib/format';
import { MetricCard, SkeletonCard } from './MetricCard';

export function FinanceDashboard() {
  const { data: metrics, isLoading, error, refetch } = useFinanceMetrics();

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
      <MetricCard label="Invoices Issued" value={m.invoices_issued} to="/invoices?status=issued" />
      <MetricCard
        label="Overdue Invoices"
        value={m.overdue_invoices}
        to="/invoices?status=overdue"
        urgent
      />
      <MetricCard
        label="Payments This Month"
        value={formatCurrency(m.payments_received_minor)}
        to="/payments"
      />
      <MetricCard
        label="Outstanding"
        value={formatCurrency(m.outstanding_minor)}
        to="/outstanding"
        urgent={m.outstanding_minor > 0}
      />
      <MetricCard
        label="Aged 30+ Days"
        value={formatCurrency(m.ageing_30_minor)}
        to="/outstanding?age=30"
      />
      <MetricCard
        label="Aged 60+ Days"
        value={formatCurrency(m.ageing_60_minor)}
        to="/outstanding?age=60"
      />
    </div>
  );
}

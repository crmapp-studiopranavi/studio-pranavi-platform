import { useAuth } from '@/lib/auth-context';
import { ManagerDashboard } from './dashboard/ManagerDashboard';
import { SalesDashboard } from './dashboard/SalesDashboard';
import { OperationsDashboard } from './dashboard/OperationsDashboard';
// FinanceDashboard is available but not yet wired (no 'finance' role yet)
// import { FinanceDashboard } from './dashboard/FinanceDashboard';

export function DashboardPage() {
  const { profile } = useAuth();
  const role = profile?.role;

  const showManager = role === 'admin' || role === 'manager' || role === 'viewer';
  const showSales = role === 'sales';
  const showOperations = role === 'operations';
  const noDashboard = !!role && !showManager && !showSales && !showOperations;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Welcome back, {profile?.full_name ?? 'there'}.
        </p>
      </div>
      {!role && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-muted rounded-lg h-24" />
          ))}
        </div>
      )}
      {showManager && <ManagerDashboard />}
      {showSales && <SalesDashboard />}
      {showOperations && <OperationsDashboard />}
      {noDashboard && (
        <p className="text-sm text-muted-foreground">Dashboard not available for your role.</p>
      )}
    </div>
  );
}

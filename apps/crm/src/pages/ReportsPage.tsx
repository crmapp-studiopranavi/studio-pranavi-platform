import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { SalesReport } from './reports/SalesReport';
import { OperationsReport } from './reports/OperationsReport';
import { FinanceReport } from './reports/FinanceReport';
import type { ReportFiltersState } from '@/lib/reports/report-types';

type Tab = 'sales' | 'operations' | 'finance';

const DEFAULT_FILTERS: ReportFiltersState = {
  from: '',
  to: '',
  source: '',
  serviceId: '',
  ownerId: '',
  projectStatus: '',
  customerId: '',
};

function defaultFromDate(): string {
  const now = new Date();
  const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return `${year}-04-01`;
}

export default function ReportsPage() {
  const { profile } = useAuth();
  const role = profile?.role ?? 'viewer';

  const canSeeSales = ['admin', 'manager', 'sales'].includes(role);
  const canSeeOps = ['admin', 'manager', 'operations'].includes(role);
  const canSeeFin = ['admin', 'manager'].includes(role);

  const availableTabs: Tab[] = [
    ...(canSeeSales ? ['sales' as Tab] : []),
    ...(canSeeOps ? ['operations' as Tab] : []),
    ...(canSeeFin ? ['finance' as Tab] : []),
  ];

  const [activeTab, setActiveTab] = useState<Tab>(availableTabs[0] ?? 'sales');
  const [filters, setFilters] = useState<ReportFiltersState>({
    ...DEFAULT_FILTERS,
    from: defaultFromDate(),
  });

  if (availableTabs.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        You do not have permission to view reports.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">Business intelligence and analytics.</p>
      </div>

      <div className="flex gap-1 rounded-lg border bg-muted/30 p-1 w-fit">
        {availableTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setFilters({ ...DEFAULT_FILTERS, from: defaultFromDate() });
            }}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors capitalize
              ${activeTab === tab ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'sales' && canSeeSales && (
        <SalesReport filters={filters} onFiltersChange={setFilters} />
      )}
      {activeTab === 'operations' && canSeeOps && (
        <OperationsReport filters={filters} onFiltersChange={setFilters} />
      )}
      {activeTab === 'finance' && canSeeFin && (
        <FinanceReport filters={filters} onFiltersChange={setFilters} />
      )}
    </div>
  );
}

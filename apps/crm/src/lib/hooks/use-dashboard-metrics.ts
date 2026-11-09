import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface ManagerMetrics {
  new_leads: number;
  followups_due: number;
  quotes_awaiting: number;
  active_orders: number;
  active_projects: number;
  delayed_projects: number;
  installs_this_week: number;
  invoiced_minor: number;
  received_minor: number;
  outstanding_minor: number;
}

export interface SalesMetrics {
  my_leads: number;
  overdue_followups: number;
  site_visits_pending: number;
  quotes_awaiting: number;
  quotes_expiring: number;
  pipeline_leads: number;
}

export interface OperationsMetrics {
  orders_in_production: number;
  blocked_projects: number;
  overdue_milestones: number;
  measurements_pending: number;
  upcoming_installations: number;
}

export interface FinanceMetrics {
  invoices_issued: number;
  overdue_invoices: number;
  payments_received_minor: number;
  outstanding_minor: number;
  ageing_30_minor: number;
  ageing_60_minor: number;
}

export function useManagerMetrics() {
  return useQuery({
    queryKey: ['dashboard-manager'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_manager_metrics');
      if (error) throw error;
      return data as unknown as ManagerMetrics;
    },
    refetchInterval: 60_000,
  });
}

export function useSalesMetrics() {
  return useQuery({
    queryKey: ['dashboard-sales'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_sales_metrics');
      if (error) throw error;
      return data as unknown as SalesMetrics;
    },
    refetchInterval: 60_000,
  });
}

export function useOperationsMetrics() {
  return useQuery({
    queryKey: ['dashboard-operations'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_operations_metrics');
      if (error) throw error;
      return data as unknown as OperationsMetrics;
    },
    refetchInterval: 60_000,
  });
}

export function useFinanceMetrics() {
  return useQuery({
    queryKey: ['dashboard-finance'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_finance_metrics');
      if (error) throw error;
      return data as unknown as FinanceMetrics;
    },
    refetchInterval: 60_000,
  });
}

// Legacy hook — preserves the shape used by DashboardPage.tsx
export function useDashboardMetrics() {
  return useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      const now = new Date().toISOString();

      const today = new Date().toISOString().split('T')[0];
      const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const [
        newLeadsResult,
        followupsResult,
        tasksResult,
        customersResult,
        quotesResult,
        ordersResult,
        milestonesResult,
        installationsResult,
        outstandingInvoicesResult,
        overdueInvoicesResult,
      ] = await Promise.all([
        supabase.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'new'),
        supabase
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .not('status', 'in', '("won","lost","archived")')
          .lte('next_follow_up_at', now),
        supabase
          .from('tasks')
          .select('id', { count: 'exact', head: true })
          .not('status', 'in', '("done","cancelled")'),
        supabase
          .from('customers')
          .select('id', { count: 'exact', head: true })
          .is('archived_at', null),
        supabase
          .from('quotes')
          .select('id', { count: 'exact', head: true })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .in('status', ['draft', 'internal_review', 'sent', 'viewed'] as any[]),
        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .in('status', [
            'confirmed',
            'design_or_measurement',
            'production',
            'ready_for_installation',
            'installation_scheduled',
            'installed',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ] as any[])
          .is('archived_at', null),
        supabase
          .from('project_milestones')
          .select('id', { count: 'exact', head: true })
          .lt('due_date', today)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .in('status', ['pending', 'in_progress', 'blocked'] as any[]),
        supabase
          .from('installations')
          .select('id', { count: 'exact', head: true })
          .gte('scheduled_start', now)
          .lte('scheduled_start', sevenDaysLater)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .in('status', ['scheduled', 'in_progress'] as any[]),
        supabase
          .from('invoices')
          .select('id', { count: 'exact', head: true })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .in('status', ['issued', 'partially_paid', 'overdue'] as any[])
          .is('archived_at', null),
        supabase
          .from('invoices')
          .select('id', { count: 'exact', head: true })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .eq('status', 'overdue' as any)
          .is('archived_at', null),
      ]);

      return {
        newLeads: newLeadsResult.count ?? 0,
        followupsDue: followupsResult.count ?? 0,
        activeTasks: tasksResult.count ?? 0,
        totalCustomers: customersResult.count ?? 0,
        activeQuotes: quotesResult.count ?? 0,
        activeOrders: ordersResult.count ?? 0,
        overdueMilestones: milestonesResult.count ?? 0,
        upcomingInstallations: installationsResult.count ?? 0,
        outstandingInvoices: outstandingInvoicesResult.count ?? 0,
        overdueInvoices: overdueInvoicesResult.count ?? 0,
      };
    },
    refetchInterval: 60000,
  });
}

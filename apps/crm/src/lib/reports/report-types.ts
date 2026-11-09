// Shared types for reporting RPCs

export interface SalesReportSummary {
  total_leads: number;
  won_leads: number;
  lost_leads: number;
  conversion_rate: number | null;
  avg_first_response_days: number | null;
  avg_lead_to_quote_days: number | null;
}

export interface SalesReport {
  summary: SalesReportSummary;
  leads_by_month: Array<{ month: string; count: number }>;
  leads_by_source: Array<{ source: string; count: number; won: number }>;
  leads_by_service: Array<{ service: string; count: number; won: number }>;
  pipeline: Array<{ status: string; count: number }>;
  won_lost_reasons: Array<{ reason: string; count: number }>;
  sales_performance: Array<{
    owner: string;
    total: number;
    won: number;
    lost: number;
    conversion_rate: number | null;
  }>;
}

export interface OperationsReportSummary {
  active_projects: number;
  delayed_projects: number;
  overdue_milestones: number;
  upcoming_installations_30d: number;
  avg_order_to_completion_days: number | null;
  installation_total: number;
  installation_completed: number;
}

export interface OperationsReport {
  summary: OperationsReportSummary;
  projects_by_status: Array<{ status: string; count: number }>;
  delayed_projects_list: Array<{
    project_number: string;
    name: string;
    status: string;
    target_completion_date: string;
    days_delayed: number;
    customer: string;
  }>;
  overdue_milestones_list: Array<{
    project_name: string;
    project_number: string;
    milestone_name: string;
    due_date: string;
    days_overdue: number;
    status: string;
  }>;
  upcoming_installations: Array<{
    project_name: string;
    project_number: string;
    scheduled_start: string;
    scheduled_end: string | null;
    assigned_team: string;
    status: string;
  }>;
}

export interface FinanceReportSummary {
  quoted_value_minor: number;
  order_value_minor: number;
  invoiced_minor: number;
  received_minor: number;
  outstanding_minor: number;
  overdue_minor: number;
}

export interface FinanceReport {
  summary: FinanceReportSummary;
  monthly_received: Array<{ month: string; amount_minor: number }>;
  ageing_buckets: Array<{ bucket_label: string; count: number; amount_minor: number }>;
  top_customers_outstanding: Array<{ customer: string; outstanding_minor: number }>;
}

export interface ReportFiltersState {
  from: string;
  to: string;
  source: string;
  serviceId: string;
  ownerId: string;
  projectStatus: string;
  customerId: string;
}

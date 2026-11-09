import Papa from 'papaparse';

const DANGEROUS_PREFIXES = ['=', '+', '-', '@', '|', '\t', '\r'];

export function sanitiseValue(v: unknown): string {
  if (v == null) return '';
  const s = String(v);
  if (DANGEROUS_PREFIXES.some((p) => s.startsWith(p))) return `'${s}`;
  return s;
}

export interface ExportColumn {
  header: string;
  key: string;
}

export interface ExportConfig {
  columns: ExportColumn[];
  table: string;
}

export const EXPORT_CONFIGS: Record<string, ExportConfig> = {
  leads: {
    table: 'leads',
    columns: [
      { header: 'ID', key: 'id' },
      { header: 'Lead Number', key: 'lead_number' },
      { header: 'Full Name', key: 'full_name' },
      { header: 'Email', key: 'email' },
      { header: 'Phone', key: 'phone' },
      { header: 'WhatsApp', key: 'whatsapp_number' },
      { header: 'Status', key: 'status' },
      { header: 'Priority', key: 'priority' },
      { header: 'Source', key: 'source' },
      { header: 'Location', key: 'location_text' },
      { header: 'Project Description', key: 'project_description' },
      { header: 'Service Interest', key: 'service_interest' },
      { header: 'Budget Min (₹)', key: 'budget_min_minor' },
      { header: 'Budget Max (₹)', key: 'budget_max_minor' },
      { header: 'Next Follow-up', key: 'next_follow_up_at' },
      { header: 'Lost Reason', key: 'lost_reason' },
      { header: 'Created At', key: 'created_at' },
    ],
  },
  customers: {
    table: 'customers',
    columns: [
      { header: 'ID', key: 'id' },
      { header: 'Customer Number', key: 'customer_number' },
      { header: 'Display Name', key: 'display_name' },
      { header: 'Customer Type', key: 'customer_type' },
      { header: 'GSTIN', key: 'gstin' },
      { header: 'Notes', key: 'notes' },
      { header: 'Created At', key: 'created_at' },
    ],
  },
  tasks: {
    table: 'tasks',
    columns: [
      { header: 'ID', key: 'id' },
      { header: 'Title', key: 'title' },
      { header: 'Status', key: 'status' },
      { header: 'Priority', key: 'priority' },
      { header: 'Due Date', key: 'due_date' },
      { header: 'Notes', key: 'notes' },
      { header: 'Created At', key: 'created_at' },
    ],
  },
  site_visits: {
    table: 'site_visits',
    columns: [
      { header: 'ID', key: 'id' },
      { header: 'Scheduled Start', key: 'scheduled_start' },
      { header: 'Scheduled End', key: 'scheduled_end' },
      { header: 'Status', key: 'status' },
      { header: 'Purpose', key: 'purpose' },
      { header: 'Notes', key: 'notes' },
      { header: 'Created At', key: 'created_at' },
    ],
  },
  measurements: {
    table: 'measurements',
    columns: [
      { header: 'ID', key: 'id' },
      { header: 'Project ID', key: 'project_id' },
      { header: 'Area / Item', key: 'area_or_item' },
      { header: 'Width (mm)', key: 'width_mm' },
      { header: 'Height (mm)', key: 'height_mm' },
      { header: 'Depth (mm)', key: 'depth_mm' },
      { header: 'Quantity', key: 'quantity' },
      { header: 'Unit', key: 'unit' },
      { header: 'Notes', key: 'notes' },
      { header: 'Created At', key: 'created_at' },
    ],
  },
  quotations: {
    table: 'quotes',
    columns: [
      { header: 'ID', key: 'id' },
      { header: 'Quote Number', key: 'quote_number' },
      { header: 'Status', key: 'status' },
      { header: 'Accepted At', key: 'accepted_at' },
      { header: 'Created At', key: 'created_at' },
    ],
  },
  orders: {
    table: 'orders',
    columns: [
      { header: 'ID', key: 'id' },
      { header: 'Order Number', key: 'order_number' },
      { header: 'Status', key: 'status' },
      { header: 'Order Date', key: 'order_date' },
      { header: 'Target Completion', key: 'target_completion_date' },
      { header: 'Total (₹ paise)', key: 'total_minor' },
      { header: 'Notes', key: 'notes' },
      { header: 'Created At', key: 'created_at' },
    ],
  },
  projects: {
    table: 'projects',
    columns: [
      { header: 'ID', key: 'id' },
      { header: 'Project Number', key: 'project_number' },
      { header: 'Name', key: 'name' },
      { header: 'Status', key: 'status' },
      { header: 'Start Date', key: 'start_date' },
      { header: 'Target Completion', key: 'target_completion_date' },
      { header: 'Actual Completion', key: 'actual_completion_date' },
      { header: 'Scope', key: 'scope' },
      { header: 'Created At', key: 'created_at' },
    ],
  },
  installations: {
    table: 'installations',
    columns: [
      { header: 'ID', key: 'id' },
      { header: 'Project ID', key: 'project_id' },
      { header: 'Scheduled Start', key: 'scheduled_start' },
      { header: 'Scheduled End', key: 'scheduled_end' },
      { header: 'Assigned Team', key: 'assigned_team' },
      { header: 'Status', key: 'status' },
      { header: 'Signed Off At', key: 'signed_off_at' },
      { header: 'Created At', key: 'created_at' },
    ],
  },
  invoices: {
    table: 'invoices',
    columns: [
      { header: 'ID', key: 'id' },
      { header: 'Invoice Number', key: 'invoice_number' },
      { header: 'Status', key: 'status' },
      { header: 'Issue Date', key: 'issue_date' },
      { header: 'Due Date', key: 'due_date' },
      { header: 'Total (₹ paise)', key: 'total_minor' },
      { header: 'Amount Paid (₹ paise)', key: 'amount_paid_minor' },
      { header: 'Balance (₹ paise)', key: 'balance_minor' },
      { header: 'Created At', key: 'created_at' },
    ],
  },
  payments: {
    table: 'payments',
    columns: [
      { header: 'ID', key: 'id' },
      { header: 'Payment Number', key: 'payment_number' },
      { header: 'Invoice ID', key: 'invoice_id' },
      { header: 'Amount (₹ paise)', key: 'amount_minor' },
      { header: 'Method', key: 'method' },
      { header: 'Status', key: 'status' },
      { header: 'Reference', key: 'reference' },
      { header: 'Payment Date', key: 'payment_date' },
      { header: 'Created At', key: 'created_at' },
    ],
  },
};

export function recordsToCsvByConfig(
  config: ExportConfig,
  records: Record<string, unknown>[]
): string {
  const headers = config.columns.map((c) => c.header);
  const data = records.map((rec) =>
    config.columns.reduce<Record<string, string>>((acc, col) => {
      acc[col.header] = sanitiseValue(rec[col.key]);
      return acc;
    }, {})
  );
  return Papa.unparse({ fields: headers, data });
}

export function rowsToCsv(headers: string[], rows: Record<string, unknown>[]): string {
  const data = rows.map((row) =>
    headers.reduce<Record<string, string>>((acc, h) => {
      acc[h] = sanitiseValue(row[h]);
      return acc;
    }, {})
  );
  return Papa.unparse({ fields: headers, data });
}

export function generateCsvBlob(config: ExportConfig, records: Record<string, unknown>[]): Blob {
  const csv = recordsToCsvByConfig(config, records);
  return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Defer revoke so Firefox can initiate the download before the URL is gone
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

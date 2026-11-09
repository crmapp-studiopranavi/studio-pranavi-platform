export type EntityType = 'leads' | 'customers' | 'orders' | 'projects' | 'tasks';

export interface FieldConfig {
  field: string;
  required: boolean;
  type: 'text' | 'email' | 'phone' | 'date' | 'budget_paise' | 'enum';
  enumValues?: readonly string[];
  label: string;
}

export interface HeaderResolution {
  source: string;
  target: string | null;
}

const LEAD_STATUS_VALUES = [
  'new',
  'contacted',
  'site_visit_scheduled',
  'site_visit_completed',
  'quote_drafting',
  'quote_sent',
  'negotiation',
  'won',
  'lost',
] as const;

const LEAD_PRIORITY_VALUES = ['low', 'medium', 'high'] as const;

const LEAD_SOURCE_VALUES = [
  'website',
  'referral',
  'instagram',
  'google',
  'exhibition',
  'walk_in',
  'other',
] as const;

export const ENTITY_FIELD_CONFIGS: Record<EntityType, FieldConfig[]> = {
  leads: [
    { field: 'full_name', required: true, type: 'text', label: 'Full Name' },
    { field: 'email', required: false, type: 'email', label: 'Email' },
    { field: 'phone', required: false, type: 'phone', label: 'Phone' },
    { field: 'whatsapp_number', required: false, type: 'phone', label: 'WhatsApp' },
    { field: 'project_description', required: false, type: 'text', label: 'Project Description' },
    {
      field: 'status',
      required: false,
      type: 'enum',
      label: 'Status',
      enumValues: LEAD_STATUS_VALUES,
    },
    {
      field: 'priority',
      required: false,
      type: 'enum',
      label: 'Priority',
      enumValues: LEAD_PRIORITY_VALUES,
    },
    {
      field: 'source',
      required: false,
      type: 'enum',
      label: 'Source',
      enumValues: LEAD_SOURCE_VALUES,
    },
    { field: 'budget_min_minor', required: false, type: 'budget_paise', label: 'Budget Min (₹)' },
    { field: 'budget_max_minor', required: false, type: 'budget_paise', label: 'Budget Max (₹)' },
    { field: 'next_follow_up_at', required: false, type: 'date', label: 'Next Follow-up Date' },
    { field: 'location_text', required: false, type: 'text', label: 'Location' },
  ],
  customers: [
    { field: 'display_name', required: true, type: 'text', label: 'Display Name' },
    { field: 'customer_type', required: false, type: 'text', label: 'Customer Type' },
    { field: 'gstin', required: false, type: 'text', label: 'GSTIN' },
    { field: 'notes', required: false, type: 'text', label: 'Notes' },
  ],
  orders: [
    { field: 'order_number', required: false, type: 'text', label: 'Order Number' },
    { field: 'customer_email', required: true, type: 'email', label: 'Customer Email (lookup)' },
    {
      field: 'status',
      required: false,
      type: 'enum',
      label: 'Status',
      enumValues: [
        'design_or_measurement',
        'production',
        'ready_for_installation',
        'completed',
        'cancelled',
      ] as const,
    },
    {
      field: 'target_completion_date',
      required: false,
      type: 'date',
      label: 'Target Completion Date',
    },
    { field: 'notes', required: false, type: 'text', label: 'Notes' },
  ],
  projects: [
    { field: 'name', required: true, type: 'text', label: 'Project Name' },
    { field: 'customer_email', required: true, type: 'email', label: 'Customer Email (lookup)' },
    { field: 'start_date', required: false, type: 'date', label: 'Start Date' },
    {
      field: 'target_completion_date',
      required: false,
      type: 'date',
      label: 'Target Completion Date',
    },
    { field: 'scope', required: false, type: 'text', label: 'Scope' },
  ],
  tasks: [
    { field: 'title', required: true, type: 'text', label: 'Title' },
    { field: 'due_date', required: false, type: 'date', label: 'Due Date' },
    {
      field: 'priority',
      required: false,
      type: 'enum',
      label: 'Priority',
      enumValues: ['low', 'medium', 'high'] as const,
    },
    {
      field: 'status',
      required: false,
      type: 'enum',
      label: 'Status',
      enumValues: ['pending', 'in_progress', 'done', 'cancelled'] as const,
    },
    { field: 'notes', required: false, type: 'text', label: 'Notes' },
  ],
};

const ALIAS_MAP: Record<EntityType, Record<string, string>> = {
  leads: {
    full_name: 'full_name',
    name: 'full_name',
    'customer name': 'full_name',
    'contact name': 'full_name',
    'lead name': 'full_name',
    email: 'email',
    'email id': 'email',
    'email address': 'email',
    phone: 'phone',
    'phone no': 'phone',
    'phone number': 'phone',
    telephone: 'phone',
    whatsapp: 'whatsapp_number',
    whatsapp_number: 'whatsapp_number',
    mobile: 'whatsapp_number',
    'mobile no': 'whatsapp_number',
    'mobile number': 'whatsapp_number',
    'whatsapp no': 'whatsapp_number',
    requirement: 'project_description',
    requirements: 'project_description',
    description: 'project_description',
    'project description': 'project_description',
    project_description: 'project_description',
    status: 'status',
    'lead status': 'status',
    priority: 'priority',
    source: 'source',
    'lead source': 'source',
    'budget min': 'budget_min_minor',
    budget_min_minor: 'budget_min_minor',
    'min budget': 'budget_min_minor',
    'budget min (₹)': 'budget_min_minor',
    'budget max': 'budget_max_minor',
    budget_max_minor: 'budget_max_minor',
    'max budget': 'budget_max_minor',
    'budget max (₹)': 'budget_max_minor',
    'next followup': 'next_follow_up_at',
    'next follow-up date': 'next_follow_up_at',
    next_follow_up_at: 'next_follow_up_at',
    'follow up date': 'next_follow_up_at',
    next_followup_at: 'next_follow_up_at',
    location: 'location_text',
    location_text: 'location_text',
    address: 'location_text',
  },
  customers: {
    display_name: 'display_name',
    name: 'display_name',
    'customer name': 'display_name',
    full_name: 'display_name',
    'customer type': 'customer_type',
    customer_type: 'customer_type',
    type: 'customer_type',
    gstin: 'gstin',
    gst: 'gstin',
    'gst number': 'gstin',
    notes: 'notes',
    remarks: 'notes',
  },
  orders: {
    order_number: 'order_number',
    'order number': 'order_number',
    'order no': 'order_number',
    'customer email': 'customer_email',
    customer_email: 'customer_email',
    status: 'status',
    'order status': 'status',
    'target date': 'target_completion_date',
    target_date: 'target_completion_date',
    'target completion': 'target_completion_date',
    target_completion_date: 'target_completion_date',
    notes: 'notes',
  },
  projects: {
    name: 'name',
    'project name': 'name',
    project: 'name',
    'customer email': 'customer_email',
    customer_email: 'customer_email',
    'start date': 'start_date',
    start_date: 'start_date',
    'end date': 'target_completion_date',
    end_date: 'target_completion_date',
    'completion date': 'target_completion_date',
    target_completion_date: 'target_completion_date',
    'target completion': 'target_completion_date',
    scope: 'scope',
    description: 'scope',
  },
  tasks: {
    title: 'title',
    task: 'title',
    'task name': 'title',
    'due date': 'due_date',
    due_date: 'due_date',
    priority: 'priority',
    status: 'status',
    'task status': 'status',
    notes: 'notes',
  },
};

export function resolveHeaders(entity: EntityType, headers: string[]): HeaderResolution[] {
  const aliases = ALIAS_MAP[entity];
  return headers.map((h) => {
    const key = h.trim().toLowerCase();
    const target = aliases[key] ?? null;
    return { source: h, target };
  });
}

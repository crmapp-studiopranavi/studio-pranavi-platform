export const LEAD_STATUSES = [
  'new',
  'contacted',
  'site_visit_scheduled',
  'site_visit_completed',
  'quote_drafting',
  'quote_sent',
  'negotiation',
  'won',
  'lost',
  'archived',
];

export const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  site_visit_scheduled: 'Site Visit Scheduled',
  site_visit_completed: 'Site Visit Done',
  quote_drafting: 'Quote Drafting',
  quote_sent: 'Quote Sent',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
  archived: 'Archived',
};

export const STATUS_LABEL = (s: string) => STATUS_LABELS[s] ?? s;

export const NEXT_STATUS: Record<string, string> = {
  new: 'contacted',
  contacted: 'site_visit_scheduled',
  site_visit_scheduled: 'site_visit_completed',
  site_visit_completed: 'quote_drafting',
  quote_drafting: 'quote_sent',
  quote_sent: 'negotiation',
  negotiation: 'won',
};

export const LEAD_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

export const PRIORITY_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export const PRIORITY_LABEL = (p: string) => PRIORITY_LABELS[p] ?? p;

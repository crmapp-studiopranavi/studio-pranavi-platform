export const NOTIFICATION_TYPES = [
  'new_enquiry_assigned',
  'followup_due',
  'quote_sent_followup',
  'quote_expiring',
  'order_confirmed',
  'installation_scheduled',
  'invoice_overdue',
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_LABELS: Record<NotificationType, string> = {
  new_enquiry_assigned: 'New Enquiry Assigned',
  followup_due: 'Follow-up Due',
  quote_sent_followup: 'Quote Follow-up',
  quote_expiring: 'Quote Expiring Soon',
  order_confirmed: 'Order Confirmed',
  installation_scheduled: 'Installation Scheduled',
  invoice_overdue: 'Invoice Overdue',
};

export const AUTOMATION_RULE_KEYS = [
  'new_enquiry',
  'followup_due',
  'quote_sent_followup',
  'quote_expiring',
  'order_confirmed',
  'installation_scheduled',
  'invoice_overdue',
] as const;

export type AutomationRuleKey = (typeof AUTOMATION_RULE_KEYS)[number];

export interface NewEnquiryConfig {
  assignment_strategy: 'round_robin' | 'fixed' | 'none';
  assignee_id?: string;
}

export interface FollowupDueConfig {
  notify_hours_before: number;
}

export interface QuoteSentConfig {
  delay_days: number;
}

export interface QuoteExpiringConfig {
  warn_days_before: number;
}

export interface OrderConfirmedConfig {
  milestone_templates: Array<{ name: string; offset_days: number }>;
}

export interface Notification {
  id: string;
  notification_type: NotificationType;
  title: string;
  body: string | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
  read_at: string | null;
  created_at: string;
}

import type { Tables, Enums } from './database.types';

// ─── Enum convenience types ────────────────────────────────────────────────

export type AppRole = Enums<'app_role'>;
export type LeadStatus = Enums<'lead_status'>;
export type LeadPriority = Enums<'lead_priority'>;
export type ContactMethod = Enums<'contact_method'>;
export type QuoteStatus = Enums<'quote_status'>;
export type OrderStatus = Enums<'order_status'>;
export type ProjectStatus = Enums<'project_status'>;
export type InvoiceStatus = Enums<'invoice_status'>;
export type PaymentMethod = Enums<'payment_method'>;
export type PaymentStatus = Enums<'payment_status'>;
export type ActivityType = Enums<'activity_type'>;
export type AttachmentVisibility = Enums<'attachment_visibility'>;
export type ContentStatus = Enums<'content_status'>;

// ─── Row convenience types ─────────────────────────────────────────────────

export type Profile = Tables<'profiles'>;
export type BusinessSettings = Tables<'business_settings'>;
export type Service = Tables<'services'>;
export type PortfolioProject = Tables<'portfolio_projects'>;
export type PortfolioImage = Tables<'portfolio_images'>;
export type Testimonial = Tables<'testimonials'>;
export type Lead = Tables<'leads'>;
export type Customer = Tables<'customers'>;
export type CustomerContact = Tables<'customer_contacts'>;
export type Address = Tables<'addresses'>;
export type Activity = Tables<'activities'>;
export type Task = Tables<'tasks'>;
export type SiteVisit = Tables<'site_visits'>;
export type Measurement = Tables<'measurements'>;
export type Quote = Tables<'quotes'>;
export type QuoteVersion = Tables<'quote_versions'>;
export type QuoteItem = Tables<'quote_items'>;
export type Order = Tables<'orders'>;
export type Project = Tables<'projects'>;
export type ProjectMilestone = Tables<'project_milestones'>;
export type Installation = Tables<'installations'>;
export type Invoice = Tables<'invoices'>;
export type InvoiceItem = Tables<'invoice_items'>;
export type Payment = Tables<'payments'>;
export type Attachment = Tables<'attachments'>;

// ─── Extended / joined types used in UI ───────────────────────────────────

export interface LeadWithOwner extends Lead {
  owner?: Pick<Profile, 'id' | 'full_name'> | null;
  service?: Pick<Service, 'id' | 'title'> | null;
}

export interface CustomerWithContacts extends Customer {
  contacts: CustomerContact[];
  addresses: Address[];
}

export interface QuoteWithVersion extends Quote {
  current_version?: QuoteVersion & { items: QuoteItem[] };
}

// ─── Minor-unit currency helpers ──────────────────────────────────────────

export function formatMinorCurrency(
  amountMinor: number,
  currency = 'INR',
  locale = 'en-IN'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amountMinor / 100);
}

export function minorToDecimal(amountMinor: number): number {
  return amountMinor / 100;
}

export function decimalToMinor(amount: number): number {
  return Math.round(amount * 100);
}

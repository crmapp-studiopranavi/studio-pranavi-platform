-- Migration: extensions, helper functions, and all application enums
-- Must be first — all subsequent migrations depend on these types.

create extension if not exists pgcrypto;
create extension if not exists citext;

-- ─── Shared trigger function ─────────────────────────────────────────────────

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── Application enums ────────────────────────────────────────────────────────

create type app_role as enum (
  'admin', 'manager', 'sales', 'operations', 'viewer'
);

create type lead_status as enum (
  'new', 'contacted', 'site_visit_scheduled', 'site_visit_completed',
  'quote_drafting', 'quote_sent', 'negotiation', 'won', 'lost', 'archived'
);

create type lead_priority as enum ('low', 'medium', 'high', 'urgent');

create type contact_method as enum (
  'phone', 'email', 'whatsapp', 'sms', 'in_person', 'other'
);

create type quote_status as enum (
  'draft', 'internal_review', 'sent', 'viewed', 'accepted',
  'rejected', 'expired', 'superseded', 'cancelled'
);

create type order_status as enum (
  'confirmed', 'design_or_measurement', 'production',
  'ready_for_installation', 'installation_scheduled',
  'installed', 'completed', 'cancelled', 'on_hold'
);

create type project_status as enum (
  'planned', 'active', 'blocked', 'on_hold', 'completed', 'cancelled'
);

create type invoice_status as enum (
  'draft', 'issued', 'partially_paid', 'paid', 'overdue', 'void'
);

create type payment_method as enum (
  'cash', 'bank_transfer', 'upi', 'card', 'cheque', 'other'
);

create type payment_status as enum (
  'pending', 'cleared', 'failed', 'reversed', 'refunded'
);

create type activity_type as enum (
  'note', 'call', 'email', 'whatsapp', 'meeting', 'site_visit',
  'status_change', 'quote_sent', 'payment', 'system'
);

create type attachment_visibility as enum (
  'private', 'customer_shareable', 'public'
);

create type content_status as enum ('draft', 'published', 'archived');

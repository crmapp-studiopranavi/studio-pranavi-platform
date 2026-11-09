-- Migration: attachments, notification outbox, and audit log

-- ─── Attachments ──────────────────────────────────────────────────────────────

create table attachments (
  id                uuid                  primary key default gen_random_uuid(),
  bucket            text                  not null,
  storage_path      text                  not null unique,
  original_filename text                  not null,
  content_type      text                  not null,
  size_bytes        bigint                not null check (size_bytes > 0),
  visibility        attachment_visibility not null default 'private',
  uploaded_by       uuid                  references profiles(id),
  lead_id           uuid                  references leads(id),
  customer_id       uuid                  references customers(id),
  quote_id          uuid                  references quotes(id),
  order_id          uuid                  references orders(id),
  project_id        uuid                  references projects(id),
  activity_id       uuid                  references activities(id),
  checksum          text,
  created_at        timestamptz           not null default now(),
  archived_at       timestamptz
);

create index attachments_lead_idx     on attachments (lead_id);
create index attachments_customer_idx on attachments (customer_id);
create index attachments_order_idx    on attachments (order_id);

-- ─── Notification outbox ──────────────────────────────────────────────────────

create table notification_outbox (
  id                  uuid  primary key default gen_random_uuid(),
  channel             text  not null,
  template_key        text  not null,
  recipient           text  not null,
  payload             jsonb not null default '{}',
  status              text  not null default 'pending'
                      check (status in ('pending', 'processing', 'sent', 'failed', 'cancelled')),
  attempt_count       integer not null default 0,
  next_attempt_at     timestamptz,
  last_error          text,
  deduplication_key   text  unique,
  created_at          timestamptz not null default now(),
  sent_at             timestamptz
);

create index notification_outbox_status_idx on notification_outbox (status, next_attempt_at)
  where status in ('pending', 'failed');

-- ─── Audit log ────────────────────────────────────────────────────────────────

create table audit_log (
  id           bigint generated always as identity primary key,
  actor_id     uuid,
  action       text        not null,
  entity_type  text        not null,
  entity_id    uuid,
  before_data  jsonb,
  after_data   jsonb,
  request_id   text,
  created_at   timestamptz not null default now()
);

create index audit_log_entity_idx  on audit_log (entity_type, entity_id);
create index audit_log_actor_idx   on audit_log (actor_id);
create index audit_log_created_idx on audit_log (created_at desc);

-- Trigger to audit profile role changes
create or replace function audit_profile_role_change()
returns trigger language plpgsql security definer
set search_path = ''
as $$
begin
  if old.role <> new.role or old.is_active <> new.is_active then
    insert into public.audit_log (actor_id, action, entity_type, entity_id, before_data, after_data)
    values (
      auth.uid(),
      'update',
      'profile',
      new.id,
      jsonb_build_object('role', old.role, 'is_active', old.is_active),
      jsonb_build_object('role', new.role, 'is_active', new.is_active)
    );
  end if;
  return new;
end;
$$;

create trigger profiles_audit_role
  after update on profiles
  for each row execute function audit_profile_role_change();

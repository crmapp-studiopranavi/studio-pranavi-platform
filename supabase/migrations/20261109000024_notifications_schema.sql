-- ── Extend notification_outbox ────────────────────────────────────────────────
-- Rename channel → event_type; add outbox pattern columns

do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notification_outbox'
      and column_name = 'channel'
  ) then
    alter table public.notification_outbox rename column channel to event_type;
  end if;
end $$;

alter table public.notification_outbox
  add column if not exists idempotency_key text,
  add column if not exists status          text not null default 'pending'
                             check (status in ('pending','processing','delivered','failed')),
  add column if not exists attempts        integer not null default 0,
  add column if not exists max_attempts    integer not null default 3,
  add column if not exists last_error      text,
  add column if not exists processed_at   timestamptz;

-- Backfill idempotency_key for any pre-existing rows
update public.notification_outbox
set idempotency_key = 'legacy:' || id::text
where idempotency_key is null;

alter table public.notification_outbox
  alter column idempotency_key set not null;

create unique index if not exists notification_outbox_idem_idx
  on public.notification_outbox (idempotency_key);

create index if not exists notification_outbox_status_idx
  on public.notification_outbox (status, created_at)
  where status = 'pending';

alter table public.notification_outbox enable row level security;

create policy "outbox_admin_select"
  on public.notification_outbox for select
  using ((select public.get_my_role()) in ('admin','manager'));

-- ── notifications ─────────────────────────────────────────────────────────────

create table public.notifications (
  id                   uuid        primary key default gen_random_uuid(),
  recipient_id         uuid        not null references public.profiles(id) on delete cascade,
  notification_type    text        not null,
  title                text        not null,
  body                 text,
  related_entity_type  text,
  related_entity_id    uuid,
  read_at              timestamptz,
  created_at           timestamptz not null default now()
);

create index if not exists notifications_recipient_unread_idx
  on public.notifications (recipient_id, created_at desc)
  where read_at is null;

alter table public.notifications enable row level security;

create policy "notifications_own"
  on public.notifications for select
  using (recipient_id = auth.uid() and (select public.is_active_staff()));

create policy "notifications_mark_read"
  on public.notifications for update
  using (recipient_id = auth.uid() and (select public.is_active_staff()))
  with check (recipient_id = auth.uid());

-- ── notification_preferences ──────────────────────────────────────────────────

create table public.notification_preferences (
  id                uuid    primary key default gen_random_uuid(),
  profile_id        uuid    not null references public.profiles(id) on delete cascade,
  notification_type text    not null,
  enabled           boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint notification_preferences_unique unique (profile_id, notification_type)
);

create trigger notification_preferences_updated_at
  before update on public.notification_preferences
  for each row execute function public.set_updated_at();

alter table public.notification_preferences enable row level security;

create policy "notification_prefs_own"
  on public.notification_preferences for all
  using (profile_id = auth.uid() and (select public.is_active_staff()))
  with check (profile_id = auth.uid());

-- ── automation_rules ──────────────────────────────────────────────────────────

create table public.automation_rules (
  id          uuid    primary key default gen_random_uuid(),
  rule_key    text    not null unique,
  label       text    not null,
  description text,
  enabled     boolean not null default true,
  config      jsonb   not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger automation_rules_updated_at
  before update on public.automation_rules
  for each row execute function public.set_updated_at();

alter table public.automation_rules enable row level security;

create policy "automation_rules_staff_select"
  on public.automation_rules for select
  using ((select public.is_active_staff()));

create policy "automation_rules_admin_write"
  on public.automation_rules for insert
  with check ((select public.get_my_role()) in ('admin'));

create policy "automation_rules_admin_update"
  on public.automation_rules for update
  using ((select public.get_my_role()) in ('admin'));

-- ── Seed default automation rules ─────────────────────────────────────────────

insert into public.automation_rules (rule_key, label, description, enabled, config) values
  ('new_enquiry',
   'New Website Enquiry',
   'Create lead, assign owner, and notify on new website form submission',
   true,
   '{"assignment_strategy":"round_robin"}'),
  ('followup_due',
   'Follow-up Due',
   'Notify assigned user when a follow-up is due within 1 hour',
   true,
   '{"notify_hours_before":1}'),
  ('quote_sent_followup',
   'Quote Sent — Follow-up Task',
   'Create a follow-up task N days after a quote is sent',
   true,
   '{"delay_days":3}'),
  ('quote_expiring',
   'Quote Expiring Soon',
   'Notify quote owner N days before the quote expires',
   true,
   '{"warn_days_before":3}'),
  ('order_confirmed',
   'Order Confirmed — Milestone Tasks',
   'Create project milestone tasks when an order is confirmed',
   true,
   '{"milestone_templates":[{"name":"Confirm measurements","offset_days":3},{"name":"Production kickoff","offset_days":7},{"name":"Pre-installation check","offset_days":21},{"name":"Customer handover","offset_days":30}]}'),
  ('installation_scheduled',
   'Installation Scheduled',
   'Notify operations team when an installation is scheduled',
   true,
   '{}'),
  ('invoice_overdue',
   'Invoice Overdue',
   'Notify finance and management when an invoice status becomes overdue',
   true,
   '{"grace_days":0}')
on conflict (rule_key) do nothing;

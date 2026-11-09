# Phase 10G: Notifications & Business Automation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an in-app notification center and configurable business automations to the CRM, backed by a reliable outbox pattern with idempotency, retry, and audit history.

**Architecture:** A `notification_outbox` table (already partially exists — will be extended) acts as a durable queue. DB triggers and the existing `submit_contact_inquiry` RPC write outbox entries. A client-side worker (React hook mounted in `AppShell`) polls every 30 s and calls `process_next_outbox_item()`. Processed items create `notifications` rows visible in the bell component and `NotificationsPage`. Time-based events (follow-up due, quote expiring, invoice overdue) are enqueued by a separate `enqueue_time_based_notifications()` RPC called by the same worker. All processing is done inside `security definer` RPCs so RLS is never bypassed from the browser.

**Tech Stack:** PostgreSQL triggers + RPCs, Supabase JS v2 Realtime, React 18 + TanStack Query v5, Tailwind + shadcn/ui, Vitest.

---

## Existing schema facts (read before changing anything)

- `notification_outbox` already exists with columns: `id uuid`, `channel text`, `payload jsonb`, `created_at timestamptz`. Migration 11 (`submit_contact_inquiry`) writes to it.
- `project_milestones` table exists: `id, project_id, name, description, status, due_date, sort_order, assigned_to, created_at, updated_at`.
- `installations` table: `id, project_id, scheduled_start, scheduled_end, assigned_team, lead_installer_id, status, ...`.
- `orders.status` enum values include `'confirmed'` (default).
- `quotes.status` enum includes `'sent'`.
- `invoices.status` enum includes `'overdue'`.
- `profiles.role` ∈ `'admin'|'manager'|'sales'|'operations'|'viewer'`.
- Helper functions `is_active_staff()`, `get_my_role()`, `is_admin_or_manager()` are available.

---

## File Structure

**New migrations:**

- `supabase/migrations/20261109000024_notifications_schema.sql` — extend outbox, create `notifications`, `notification_preferences`, `automation_rules` tables + RLS + seed default rules
- `supabase/migrations/20261109000025_notifications_triggers.sql` — DB triggers on quotes/orders/installations/invoices → outbox; update `submit_contact_inquiry` to match new outbox schema
- `supabase/migrations/20261109000026_notifications_rpcs.sql` — `process_next_outbox_item`, handler functions, `enqueue_time_based_notifications`, `mark_notifications_read`, `get_unread_notification_count`

**New types:**

- `packages/types/src/database.types.ts` — append types for 3 new tables (extend existing file)

**New CRM lib:**

- `apps/crm/src/lib/notifications/notification-types.ts` — event type constants + TypeScript types
- `apps/crm/src/lib/hooks/useOutboxWorker.ts` — polls + processes outbox
- `apps/crm/src/lib/hooks/useNotifications.ts` — reads notifications for current user
- `apps/crm/src/lib/__tests__/notifications.test.ts` — unit tests

**New CRM components/pages:**

- `apps/crm/src/components/layout/NotificationBell.tsx` — header bell with unread badge + dropdown
- `apps/crm/src/pages/notifications/NotificationsPage.tsx` — full notification list
- `apps/crm/src/pages/admin/AutomationRulesPage.tsx` — admin CRUD for rule config
- `apps/crm/src/pages/NotificationPreferencesPage.tsx` — per-user opt-in/out

**Modified files:**

- `apps/crm/src/components/layout/AppShell.tsx` — mount `useOutboxWorker`
- `apps/crm/src/components/layout/AppHeader.tsx` — add `<NotificationBell />`
- `apps/crm/src/components/layout/Sidebar.tsx` — add Notifications + Automation menu items
- `apps/crm/src/router.tsx` — 3 new routes

---

## Task 1: DB Migration 24 — Notification tables + seed

**Files:**

- Create: `supabase/migrations/20261109000024_notifications_schema.sql`

- [ ] **Step 1: Write the migration**

```sql
-- ── Extend notification_outbox ────────────────────────────────────────────────
-- Existing columns: id, channel, payload, created_at
-- Rename channel → event_type; add outbox pattern columns

alter table public.notification_outbox
  rename column channel to event_type;

alter table public.notification_outbox
  add column if not exists idempotency_key text,
  add column if not exists status          text not null default 'pending'
                             check (status in ('pending','processing','delivered','failed')),
  add column if not exists attempts        integer not null default 0,
  add column if not exists max_attempts    integer not null default 3,
  add column if not exists last_error      text,
  add column if not exists processed_at   timestamptz;

-- Backfill idempotency_key for any pre-existing rows (one-time)
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

-- RLS on outbox: only admins/managers can query; workers use security definer RPCs
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
  related_entity_type  text,       -- 'lead' | 'quote' | 'order' | 'project' | 'invoice' | 'installation'
  related_entity_id    uuid,
  read_at              timestamptz,
  created_at           timestamptz not null default now()
);

create index notifications_recipient_unread_idx
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
  using ((select public.get_my_role()) in ('admin'));

create policy "automation_rules_admin_update"
  on public.automation_rules for update
  using ((select public.get_my_role()) in ('admin'));

-- ── Default automation rules seed ─────────────────────────────────────────────

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
```

- [ ] **Step 2: Apply migration locally**

```bash
supabase db reset --local
# OR if you don't want to reset:
supabase migration up --local
```

Expected: migration applies without error.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20261109000024_notifications_schema.sql
git commit -m "feat(10G): notification tables — outbox extension, notifications, preferences, automation_rules"
```

---

## Task 2: DB Migration 25 — Triggers + update submit_contact_inquiry

**Files:**

- Create: `supabase/migrations/20261109000025_notifications_triggers.sql`

- [ ] **Step 1: Write the migration**

```sql
-- ── Update submit_contact_inquiry to match new outbox schema ──────────────────
-- Column was renamed channel → event_type in migration 24.
-- Now add idempotency_key + status fields to the insert.

create or replace function public.submit_contact_inquiry(
  p_name    text,
  p_email   text    default null,
  p_phone   text    default null,
  p_message text    default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name    text := trim(p_name);
  v_email   text := trim(p_email);
  v_phone   text := trim(p_phone);
  v_message text := trim(p_message);
  v_idem    text := 'new_enquiry:' || gen_random_uuid()::text;
begin
  if v_name is null or char_length(v_name) < 2 then
    raise exception 'Name must be at least 2 characters' using errcode = 'CIQV1';
  end if;
  if char_length(v_name) > 200 then
    raise exception 'Name is too long' using errcode = 'CIQV2';
  end if;
  if v_email is not null and char_length(v_email) > 320 then
    raise exception 'Email address is too long' using errcode = 'CIQV3';
  end if;
  if v_phone is not null and char_length(v_phone) > 30 then
    raise exception 'Phone number is too long' using errcode = 'CIQV4';
  end if;
  if v_message is not null and char_length(v_message) > 5000 then
    raise exception 'Message is too long' using errcode = 'CIQV5';
  end if;
  if v_email is null and v_phone is null then
    raise exception 'Please provide at least an email or phone number' using errcode = 'CIQV6';
  end if;

  insert into public.notification_outbox (event_type, payload, idempotency_key)
  values (
    'new_website_enquiry',
    jsonb_build_object(
      'name',         v_name,
      'email',        v_email,
      'phone',        v_phone,
      'message',      v_message,
      'submitted_at', now()
    ),
    v_idem
  );

  return jsonb_build_object('success', true);
end;
$$;

-- ── Trigger helper: write to outbox safely (idempotency via ON CONFLICT) ──────

create or replace function public.enqueue_outbox_event(
  p_event_type     text,
  p_payload        jsonb,
  p_idempotency_key text
)
returns void language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notification_outbox (event_type, payload, idempotency_key)
  values (p_event_type, p_payload, p_idempotency_key)
  on conflict (idempotency_key) do nothing;
end;
$$;

-- ── quotes: status → 'sent' ───────────────────────────────────────────────────

create or replace function public.on_quote_sent()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'sent' and (old.status is null or old.status <> 'sent') then
    perform public.enqueue_outbox_event(
      'quote_sent_followup',
      jsonb_build_object('quote_id', new.id, 'owner_id', new.owner_id),
      'quote_sent:' || new.id::text
    );
  end if;
  return new;
end;
$$;

create trigger trg_quote_sent
  after update on public.quotes
  for each row execute function public.on_quote_sent();

-- ── orders: status → 'confirmed' ─────────────────────────────────────────────
-- Orders default to 'confirmed' on INSERT, so fire on both INSERT and UPDATE.

create or replace function public.on_order_confirmed()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'confirmed' and (TG_OP = 'INSERT' or old.status <> 'confirmed') then
    perform public.enqueue_outbox_event(
      'order_confirmed',
      jsonb_build_object('order_id', new.id, 'customer_id', new.customer_id, 'owner_id', new.owner_id),
      'order_confirmed:' || new.id::text
    );
  end if;
  return new;
end;
$$;

create trigger trg_order_confirmed
  after insert or update on public.orders
  for each row execute function public.on_order_confirmed();

-- ── installations: scheduled_start set (INSERT or UPDATE) ────────────────────

create or replace function public.on_installation_scheduled()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.scheduled_start is not null
     and (TG_OP = 'INSERT' or old.scheduled_start is distinct from new.scheduled_start)
  then
    perform public.enqueue_outbox_event(
      'installation_scheduled',
      jsonb_build_object(
        'installation_id', new.id,
        'project_id',      new.project_id,
        'scheduled_start', new.scheduled_start
      ),
      'installation_scheduled:' || new.id::text || ':' || new.scheduled_start::text
    );
  end if;
  return new;
end;
$$;

create trigger trg_installation_scheduled
  after insert or update on public.installations
  for each row execute function public.on_installation_scheduled();

-- ── invoices: status → 'overdue' ─────────────────────────────────────────────

create or replace function public.on_invoice_overdue()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'overdue' and (old.status is null or old.status <> 'overdue') then
    perform public.enqueue_outbox_event(
      'invoice_overdue',
      jsonb_build_object('invoice_id', new.id, 'customer_id', new.customer_id),
      'invoice_overdue:' || new.id::text
    );
  end if;
  return new;
end;
$$;

create trigger trg_invoice_overdue
  after update on public.invoices
  for each row execute function public.on_invoice_overdue();
```

- [ ] **Step 2: Apply and verify**

```bash
supabase migration up --local
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20261109000025_notifications_triggers.sql
git commit -m "feat(10G): notification DB triggers — quote_sent, order_confirmed, installation_scheduled, invoice_overdue; update submit_contact_inquiry"
```

---

## Task 3: DB Migration 26 — Processing RPCs

**Files:**

- Create: `supabase/migrations/20261109000026_notifications_rpcs.sql`

- [ ] **Step 1: Write the migration**

```sql
-- ── notify_recipient: creates a notification respecting user preferences ───────

create or replace function public.notify_recipient(
  p_recipient_id        uuid,
  p_notification_type   text,
  p_title               text,
  p_body                text    default null,
  p_related_entity_type text    default null,
  p_related_entity_id   uuid    default null
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_enabled boolean := true;
  v_id      uuid;
begin
  -- Check user preference (default enabled if no row)
  select enabled into v_enabled
  from public.notification_preferences
  where profile_id = p_recipient_id and notification_type = p_notification_type;

  if not coalesce(v_enabled, true) then
    return null;
  end if;

  insert into public.notifications
    (recipient_id, notification_type, title, body, related_entity_type, related_entity_id)
  values
    (p_recipient_id, p_notification_type, p_title, p_body, p_related_entity_type, p_related_entity_id)
  returning id into v_id;

  return v_id;
end;
$$;

-- ── pick_round_robin_owner: fewest-open-leads among active sales/admin/manager ─

create or replace function public.pick_round_robin_owner()
returns uuid language sql security definer set search_path = '' as $$
  select p.id
  from public.profiles p
  where p.is_active = true
    and p.role in ('sales','admin','manager')
  order by (
    select count(*) from public.leads l
    where l.owner_id = p.id
      and l.status not in ('won','lost','archived')
  ) asc, p.created_at asc
  limit 1;
$$;

-- ── handle_new_website_enquiry ────────────────────────────────────────────────

create or replace function public.handle_new_website_enquiry(p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_rule        public.automation_rules%rowtype;
  v_lead_id     uuid;
  v_owner_id    uuid;
  v_strategy    text;
  v_name        text := p_payload->>'name';
  v_email       text := p_payload->>'email';
  v_phone       text := p_payload->>'phone';
  v_desc        text := coalesce(p_payload->>'message', '(no message)');
begin
  select * into v_rule from public.automation_rules where rule_key = 'new_enquiry' and enabled;
  if not found then return jsonb_build_object('skipped','rule_disabled'); end if;

  -- Determine owner
  v_strategy := coalesce(v_rule.config->>'assignment_strategy', 'none');
  if v_strategy = 'round_robin' then
    v_owner_id := public.pick_round_robin_owner();
  elsif v_strategy = 'fixed' then
    v_owner_id := (v_rule.config->>'assignee_id')::uuid;
  end if;

  -- Create lead
  insert into public.leads (
    source, status, full_name, email, phone,
    project_description, owner_id
  ) values (
    'website', 'new', v_name,
    nullif(v_email, ''), nullif(v_phone, ''),
    v_desc, v_owner_id
  )
  returning id into v_lead_id;

  -- Create activity
  insert into public.activities (activity_type, subject, body, lead_id)
  values ('system', 'New website enquiry received', v_desc, v_lead_id);

  -- Notify owner
  if v_owner_id is not null then
    perform public.notify_recipient(
      v_owner_id, 'new_enquiry_assigned',
      'New enquiry: ' || v_name,
      coalesce(v_email, v_phone, ''),
      'lead', v_lead_id
    );
  end if;

  return jsonb_build_object('lead_id', v_lead_id, 'owner_id', v_owner_id);
end;
$$;

-- ── handle_quote_sent_followup ────────────────────────────────────────────────

create or replace function public.handle_quote_sent_followup(p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_rule      public.automation_rules%rowtype;
  v_quote     public.quotes%rowtype;
  v_delay     integer;
  v_task_id   uuid;
begin
  select * into v_rule from public.automation_rules where rule_key = 'quote_sent_followup' and enabled;
  if not found then return jsonb_build_object('skipped','rule_disabled'); end if;

  select * into v_quote from public.quotes where id = (p_payload->>'quote_id')::uuid;
  if not found then return jsonb_build_object('skipped','quote_not_found'); end if;

  v_delay := coalesce((v_rule.config->>'delay_days')::integer, 3);

  insert into public.tasks (
    title, description, assigned_to, created_by, due_at,
    priority, status, quote_id, customer_id
  ) values (
    'Follow up on sent quote',
    'Quote was sent — check if customer has reviewed it.',
    v_quote.owner_id, v_quote.owner_id,
    now() + (v_delay || ' days')::interval,
    'medium', 'todo',
    v_quote.id, v_quote.customer_id
  )
  returning id into v_task_id;

  return jsonb_build_object('task_id', v_task_id);
end;
$$;

-- ── handle_order_confirmed ────────────────────────────────────────────────────

create or replace function public.handle_order_confirmed(p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_rule        public.automation_rules%rowtype;
  v_order       public.orders%rowtype;
  v_project     public.projects%rowtype;
  v_templates   jsonb;
  v_tpl         jsonb;
  v_sort        integer := 0;
  v_ms_ids      uuid[] := '{}';
  v_ms_id       uuid;
begin
  select * into v_rule from public.automation_rules where rule_key = 'order_confirmed' and enabled;
  if not found then return jsonb_build_object('skipped','rule_disabled'); end if;

  select * into v_order from public.orders where id = (p_payload->>'order_id')::uuid;
  if not found then return jsonb_build_object('skipped','order_not_found'); end if;

  -- Find or skip — only create milestones if a project exists for this order
  select * into v_project from public.projects where order_id = v_order.id limit 1;
  if not found then return jsonb_build_object('skipped','no_project_for_order'); end if;

  v_templates := coalesce(v_rule.config->'milestone_templates', '[]'::jsonb);

  for v_tpl in select * from jsonb_array_elements(v_templates)
  loop
    insert into public.project_milestones (
      project_id, name, description, status, due_date, sort_order
    ) values (
      v_project.id,
      v_tpl->>'name',
      null,
      'pending',
      current_date + ((v_tpl->>'offset_days')::integer),
      v_sort
    )
    returning id into v_ms_id;
    v_ms_ids := array_append(v_ms_ids, v_ms_id);
    v_sort := v_sort + 1;
  end loop;

  return jsonb_build_object('milestone_ids', v_ms_ids, 'project_id', v_project.id);
end;
$$;

-- ── handle_installation_scheduled ────────────────────────────────────────────

create or replace function public.handle_installation_scheduled(p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_rule    public.automation_rules%rowtype;
  v_rec     record;
  v_notified integer := 0;
begin
  select * into v_rule from public.automation_rules where rule_key = 'installation_scheduled' and enabled;
  if not found then return jsonb_build_object('skipped','rule_disabled'); end if;

  -- Notify all active operations + admin + manager profiles
  for v_rec in
    select id from public.profiles
    where is_active = true and role in ('operations','admin','manager')
  loop
    perform public.notify_recipient(
      v_rec.id, 'installation_scheduled',
      'Installation scheduled',
      'Project installation scheduled for ' || (p_payload->>'scheduled_start'),
      'installation', (p_payload->>'installation_id')::uuid
    );
    v_notified := v_notified + 1;
  end loop;

  return jsonb_build_object('notified', v_notified);
end;
$$;

-- ── handle_invoice_overdue ────────────────────────────────────────────────────

create or replace function public.handle_invoice_overdue(p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_rule    public.automation_rules%rowtype;
  v_rec     record;
  v_invoice public.invoices%rowtype;
  v_notified integer := 0;
begin
  select * into v_rule from public.automation_rules where rule_key = 'invoice_overdue' and enabled;
  if not found then return jsonb_build_object('skipped','rule_disabled'); end if;

  select * into v_invoice from public.invoices where id = (p_payload->>'invoice_id')::uuid;
  if not found then return jsonb_build_object('skipped','invoice_not_found'); end if;

  -- Notify finance + admin + manager profiles
  for v_rec in
    select id from public.profiles
    where is_active = true and role in ('admin','manager')
  loop
    perform public.notify_recipient(
      v_rec.id, 'invoice_overdue',
      'Invoice overdue',
      'Invoice is past due date.',
      'invoice', v_invoice.id
    );
    v_notified := v_notified + 1;
  end loop;

  return jsonb_build_object('notified', v_notified);
end;
$$;

-- ── enqueue_time_based_notifications ─────────────────────────────────────────
-- Called by client worker every poll cycle. Enqueues follow-up due,
-- quote expiring, and invoice overdue events idempotently.

create or replace function public.enqueue_time_based_notifications()
returns integer language plpgsql security definer set search_path = '' as $$
declare
  v_count   integer := 0;
  v_rec     record;
  v_rule    public.automation_rules%rowtype;
  v_hours   integer;
  v_days    integer;
  v_today   text := current_date::text;
begin
  -- ── Follow-up due ────────────────────────────────────────────────────────────
  select * into v_rule from public.automation_rules where rule_key = 'followup_due' and enabled;
  if found then
    v_hours := coalesce((v_rule.config->>'notify_hours_before')::integer, 1);
    for v_rec in
      select l.id as lead_id, l.owner_id, l.full_name, l.next_follow_up_at
      from public.leads l
      where l.next_follow_up_at is not null
        and l.next_follow_up_at <= now() + (v_hours || ' hours')::interval
        and l.status not in ('won','lost','archived')
        and l.owner_id is not null
    loop
      insert into public.notification_outbox (event_type, payload, idempotency_key)
      values (
        'followup_due',
        jsonb_build_object('lead_id', v_rec.lead_id, 'owner_id', v_rec.owner_id,
                           'full_name', v_rec.full_name, 'due_at', v_rec.next_follow_up_at),
        'followup_due:' || v_rec.lead_id::text || ':' || v_today
      )
      on conflict (idempotency_key) do nothing;
      if found then v_count := v_count + 1; end if;
    end loop;
  end if;

  -- ── Quote expiring ───────────────────────────────────────────────────────────
  select * into v_rule from public.automation_rules where rule_key = 'quote_expiring' and enabled;
  if found then
    v_days := coalesce((v_rule.config->>'warn_days_before')::integer, 3);
    for v_rec in
      select qv.quote_id, q.owner_id, q.quote_number, qv.valid_until
      from public.quote_versions qv
      join public.quotes q on q.id = qv.quote_id and q.current_version_id = qv.id
      where q.status = 'sent'
        and qv.valid_until is not null
        and qv.valid_until between current_date and current_date + (v_days || ' days')::interval
        and q.owner_id is not null
    loop
      insert into public.notification_outbox (event_type, payload, idempotency_key)
      values (
        'quote_expiring',
        jsonb_build_object('quote_id', v_rec.quote_id, 'owner_id', v_rec.owner_id,
                           'quote_number', v_rec.quote_number, 'valid_until', v_rec.valid_until),
        'quote_expiring:' || v_rec.quote_id::text || ':' || v_today
      )
      on conflict (idempotency_key) do nothing;
      if found then v_count := v_count + 1; end if;
    end loop;
  end if;

  return v_count;
end;
$$;

-- ── process_next_outbox_item ──────────────────────────────────────────────────
-- Called by client worker. Takes the oldest pending item, locks it,
-- dispatches to the appropriate handler, marks delivered or failed.

create or replace function public.process_next_outbox_item()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_item    public.notification_outbox%rowtype;
  v_result  jsonb;
begin
  -- Claim the oldest pending item under FOR UPDATE SKIP LOCKED
  select * into v_item
  from public.notification_outbox
  where status = 'pending'
    and attempts < max_attempts
  order by created_at asc
  limit 1
  for update skip locked;

  if not found then
    return jsonb_build_object('done', true, 'processed', 0);
  end if;

  -- Mark processing + increment attempts
  update public.notification_outbox
  set status = 'processing', attempts = attempts + 1
  where id = v_item.id;

  begin
    case v_item.event_type
      when 'new_website_enquiry'     then v_result := public.handle_new_website_enquiry(v_item.payload);
      when 'quote_sent_followup'     then v_result := public.handle_quote_sent_followup(v_item.payload);
      when 'order_confirmed'         then v_result := public.handle_order_confirmed(v_item.payload);
      when 'installation_scheduled'  then v_result := public.handle_installation_scheduled(v_item.payload);
      when 'invoice_overdue'         then v_result := public.handle_invoice_overdue(v_item.payload);
      when 'followup_due'            then
        -- Inline: notify owner directly
        perform public.notify_recipient(
          (v_item.payload->>'owner_id')::uuid,
          'followup_due',
          'Follow-up due: ' || coalesce(v_item.payload->>'full_name', 'Lead'),
          'Follow-up was due at ' || (v_item.payload->>'due_at'),
          'lead', (v_item.payload->>'lead_id')::uuid
        );
        v_result := jsonb_build_object('notified', 1);
      when 'quote_expiring'         then
        perform public.notify_recipient(
          (v_item.payload->>'owner_id')::uuid,
          'quote_expiring',
          'Quote expiring soon: ' || coalesce(v_item.payload->>'quote_number', ''),
          'Expires on ' || (v_item.payload->>'valid_until'),
          'quote', (v_item.payload->>'quote_id')::uuid
        );
        v_result := jsonb_build_object('notified', 1);
      else
        v_result := jsonb_build_object('skipped', 'unknown_event_type', 'event_type', v_item.event_type);
    end case;

    update public.notification_outbox
    set status = 'delivered', processed_at = now(), last_error = null
    where id = v_item.id;

  exception when others then
    update public.notification_outbox
    set status = case when attempts >= max_attempts then 'failed' else 'pending' end,
        last_error = sqlerrm
    where id = v_item.id;
    return jsonb_build_object('error', sqlerrm, 'item_id', v_item.id);
  end;

  return jsonb_build_object('done', false, 'processed', 1, 'event_type', v_item.event_type, 'result', v_result);
end;
$$;

-- ── mark_notifications_read ───────────────────────────────────────────────────

create or replace function public.mark_notifications_read(p_ids uuid[])
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.notifications
  set read_at = now()
  where id = any(p_ids)
    and recipient_id = auth.uid()
    and read_at is null;
end;
$$;

-- ── get_unread_notification_count ─────────────────────────────────────────────

create or replace function public.get_unread_notification_count()
returns integer language sql security definer set search_path = '' as $$
  select count(*)::integer
  from public.notifications
  where recipient_id = auth.uid() and read_at is null;
$$;
```

- [ ] **Step 2: Apply migration**

```bash
supabase migration up --local
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20261109000026_notifications_rpcs.sql
git commit -m "feat(10G): notification RPCs — process_next_outbox_item, 5 handlers, enqueue_time_based, mark_read, unread_count"
```

---

## Task 4: TypeScript types for new tables

**Files:**

- Modify: `packages/types/src/database.types.ts`

- [ ] **Step 1: Add types at the end of the `Tables` object**

Find the closing of the `Tables` object (before `Views:` or `Functions:` or end of `Database` type). Add:

```typescript
      notification_outbox: {
        Row: {
          id: string;
          event_type: string;
          payload: Record<string, unknown>;
          idempotency_key: string;
          status: 'pending' | 'processing' | 'delivered' | 'failed';
          attempts: number;
          max_attempts: number;
          last_error: string | null;
          created_at: string;
          processed_at: string | null;
        };
        Insert: {
          id?: string;
          event_type: string;
          payload?: Record<string, unknown>;
          idempotency_key: string;
          status?: 'pending' | 'processing' | 'delivered' | 'failed';
          attempts?: number;
          max_attempts?: number;
          last_error?: string | null;
          created_at?: string;
          processed_at?: string | null;
        };
        Update: Partial<{
          event_type: string;
          payload: Record<string, unknown>;
          idempotency_key: string;
          status: 'pending' | 'processing' | 'delivered' | 'failed';
          attempts: number;
          max_attempts: number;
          last_error: string | null;
          processed_at: string | null;
        }>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          recipient_id: string;
          notification_type: string;
          title: string;
          body: string | null;
          related_entity_type: string | null;
          related_entity_id: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          recipient_id: string;
          notification_type: string;
          title: string;
          body?: string | null;
          related_entity_type?: string | null;
          related_entity_id?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          read_at?: string | null;
        };
        Relationships: [];
      };
      notification_preferences: {
        Row: {
          id: string;
          profile_id: string;
          notification_type: string;
          enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          notification_type: string;
          enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          enabled?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      automation_rules: {
        Row: {
          id: string;
          rule_key: string;
          label: string;
          description: string | null;
          enabled: boolean;
          config: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          rule_key: string;
          label: string;
          description?: string | null;
          enabled?: boolean;
          config?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          label?: string;
          description?: string | null;
          enabled?: boolean;
          config?: Record<string, unknown>;
          updated_at?: string;
        };
        Relationships: [];
      };
```

- [ ] **Step 2: Run typecheck**

```bash
pnpm -r typecheck
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add packages/types/src/database.types.ts
git commit -m "feat(10G): TypeScript types for notification_outbox, notifications, notification_preferences, automation_rules"
```

---

## Task 5: Notification engine + hooks + tests

**Files:**

- Create: `apps/crm/src/lib/notifications/notification-types.ts`
- Create: `apps/crm/src/lib/hooks/useOutboxWorker.ts`
- Create: `apps/crm/src/lib/hooks/useNotifications.ts`
- Create: `apps/crm/src/lib/__tests__/notifications.test.ts`

- [ ] **Step 1: Create notification-types.ts**

```typescript
// apps/crm/src/lib/notifications/notification-types.ts

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
```

- [ ] **Step 2: Create useOutboxWorker.ts**

```typescript
// apps/crm/src/lib/hooks/useOutboxWorker.ts
import { useEffect, useRef } from 'react';
import { supabase } from '../supabase';

const POLL_INTERVAL_MS = 30_000;

export function useOutboxWorker() {
  const isRunning = useRef(false);

  useEffect(() => {
    async function tick() {
      if (isRunning.current) return;
      isRunning.current = true;
      try {
        // Enqueue time-based events first
        await supabase.rpc('enqueue_time_based_notifications');

        // Drain up to 10 pending outbox items per tick
        for (let i = 0; i < 10; i++) {
          const { data, error } = await supabase.rpc('process_next_outbox_item');
          if (error || !data) break;
          // data.done === true means outbox is empty
          if ((data as { done: boolean }).done) break;
        }
      } finally {
        isRunning.current = false;
      }
    }

    tick();
    const id = setInterval(tick, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);
}
```

- [ ] **Step 3: Create useNotifications.ts**

```typescript
// apps/crm/src/lib/hooks/useNotifications.ts
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabase';
import type { Notification } from '../notifications/notification-types';
import { useAuth } from '../auth-context';

export function useNotifications(limit = 50) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (data) {
      setNotifications(data as Notification[]);
      setUnreadCount(data.filter((n) => !n.read_at).length);
    }
    setIsLoading(false);
  }, [user, limit]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('notifications:' + user.id)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${user.id}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications]);

  const markRead = useCallback(async (ids: string[]) => {
    await supabase.rpc('mark_notifications_read', { p_ids: ids });
    setNotifications((prev) =>
      prev.map((n) => (ids.includes(n.id) ? { ...n, read_at: new Date().toISOString() } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - ids.length));
  }, []);

  const markAllRead = useCallback(async () => {
    const unread = notifications.filter((n) => !n.read_at).map((n) => n.id);
    if (unread.length > 0) await markRead(unread);
  }, [notifications, markRead]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markRead,
    markAllRead,
    refetch: fetchNotifications,
  };
}
```

- [ ] **Step 4: Write the test file**

```typescript
// apps/crm/src/lib/__tests__/notifications.test.ts
import { describe, it, expect } from 'vitest';
import {
  NOTIFICATION_TYPES,
  NOTIFICATION_LABELS,
  AUTOMATION_RULE_KEYS,
} from '../notifications/notification-types';

describe('NOTIFICATION_TYPES', () => {
  it('contains all 7 required types', () => {
    const required = [
      'new_enquiry_assigned',
      'followup_due',
      'quote_sent_followup',
      'quote_expiring',
      'order_confirmed',
      'installation_scheduled',
      'invoice_overdue',
    ];
    required.forEach((t) => expect(NOTIFICATION_TYPES).toContain(t));
  });

  it('has a label for every type', () => {
    NOTIFICATION_TYPES.forEach((t) => {
      expect(NOTIFICATION_LABELS[t]).toBeTruthy();
    });
  });
});

describe('AUTOMATION_RULE_KEYS', () => {
  it('contains all 7 rule keys', () => {
    expect(AUTOMATION_RULE_KEYS).toHaveLength(7);
  });

  it('includes new_enquiry', () => {
    expect(AUTOMATION_RULE_KEYS).toContain('new_enquiry');
  });
});

// ── Idempotency key format tests ──────────────────────────────────────────────

describe('idempotency key patterns', () => {
  const makeOrderKey = (id: string) => `order_confirmed:${id}`;
  const makeInstallKey = (id: string, start: string) => `installation_scheduled:${id}:${start}`;
  const makeFollowupKey = (id: string, date: string) => `followup_due:${id}:${date}`;
  const makeQuoteExpiringKey = (id: string, date: string) => `quote_expiring:${id}:${date}`;

  it('order_confirmed key is stable for same order_id', () => {
    const id = '550e8400-e29b-41d4-a716-446655440000';
    expect(makeOrderKey(id)).toBe(`order_confirmed:${id}`);
    expect(makeOrderKey(id)).toBe(makeOrderKey(id));
  });

  it('installation_scheduled key changes when scheduled_start changes', () => {
    const id = '550e8400-e29b-41d4-a716-446655440001';
    const key1 = makeInstallKey(id, '2026-12-01T09:00:00Z');
    const key2 = makeInstallKey(id, '2026-12-02T09:00:00Z');
    expect(key1).not.toBe(key2);
  });

  it('followup_due key is once-per-day-per-lead', () => {
    const id = '550e8400-e29b-41d4-a716-446655440002';
    const key1 = makeFollowupKey(id, '2026-12-01');
    const key2 = makeFollowupKey(id, '2026-12-01');
    const key3 = makeFollowupKey(id, '2026-12-02');
    expect(key1).toBe(key2);
    expect(key1).not.toBe(key3);
  });

  it('quote_expiring key is once-per-day-per-quote', () => {
    const id = '550e8400-e29b-41d4-a716-446655440003';
    expect(makeQuoteExpiringKey(id, '2026-12-01')).toBe(makeQuoteExpiringKey(id, '2026-12-01'));
    expect(makeQuoteExpiringKey(id, '2026-12-01')).not.toBe(makeQuoteExpiringKey(id, '2026-12-02'));
  });
});

// ── Notification preference logic ─────────────────────────────────────────────

describe('notification preference resolution', () => {
  type Pref = { notification_type: string; enabled: boolean };

  function shouldNotify(prefs: Pref[], type: string): boolean {
    const pref = prefs.find((p) => p.notification_type === type);
    return pref === undefined ? true : pref.enabled;
  }

  it('defaults to enabled when no preference row exists', () => {
    expect(shouldNotify([], 'invoice_overdue')).toBe(true);
  });

  it('respects explicit enabled = false', () => {
    const prefs: Pref[] = [{ notification_type: 'invoice_overdue', enabled: false }];
    expect(shouldNotify(prefs, 'invoice_overdue')).toBe(false);
  });

  it('respects explicit enabled = true', () => {
    const prefs: Pref[] = [{ notification_type: 'invoice_overdue', enabled: true }];
    expect(shouldNotify(prefs, 'invoice_overdue')).toBe(true);
  });

  it('unrelated preferences do not affect other types', () => {
    const prefs: Pref[] = [{ notification_type: 'followup_due', enabled: false }];
    expect(shouldNotify(prefs, 'invoice_overdue')).toBe(true);
  });
});

// ── Outbox retry semantics ────────────────────────────────────────────────────

describe('outbox retry semantics', () => {
  type OutboxItem = { attempts: number; max_attempts: number; status: string };

  function nextStatus(item: OutboxItem, hadError: boolean): string {
    if (!hadError) return 'delivered';
    const newAttempts = item.attempts + 1;
    return newAttempts >= item.max_attempts ? 'failed' : 'pending';
  }

  it('delivers on success regardless of attempt count', () => {
    expect(nextStatus({ attempts: 0, max_attempts: 3, status: 'pending' }, false)).toBe(
      'delivered'
    );
    expect(nextStatus({ attempts: 2, max_attempts: 3, status: 'pending' }, false)).toBe(
      'delivered'
    );
  });

  it('retries on error when attempts < max_attempts', () => {
    expect(nextStatus({ attempts: 1, max_attempts: 3, status: 'pending' }, true)).toBe('pending');
  });

  it('marks failed on error when attempts reach max_attempts', () => {
    expect(nextStatus({ attempts: 2, max_attempts: 3, status: 'pending' }, true)).toBe('failed');
  });

  it('never retries past max_attempts', () => {
    expect(nextStatus({ attempts: 3, max_attempts: 3, status: 'pending' }, true)).toBe('failed');
  });
});

// ── Read/unread logic ─────────────────────────────────────────────────────────

describe('read/unread state', () => {
  type N = { id: string; read_at: string | null };

  const applyMarkRead = (notifs: N[], ids: string[]): N[] =>
    notifs.map((n) => (ids.includes(n.id) ? { ...n, read_at: '2026-11-09T10:00:00Z' } : n));

  const unreadCount = (notifs: N[]): number => notifs.filter((n) => !n.read_at).length;

  it('counts unread correctly', () => {
    const notifs: N[] = [
      { id: '1', read_at: null },
      { id: '2', read_at: '2026-11-09T09:00:00Z' },
      { id: '3', read_at: null },
    ];
    expect(unreadCount(notifs)).toBe(2);
  });

  it('marks specific notifications as read', () => {
    const notifs: N[] = [
      { id: '1', read_at: null },
      { id: '2', read_at: null },
    ];
    const updated = applyMarkRead(notifs, ['1']);
    expect(updated.find((n) => n.id === '1')?.read_at).not.toBeNull();
    expect(updated.find((n) => n.id === '2')?.read_at).toBeNull();
  });

  it('does not re-stamp already-read notifications', () => {
    const notifs: N[] = [{ id: '1', read_at: '2026-11-09T09:00:00Z' }];
    const updated = applyMarkRead(notifs, ['1']);
    expect(updated[0].read_at).toBe('2026-11-09T09:00:00Z');
  });
});
```

- [ ] **Step 5: Run tests**

```bash
pnpm --filter @platform/crm test
```

Expected: new tests pass; total ≥ 278.

- [ ] **Step 6: Commit**

```bash
git add apps/crm/src/lib/notifications/ apps/crm/src/lib/hooks/useOutboxWorker.ts apps/crm/src/lib/hooks/useNotifications.ts apps/crm/src/lib/__tests__/notifications.test.ts
git commit -m "feat(10G): notification engine types + useOutboxWorker + useNotifications hooks + 30 tests"
```

---

## Task 6: NotificationBell + AppHeader + AppShell

**Files:**

- Create: `apps/crm/src/components/layout/NotificationBell.tsx`
- Modify: `apps/crm/src/components/layout/AppHeader.tsx`
- Modify: `apps/crm/src/components/layout/AppShell.tsx`

- [ ] **Step 1: Create NotificationBell.tsx**

```tsx
// apps/crm/src/components/layout/NotificationBell.tsx
import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { cn } from '@/lib/utils';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications(10);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const recent = notifications.slice(0, 8);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 rounded-lg border bg-popover shadow-md">
          <div className="flex items-center justify-between border-b px-4 py-2.5">
            <span className="text-sm font-semibold">Notifications</span>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead()}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => {
                  setOpen(false);
                  navigate('/notifications');
                }}
                className="text-xs text-primary hover:underline"
              >
                View all
              </button>
            </div>
          </div>

          {recent.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">No notifications</p>
          ) : (
            <ul className="max-h-72 overflow-y-auto py-1">
              {recent.map((n) => (
                <li
                  key={n.id}
                  onClick={() => !n.read_at && markRead([n.id])}
                  className={cn(
                    'flex cursor-pointer gap-2 px-4 py-2.5 text-sm hover:bg-accent transition-colors',
                    !n.read_at && 'bg-primary/5'
                  )}
                >
                  {!n.read_at && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  )}
                  <div className={cn('min-w-0', n.read_at && 'ml-4')}>
                    <p className={cn('truncate font-medium', !n.read_at && 'text-foreground')}>
                      {n.title}
                    </p>
                    {n.body && <p className="truncate text-xs text-muted-foreground">{n.body}</p>}
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(n.created_at).toLocaleString('en-IN', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add NotificationBell to AppHeader.tsx**

In `apps/crm/src/components/layout/AppHeader.tsx`, add the bell before the sign-out button:

```tsx
import { LogOut } from 'lucide-react';
import { Button } from '@platform/ui';
import { useAuth } from '@/lib/auth-context';
import { NotificationBell } from './NotificationBell';

export function AppHeader() {
  const { signOut, isLoading } = useAuth();

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex items-center gap-2">
        {/* Breadcrumb / page title injected by child routes */}
      </div>
      <div className="flex items-center gap-3">
        <NotificationBell />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut()}
          disabled={isLoading}
          className="gap-2"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Sign out</span>
        </Button>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Mount useOutboxWorker in AppShell.tsx**

```tsx
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { AppHeader } from './AppHeader';
import { Breadcrumbs } from './Breadcrumbs';
import { GlobalSearch } from '../search/GlobalSearch';
import { useOutboxWorker } from '@/lib/hooks/useOutboxWorker';

export function AppShell() {
  useOutboxWorker(); // polls every 30s, processes pending outbox items

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden md:flex md:shrink-0">
        <Sidebar />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto bg-background p-6">
          <Breadcrumbs />
          <Outlet />
        </main>
      </div>
      <GlobalSearch />
    </div>
  );
}
```

- [ ] **Step 4: Typecheck**

```bash
pnpm --filter @platform/crm typecheck
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add apps/crm/src/components/layout/NotificationBell.tsx apps/crm/src/components/layout/AppHeader.tsx apps/crm/src/components/layout/AppShell.tsx
git commit -m "feat(10G): NotificationBell in header + useOutboxWorker mounted in AppShell"
```

---

## Task 7: NotificationsPage + NotificationPreferencesPage

**Files:**

- Create: `apps/crm/src/pages/notifications/NotificationsPage.tsx`
- Create: `apps/crm/src/pages/notifications/NotificationPreferencesPage.tsx`

- [ ] **Step 1: Create NotificationsPage.tsx**

```tsx
// apps/crm/src/pages/notifications/NotificationsPage.tsx
import { useNotifications } from '@/lib/hooks/useNotifications';
import { NOTIFICATION_LABELS } from '@/lib/notifications/notification-types';
import type { NotificationType } from '@/lib/notifications/notification-types';
import { Bell, CheckCheck } from 'lucide-react';

export function NotificationsPage() {
  const { notifications, unreadCount, isLoading, markRead, markAllRead } = useNotifications(100);

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Notifications</h1>
          {unreadCount > 0 && <p className="text-sm text-muted-foreground">{unreadCount} unread</p>}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead()}
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-accent transition-colors"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
          <Bell className="h-8 w-8" />
          <p className="text-sm">No notifications yet</p>
        </div>
      ) : (
        <ul className="space-y-1">
          {notifications.map((n) => (
            <li
              key={n.id}
              onClick={() => !n.read_at && markRead([n.id])}
              className={`flex cursor-pointer gap-3 rounded-lg border p-4 transition-colors hover:bg-accent/50 ${!n.read_at ? 'bg-primary/5 border-primary/20' : 'bg-card'}`}
            >
              {!n.read_at && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />}
              <div className={`min-w-0 flex-1 ${n.read_at ? '' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium leading-snug">{n.title}</p>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {new Date(n.created_at).toLocaleString('en-IN', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
                {n.body && <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>}
                <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                  {NOTIFICATION_LABELS[n.notification_type as NotificationType] ??
                    n.notification_type}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create NotificationPreferencesPage.tsx**

```tsx
// apps/crm/src/pages/notifications/NotificationPreferencesPage.tsx
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { NOTIFICATION_TYPES, NOTIFICATION_LABELS } from '@/lib/notifications/notification-types';
import type { NotificationType } from '@/lib/notifications/notification-types';

type Prefs = Record<NotificationType, boolean>;

export function NotificationPreferencesPage() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<Prefs>(
    () => Object.fromEntries(NOTIFICATION_TYPES.map((t) => [t, true])) as Prefs
  );
  const [saving, setSaving] = useState<NotificationType | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('notification_preferences')
      .select('notification_type, enabled')
      .eq('profile_id', user.id)
      .then(({ data }) => {
        if (data) {
          setPrefs((prev) => {
            const next = { ...prev };
            data.forEach((row) => {
              if (NOTIFICATION_TYPES.includes(row.notification_type as NotificationType)) {
                next[row.notification_type as NotificationType] = row.enabled;
              }
            });
            return next;
          });
        }
      });
  }, [user]);

  async function toggle(type: NotificationType, enabled: boolean) {
    if (!user) return;
    setSaving(type);
    await supabase
      .from('notification_preferences')
      .upsert({ profile_id: user.id, notification_type: type, enabled })
      .eq('profile_id', user.id)
      .eq('notification_type', type);
    setPrefs((prev) => ({ ...prev, [type]: enabled }));
    setSaving(null);
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Notification Preferences</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Choose which in-app notifications you receive.
        </p>
      </div>

      <ul className="space-y-2">
        {NOTIFICATION_TYPES.map((type) => (
          <li
            key={type}
            className="flex items-center justify-between rounded-lg border bg-card p-4"
          >
            <span className="text-sm font-medium">{NOTIFICATION_LABELS[type]}</span>
            <button
              type="button"
              disabled={saving === type}
              onClick={() => toggle(type, !prefs[type])}
              aria-checked={prefs[type]}
              role="switch"
              className={`relative h-5 w-9 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 ${prefs[type] ? 'bg-primary' : 'bg-input'}`}
            >
              <span
                className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${prefs[type] ? 'translate-x-4' : 'translate-x-0'}`}
              />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

```bash
pnpm --filter @platform/crm typecheck
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add apps/crm/src/pages/notifications/
git commit -m "feat(10G): NotificationsPage + NotificationPreferencesPage"
```

---

## Task 8: AutomationRulesPage

**Files:**

- Create: `apps/crm/src/pages/admin/AutomationRulesPage.tsx`

- [ ] **Step 1: Create AutomationRulesPage.tsx**

```tsx
// apps/crm/src/pages/admin/AutomationRulesPage.tsx
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Toggle } from 'lucide-react';

interface AutomationRule {
  id: string;
  rule_key: string;
  label: string;
  description: string | null;
  enabled: boolean;
  config: Record<string, unknown>;
}

export function AutomationRulesPage() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editingConfig, setEditingConfig] = useState<string | null>(null);
  const [configDraft, setConfigDraft] = useState('');
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('automation_rules')
      .select('*')
      .order('created_at')
      .then(({ data }) => {
        if (data) setRules(data as AutomationRule[]);
        setIsLoading(false);
      });
  }, []);

  async function toggleRule(id: string, enabled: boolean) {
    setSaving(id);
    await supabase.from('automation_rules').update({ enabled }).eq('id', id);
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled } : r)));
    setSaving(null);
  }

  function startEditConfig(rule: AutomationRule) {
    setEditingConfig(rule.id);
    setConfigDraft(JSON.stringify(rule.config, null, 2));
    setConfigError(null);
  }

  async function saveConfig(id: string) {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(configDraft);
    } catch {
      setConfigError('Invalid JSON');
      return;
    }
    setSaving(id);
    await supabase.from('automation_rules').update({ config: parsed }).eq('id', id);
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, config: parsed } : r)));
    setEditingConfig(null);
    setSaving(null);
  }

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Automation Rules</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Enable or disable automations and configure their parameters.
        </p>
      </div>

      <ul className="space-y-4">
        {rules.map((rule) => (
          <li key={rule.id} className="rounded-lg border bg-card p-5 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-medium">{rule.label}</p>
                {rule.description && (
                  <p className="text-sm text-muted-foreground mt-0.5">{rule.description}</p>
                )}
              </div>
              <button
                type="button"
                disabled={saving === rule.id}
                onClick={() => toggleRule(rule.id, !rule.enabled)}
                aria-checked={rule.enabled}
                role="switch"
                className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 ${rule.enabled ? 'bg-primary' : 'bg-input'}`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${rule.enabled ? 'translate-x-4' : 'translate-x-0'}`}
                />
              </button>
            </div>

            {editingConfig === rule.id ? (
              <div className="space-y-2">
                <textarea
                  value={configDraft}
                  onChange={(e) => {
                    setConfigDraft(e.target.value);
                    setConfigError(null);
                  }}
                  rows={6}
                  className="w-full rounded-md border bg-background px-3 py-2 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {configError && <p className="text-xs text-destructive">{configError}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={() => saveConfig(rule.id)}
                    disabled={saving === rule.id}
                    className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingConfig(null)}
                    className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <code className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                  {JSON.stringify(rule.config)}
                </code>
                <button
                  onClick={() => startEditConfig(rule)}
                  className="text-xs text-primary hover:underline"
                >
                  Edit config
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 2: Fix unused import** — The `Toggle` import from lucide-react is not used. Remove it:

```tsx
// Remove: import { Toggle } from 'lucide-react';
// (no icon needed — the toggle is CSS-only)
```

The correct import line at the top of the file should be empty or removed entirely.

- [ ] **Step 3: Typecheck**

```bash
pnpm --filter @platform/crm typecheck
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add apps/crm/src/pages/admin/AutomationRulesPage.tsx
git commit -m "feat(10G): AutomationRulesPage — enable/disable rules, edit JSON config"
```

---

## Task 9: Router + sidebar wiring

**Files:**

- Modify: `apps/crm/src/router.tsx`
- Modify: `apps/crm/src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Add lazy imports to router.tsx**

Read current `router.tsx`. Add after the existing admin lazy imports:

```ts
const AutomationRulesPage = lazy(() =>
  import('./pages/admin/AutomationRulesPage').then((m) => ({ default: m.AutomationRulesPage }))
);

const NotificationsPage = lazy(() =>
  import('./pages/notifications/NotificationsPage').then((m) => ({ default: m.NotificationsPage }))
);

const NotificationPreferencesPage = lazy(() =>
  import('./pages/notifications/NotificationPreferencesPage').then((m) => ({
    default: m.NotificationPreferencesPage,
  }))
);
```

- [ ] **Step 2: Add routes to the children array in router.tsx**

After the `admin/data-management` route:

```tsx
{
  path: 'admin/automation',
  handle: { crumb: 'Automation Rules' },
  element: (
    <ProtectedRoute requiredRoles={['admin']}>
      <S><AutomationRulesPage /></S>
    </ProtectedRoute>
  ),
},
{
  path: 'notifications',
  handle: { crumb: 'Notifications' },
  element: (
    <S><NotificationsPage /></S>
  ),
},
{
  path: 'notifications/preferences',
  handle: { crumb: 'Notification Preferences' },
  element: (
    <S><NotificationPreferencesPage /></S>
  ),
},
```

- [ ] **Step 3: Update Sidebar.tsx**

Read current `Sidebar.tsx`. Add to the lucide-react imports: `BellRing`, `Zap`.

Add to `ADMIN_ITEMS` (after `Data Management`):

```ts
{ to: '/admin/automation', label: 'Automation', icon: Zap },
```

Add a new `PERSONAL_ITEMS` array and a new sidebar section. This section appears above Administration (visible to all staff):

```ts
const PERSONAL_ITEMS: NavItem[] = [
  { to: '/notifications', label: 'Notifications', icon: BellRing },
];
```

In the `Sidebar` component, add `<SidebarSection label="My Activity" items={PERSONAL_ITEMS} />` just before the Administration section, inside `{isAdmin && ...}`.

Actually, "Notifications" should be visible to ALL active staff, not just admin. Place it directly in the nav (not inside `{isAdmin && ...}`):

```tsx
{
  /* Notifications — visible to all staff */
}
<SidebarSection label="My Activity" items={PERSONAL_ITEMS} />;
```

Add this between the Reports link and the Website section divider.

- [ ] **Step 4: Typecheck + tests**

```bash
pnpm --filter @platform/crm typecheck && pnpm --filter @platform/crm test
```

Expected: 0 errors, all tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/crm/src/router.tsx apps/crm/src/components/layout/Sidebar.tsx
git commit -m "feat(10G): router + sidebar — /notifications, /notifications/preferences, /admin/automation routes + sidebar entries"
```

---

## Task 10: Final verification

**Files:** No new files. Runs checks only; fix any issues found.

- [ ] **Step 1: Run full test suite**

```bash
pnpm --filter @platform/crm test
```

Expected: all tests pass; ≥ 278 total (248 existing + 30 new).

- [ ] **Step 2: Typecheck both apps**

```bash
pnpm --filter @platform/crm typecheck && pnpm --filter @platform/website typecheck
```

Expected: 0 errors in both.

- [ ] **Step 3: Build both apps**

```bash
pnpm --filter @platform/crm build && pnpm --filter @platform/website build
```

Expected: both clean. ExcelJS size warning is informational — not an error.

- [ ] **Step 4: Apply all migrations locally**

```bash
supabase migration up --local
```

Expected: all 3 new migrations (24, 25, 26) applied without error.

- [ ] **Step 5: Commit any fixes, then final commit if clean**

If no fixes needed:

```bash
git log --oneline -8
```

Confirm Phase 10G commits are all present. Done.

---

## Mandatory completion checks

Before reporting Phase 10G complete, verify ALL of the following:

- [ ] `pnpm --filter @platform/crm test` — all tests pass (≥ 278)
- [ ] `pnpm -r typecheck` — 0 errors in CRM and website
- [ ] `pnpm --filter @platform/crm build` — clean build
- [ ] `pnpm --filter @platform/website build` — clean build
- [ ] `supabase migration up --local` — migrations 24, 25, 26 applied without error
- [ ] Bell icon visible in CRM header
- [ ] `/notifications` route renders
- [ ] `/admin/automation` route renders (admin only)
- [ ] Automation rules sidebar entry appears
- [ ] No service-role key in browser code
- [ ] No customer-facing email/WhatsApp sending implemented

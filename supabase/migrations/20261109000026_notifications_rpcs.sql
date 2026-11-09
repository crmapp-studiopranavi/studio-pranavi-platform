-- ── notify_recipient ──────────────────────────────────────────────────────────
-- Creates an in-app notification if the recipient has not opted out.

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
  v_enabled boolean;
  v_id      uuid;
begin
  select enabled into v_enabled
  from public.notification_preferences
  where profile_id = p_recipient_id
    and notification_type = p_notification_type;

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

-- ── pick_round_robin_owner ────────────────────────────────────────────────────
-- Selects the active sales/admin/manager profile with fewest open leads.

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
  v_rule      public.automation_rules%rowtype;
  v_lead_id   uuid;
  v_owner_id  uuid;
  v_strategy  text;
  v_name      text := p_payload->>'name';
  v_email     text := p_payload->>'email';
  v_phone     text := p_payload->>'phone';
  v_desc      text := coalesce(p_payload->>'message', '(no message)');
begin
  select * into v_rule
  from public.automation_rules
  where rule_key = 'new_enquiry' and enabled;

  if not found then
    return jsonb_build_object('skipped', 'rule_disabled');
  end if;

  v_strategy := coalesce(v_rule.config->>'assignment_strategy', 'none');

  if v_strategy = 'round_robin' then
    v_owner_id := public.pick_round_robin_owner();
  elsif v_strategy = 'fixed' then
    v_owner_id := (v_rule.config->>'assignee_id')::uuid;
  end if;

  insert into public.leads (
    source, status, full_name, email, phone,
    project_description, owner_id
  ) values (
    'website', 'new', v_name,
    nullif(v_email, ''), nullif(v_phone, ''),
    v_desc, v_owner_id
  )
  returning id into v_lead_id;

  insert into public.activities (activity_type, subject, body, lead_id)
  values ('system', 'New website enquiry received', v_desc, v_lead_id);

  if v_owner_id is not null then
    perform public.notify_recipient(
      v_owner_id, 'new_enquiry_assigned',
      'New enquiry: ' || v_name,
      coalesce(nullif(v_email,''), nullif(v_phone,''), ''),
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
  v_rule    public.automation_rules%rowtype;
  v_quote   public.quotes%rowtype;
  v_delay   integer;
  v_task_id uuid;
begin
  select * into v_rule
  from public.automation_rules
  where rule_key = 'quote_sent_followup' and enabled;

  if not found then
    return jsonb_build_object('skipped', 'rule_disabled');
  end if;

  select * into v_quote
  from public.quotes
  where id = (p_payload->>'quote_id')::uuid;

  if not found then
    return jsonb_build_object('skipped', 'quote_not_found');
  end if;

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
  v_rule      public.automation_rules%rowtype;
  v_order     public.orders%rowtype;
  v_project   public.projects%rowtype;
  v_templates jsonb;
  v_tpl       jsonb;
  v_sort      integer := 0;
  v_ms_ids    uuid[] := '{}';
  v_ms_id     uuid;
begin
  select * into v_rule
  from public.automation_rules
  where rule_key = 'order_confirmed' and enabled;

  if not found then
    return jsonb_build_object('skipped', 'rule_disabled');
  end if;

  select * into v_order
  from public.orders
  where id = (p_payload->>'order_id')::uuid;

  if not found then
    return jsonb_build_object('skipped', 'order_not_found');
  end if;

  select * into v_project
  from public.projects
  where order_id = v_order.id
  limit 1;

  if not found then
    return jsonb_build_object('skipped', 'no_project_for_order');
  end if;

  v_templates := coalesce(v_rule.config->'milestone_templates', '[]'::jsonb);

  for v_tpl in select * from jsonb_array_elements(v_templates)
  loop
    insert into public.project_milestones (
      project_id, name, status, due_date, sort_order
    ) values (
      v_project.id,
      v_tpl->>'name',
      'pending',
      current_date + ((v_tpl->>'offset_days')::integer),
      v_sort
    )
    returning id into v_ms_id;
    v_ms_ids := array_append(v_ms_ids, v_ms_id);
    v_sort := v_sort + 1;
  end loop;

  return jsonb_build_object('milestone_ids', to_jsonb(v_ms_ids), 'project_id', v_project.id);
end;
$$;

-- ── handle_installation_scheduled ────────────────────────────────────────────

create or replace function public.handle_installation_scheduled(p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_rule     public.automation_rules%rowtype;
  v_rec      record;
  v_notified integer := 0;
begin
  select * into v_rule
  from public.automation_rules
  where rule_key = 'installation_scheduled' and enabled;

  if not found then
    return jsonb_build_object('skipped', 'rule_disabled');
  end if;

  for v_rec in
    select id from public.profiles
    where is_active = true
      and role in ('operations','admin','manager')
  loop
    perform public.notify_recipient(
      v_rec.id, 'installation_scheduled',
      'Installation scheduled',
      'Scheduled for ' || coalesce(p_payload->>'scheduled_start', 'TBD'),
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
  v_rule     public.automation_rules%rowtype;
  v_invoice  public.invoices%rowtype;
  v_rec      record;
  v_notified integer := 0;
begin
  select * into v_rule
  from public.automation_rules
  where rule_key = 'invoice_overdue' and enabled;

  if not found then
    return jsonb_build_object('skipped', 'rule_disabled');
  end if;

  select * into v_invoice
  from public.invoices
  where id = (p_payload->>'invoice_id')::uuid;

  if not found then
    return jsonb_build_object('skipped', 'invoice_not_found');
  end if;

  for v_rec in
    select id from public.profiles
    where is_active = true
      and role in ('admin','manager')
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

create or replace function public.enqueue_time_based_notifications()
returns integer language plpgsql security definer set search_path = '' as $$
declare
  v_count   integer := 0;
  v_rec     record;
  v_rule    public.automation_rules%rowtype;
  v_hours   integer;
  v_days    integer;
  v_today   text := current_date::text;
  v_inserted boolean;
begin
  -- ── Follow-up due ────────────────────────────────────────────────────────────
  select * into v_rule
  from public.automation_rules
  where rule_key = 'followup_due' and enabled;

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
        jsonb_build_object(
          'lead_id',   v_rec.lead_id,
          'owner_id',  v_rec.owner_id,
          'full_name', v_rec.full_name,
          'due_at',    v_rec.next_follow_up_at
        ),
        'followup_due:' || v_rec.lead_id::text || ':' || v_today
      )
      on conflict (idempotency_key) do nothing;
      if found then v_count := v_count + 1; end if;
    end loop;
  end if;

  -- ── Quote expiring ───────────────────────────────────────────────────────────
  select * into v_rule
  from public.automation_rules
  where rule_key = 'quote_expiring' and enabled;

  if found then
    v_days := coalesce((v_rule.config->>'warn_days_before')::integer, 3);

    for v_rec in
      select qv.quote_id, q.owner_id, q.quote_number, qv.valid_until
      from public.quote_versions qv
      join public.quotes q on q.id = qv.quote_id
        and q.current_version_id = qv.id
      where q.status = 'sent'
        and qv.valid_until is not null
        and qv.valid_until between current_date
          and current_date + (v_days || ' days')::interval
        and q.owner_id is not null
    loop
      insert into public.notification_outbox (event_type, payload, idempotency_key)
      values (
        'quote_expiring',
        jsonb_build_object(
          'quote_id',     v_rec.quote_id,
          'owner_id',     v_rec.owner_id,
          'quote_number', v_rec.quote_number,
          'valid_until',  v_rec.valid_until
        ),
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

create or replace function public.process_next_outbox_item()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_item   public.notification_outbox%rowtype;
  v_result jsonb;
begin
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

  update public.notification_outbox
  set status = 'processing', attempts = attempts + 1
  where id = v_item.id;

  begin
    case v_item.event_type
      when 'new_website_enquiry' then
        v_result := public.handle_new_website_enquiry(v_item.payload);
      when 'quote_sent_followup' then
        v_result := public.handle_quote_sent_followup(v_item.payload);
      when 'order_confirmed' then
        v_result := public.handle_order_confirmed(v_item.payload);
      when 'installation_scheduled' then
        v_result := public.handle_installation_scheduled(v_item.payload);
      when 'invoice_overdue' then
        v_result := public.handle_invoice_overdue(v_item.payload);
      when 'followup_due' then
        perform public.notify_recipient(
          (v_item.payload->>'owner_id')::uuid,
          'followup_due',
          'Follow-up due: ' || coalesce(v_item.payload->>'full_name', 'Lead'),
          'Follow-up was due at ' || coalesce(v_item.payload->>'due_at', ''),
          'lead', (v_item.payload->>'lead_id')::uuid
        );
        v_result := jsonb_build_object('notified', 1);
      when 'quote_expiring' then
        perform public.notify_recipient(
          (v_item.payload->>'owner_id')::uuid,
          'quote_expiring',
          'Quote expiring soon: ' || coalesce(v_item.payload->>'quote_number', ''),
          'Expires on ' || coalesce(v_item.payload->>'valid_until', ''),
          'quote', (v_item.payload->>'quote_id')::uuid
        );
        v_result := jsonb_build_object('notified', 1);
      else
        v_result := jsonb_build_object(
          'skipped', 'unknown_event_type',
          'event_type', v_item.event_type
        );
    end case;

    update public.notification_outbox
    set status = 'delivered', processed_at = now(), last_error = null
    where id = v_item.id;

  exception when others then
    update public.notification_outbox
    set status = case
          when attempts >= max_attempts then 'failed'
          else 'pending'
        end,
        last_error = sqlerrm
    where id = v_item.id;
    return jsonb_build_object('error', sqlerrm, 'item_id', v_item.id);
  end;

  return jsonb_build_object(
    'done', false, 'processed', 1,
    'event_type', v_item.event_type,
    'result', v_result
  );
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
  where recipient_id = auth.uid()
    and read_at is null;
$$;

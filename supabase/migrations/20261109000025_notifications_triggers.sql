-- ── Update submit_contact_inquiry to match new outbox schema ──────────────────

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

-- ── enqueue_outbox_event helper ───────────────────────────────────────────────

create or replace function public.enqueue_outbox_event(
  p_event_type      text,
  p_payload         jsonb,
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
  if new.status = 'sent' and (old.status is null or old.status::text <> 'sent') then
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

-- ── orders: status → 'confirmed' (INSERT default or UPDATE) ──────────────────

create or replace function public.on_order_confirmed()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status::text = 'confirmed'
     and (TG_OP = 'INSERT' or old.status::text <> 'confirmed')
  then
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

-- ── installations: scheduled_start set ───────────────────────────────────────

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
  if new.status::text = 'overdue'
     and (old.status is null or old.status::text <> 'overdue')
  then
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

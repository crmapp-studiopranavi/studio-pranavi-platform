-- Migration: quote item immutability trigger and server-side quotation RPCs
-- All monetary calculations use floor() on minor units to match TypeScript calcLineItem()

-- ─── Immutability: quote items of a sent version cannot be mutated ────────────

create or replace function prevent_sent_item_mutation()
returns trigger language plpgsql as $$
declare
  v_version_id uuid;
  v_sent_at    timestamptz;
begin
  v_version_id := case TG_OP when 'DELETE' then OLD.quote_version_id else NEW.quote_version_id end;
  select sent_at into v_sent_at from public.quote_versions where id = v_version_id;
  if v_sent_at is not null then
    raise exception 'Cannot modify items of a sent quote version (id=%)', v_version_id
      using errcode = 'P0001';
  end if;
  if TG_OP = 'DELETE' then return OLD; end if;
  return NEW;
end;
$$;

create trigger quote_items_immutable
  before insert or update or delete on public.quote_items
  for each row execute function prevent_sent_item_mutation();

-- ─── recalculate_version_totals ───────────────────────────────────────────────
-- Recomputes every line item's derived columns then updates the version totals.
-- Uses floor() arithmetic to match the TypeScript calcLineItem() function.
-- SECURITY DEFINER to bypass the admin-only UPDATE RLS on quote_versions.

create or replace function public.recalculate_version_totals(p_version_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row     record;
  v_ls      bigint;
  v_ld      bigint;
  v_lt      bigint;
  v_sub     bigint := 0;
  v_disc    bigint := 0;
  v_tax     bigint := 0;
  v_total   bigint;
  v_sent_at timestamptz;
begin
  if not public.is_active_staff() then
    raise exception 'Unauthorized' using errcode = 'PGRST301';
  end if;
  if public.get_my_role() not in ('admin', 'manager', 'sales') then
    raise exception 'Insufficient role' using errcode = 'PGRST301';
  end if;

  select sent_at into v_sent_at from quote_versions where id = p_version_id for update;
  if not found then
    raise exception 'Version not found' using errcode = 'P0002';
  end if;
  if v_sent_at is not null then
    raise exception 'Cannot recalculate a sent quote version' using errcode = 'P0001';
  end if;

  for v_row in
    select id, quantity, unit_price_minor, discount_rate, tax_rate
    from   quote_items
    where  quote_version_id = p_version_id
  loop
    v_ls := floor(v_row.quantity * v_row.unit_price_minor);
    v_ld := floor(v_ls * v_row.discount_rate);
    v_lt := floor((v_ls - v_ld) * v_row.tax_rate);

    update quote_items set
      line_subtotal_minor = v_ls,
      line_discount_minor = v_ld,
      line_tax_minor      = v_lt,
      line_total_minor    = v_ls - v_ld + v_lt
    where id = v_row.id;

    v_sub  := v_sub  + v_ls;
    v_disc := v_disc + v_ld;
    v_tax  := v_tax  + v_lt;
  end loop;

  v_total := v_sub - v_disc + v_tax;

  update quote_versions set
    subtotal_minor = v_sub,
    discount_minor = v_disc,
    tax_minor      = v_tax,
    total_minor    = v_total
  where id = p_version_id;

  return jsonb_build_object(
    'subtotal_minor', v_sub,
    'discount_minor', v_disc,
    'tax_minor',      v_tax,
    'total_minor',    v_total
  );
end;
$$;

grant execute on function public.recalculate_version_totals(uuid) to authenticated;

-- ─── create_quote ─────────────────────────────────────────────────────────────

create or replace function public.create_quote(
  p_customer_id    uuid,
  p_lead_id        uuid        default null,
  p_issue_date     date        default current_date,
  p_valid_until    date        default (current_date + interval '30 days')::date,
  p_currency       char(3)     default 'INR',
  p_owner_id       uuid        default null,
  p_terms          text        default null,
  p_customer_notes text        default null,
  p_internal_notes text        default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id  uuid := auth.uid();
  v_quote_id  uuid;
  v_ver_id    uuid;
  v_snapshot  jsonb;
  v_qnum      text;
begin
  if not public.is_active_staff() then
    raise exception 'Unauthorized' using errcode = 'PGRST301';
  end if;
  if public.get_my_role() not in ('admin', 'manager', 'sales') then
    raise exception 'Insufficient role' using errcode = 'PGRST301';
  end if;

  -- Customer snapshot at quote creation time
  select jsonb_build_object(
    'customer_number', c.customer_number,
    'display_name',    c.display_name,
    'gstin',           c.gstin,
    'contact_name',    cc.full_name,
    'contact_email',   cc.email,
    'contact_phone',   cc.phone,
    'contact_whatsapp', cc.whatsapp_number,
    'address_line1',   a.line1,
    'address_line2',   a.line2,
    'address_city',    a.city,
    'address_state',   a.state,
    'address_postal',  a.postal_code
  ) into v_snapshot
  from customers c
  left join customer_contacts cc on cc.id = c.primary_contact_id
  left join addresses a
    on  a.customer_id = c.id
    and a.is_primary  = true
  where c.id = p_customer_id;

  if v_snapshot is null then
    raise exception 'Customer not found' using errcode = 'P0002';
  end if;

  v_qnum := public.next_quote_number();

  insert into quotes (
    quote_number, customer_id, lead_id, status,
    owner_id, created_by, updated_by
  ) values (
    v_qnum, p_customer_id, p_lead_id, 'draft',
    p_owner_id, v_actor_id, v_actor_id
  )
  returning id into v_quote_id;

  insert into quote_versions (
    quote_id, version_number,
    issue_date, valid_until, currency,
    subtotal_minor, discount_minor, tax_minor, total_minor,
    terms, customer_notes, internal_notes,
    snapshot_customer, created_by
  ) values (
    v_quote_id, 1,
    p_issue_date, p_valid_until, p_currency,
    0, 0, 0, 0,
    p_terms, p_customer_notes, p_internal_notes,
    v_snapshot, v_actor_id
  )
  returning id into v_ver_id;

  update quotes set current_version_id = v_ver_id where id = v_quote_id;

  -- Activity on the quote (and optionally on the customer / lead)
  insert into activities (
    activity_type, subject,
    quote_id, customer_id, lead_id,
    actor_id, occurred_at
  ) values (
    'system', 'Quote ' || v_qnum || ' created',
    v_quote_id, p_customer_id, p_lead_id,
    v_actor_id, now()
  );

  return jsonb_build_object('quote_id', v_quote_id, 'version_id', v_ver_id);
end;
$$;

grant execute on function public.create_quote(uuid, uuid, date, date, char, uuid, text, text, text) to authenticated;

-- ─── send_quote ───────────────────────────────────────────────────────────────

create or replace function public.send_quote(p_quote_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_quote    quotes%rowtype;
begin
  if not public.is_active_staff() then
    raise exception 'Unauthorized' using errcode = 'PGRST301';
  end if;
  if public.get_my_role() not in ('admin', 'manager', 'sales') then
    raise exception 'Insufficient role' using errcode = 'PGRST301';
  end if;

  select * into v_quote from quotes where id = p_quote_id for update;
  if not found then
    raise exception 'Quote not found' using errcode = 'P0002';
  end if;
  if v_quote.status not in ('draft', 'internal_review') then
    raise exception 'Quote status % cannot be sent', v_quote.status using errcode = 'P0001';
  end if;

  -- Stamp sent_at on the current version (trigger allows this: old.sent_at IS NULL)
  update quote_versions
  set sent_at = now()
  where id = v_quote.current_version_id;

  update quotes
  set status = 'sent', updated_by = v_actor_id
  where id = p_quote_id;

  insert into activities (
    activity_type, subject,
    quote_id, customer_id,
    actor_id, occurred_at
  ) values (
    'quote_sent', 'Quote sent to customer',
    p_quote_id, v_quote.customer_id,
    v_actor_id, now()
  );

  return jsonb_build_object('quote_id', p_quote_id);
end;
$$;

grant execute on function public.send_quote(uuid) to authenticated;

-- ─── accept_quote ─────────────────────────────────────────────────────────────

create or replace function public.accept_quote(
  p_quote_id uuid,
  p_notes    text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_quote    quotes%rowtype;
begin
  if not public.is_active_staff() then
    raise exception 'Unauthorized' using errcode = 'PGRST301';
  end if;
  if public.get_my_role() not in ('admin', 'manager', 'sales') then
    raise exception 'Insufficient role' using errcode = 'PGRST301';
  end if;

  select * into v_quote from quotes where id = p_quote_id for update;
  if not found then
    raise exception 'Quote not found' using errcode = 'P0002';
  end if;
  if v_quote.status not in ('sent', 'viewed') then
    raise exception 'Quote status % cannot be accepted', v_quote.status using errcode = 'P0001';
  end if;

  update quotes
  set status = 'accepted', accepted_at = now(), updated_by = v_actor_id
  where id = p_quote_id;

  insert into activities (
    activity_type, subject, body,
    quote_id, customer_id,
    actor_id, occurred_at
  ) values (
    'status_change', 'Quote accepted',
    p_notes,
    p_quote_id, v_quote.customer_id,
    v_actor_id, now()
  );

  return jsonb_build_object('quote_id', p_quote_id);
end;
$$;

grant execute on function public.accept_quote(uuid, text) to authenticated;

-- ─── reject_quote ─────────────────────────────────────────────────────────────

create or replace function public.reject_quote(
  p_quote_id uuid,
  p_reason   text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_quote    quotes%rowtype;
begin
  if not public.is_active_staff() then
    raise exception 'Unauthorized' using errcode = 'PGRST301';
  end if;
  if public.get_my_role() not in ('admin', 'manager', 'sales') then
    raise exception 'Insufficient role' using errcode = 'PGRST301';
  end if;

  select * into v_quote from quotes where id = p_quote_id for update;
  if not found then
    raise exception 'Quote not found' using errcode = 'P0002';
  end if;
  if v_quote.status in ('accepted', 'cancelled', 'archived') then
    raise exception 'Quote status % cannot be rejected', v_quote.status using errcode = 'P0001';
  end if;

  update quotes
  set status = 'rejected', rejected_at = now(), updated_by = v_actor_id
  where id = p_quote_id;

  insert into activities (
    activity_type, subject, body,
    quote_id, customer_id,
    actor_id, occurred_at
  ) values (
    'status_change', 'Quote rejected',
    p_reason,
    p_quote_id, v_quote.customer_id,
    v_actor_id, now()
  );

  return jsonb_build_object('quote_id', p_quote_id);
end;
$$;

grant execute on function public.reject_quote(uuid, text) to authenticated;

-- ─── revise_quote ─────────────────────────────────────────────────────────────
-- Creates a new draft version copying all line items from the current version.
-- The previous version is preserved (and remains immutable if it was sent).

create or replace function public.revise_quote(p_quote_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id   uuid := auth.uid();
  v_quote      quotes%rowtype;
  v_old_ver    quote_versions%rowtype;
  v_new_ver_id uuid;
  v_next_num   integer;
  v_sub        bigint := 0;
  v_disc       bigint := 0;
  v_tax        bigint := 0;
begin
  if not public.is_active_staff() then
    raise exception 'Unauthorized' using errcode = 'PGRST301';
  end if;
  if public.get_my_role() not in ('admin', 'manager', 'sales') then
    raise exception 'Insufficient role' using errcode = 'PGRST301';
  end if;

  select * into v_quote from quotes where id = p_quote_id for update;
  if not found then
    raise exception 'Quote not found' using errcode = 'P0002';
  end if;

  select * into v_old_ver from quote_versions where id = v_quote.current_version_id;

  select coalesce(max(version_number), 0) + 1
  into v_next_num
  from quote_versions
  where quote_id = p_quote_id;

  -- New version starts as draft (totals = 0, copied from items below)
  insert into quote_versions (
    quote_id, version_number,
    issue_date, valid_until, currency,
    subtotal_minor, discount_minor, tax_minor, total_minor,
    terms, customer_notes, internal_notes,
    snapshot_customer, created_by
  ) values (
    p_quote_id, v_next_num,
    v_old_ver.issue_date, v_old_ver.valid_until, v_old_ver.currency,
    0, 0, 0, 0,
    v_old_ver.terms, v_old_ver.customer_notes, v_old_ver.internal_notes,
    v_old_ver.snapshot_customer, v_actor_id
  )
  returning id into v_new_ver_id;

  -- Copy items and accumulate totals
  insert into quote_items (
    quote_version_id, line_number, item_type, title, description,
    quantity, unit, unit_price_minor, discount_rate, tax_rate,
    line_subtotal_minor, line_discount_minor, line_tax_minor, line_total_minor,
    sort_order, metadata
  )
  select
    v_new_ver_id, line_number, item_type, title, description,
    quantity, unit, unit_price_minor, discount_rate, tax_rate,
    line_subtotal_minor, line_discount_minor, line_tax_minor, line_total_minor,
    sort_order, metadata
  from quote_items
  where quote_version_id = v_old_ver.id;

  -- Compute totals from the copied items
  select
    coalesce(sum(line_subtotal_minor), 0),
    coalesce(sum(line_discount_minor), 0),
    coalesce(sum(line_tax_minor),      0)
  into v_sub, v_disc, v_tax
  from quote_items
  where quote_version_id = v_new_ver_id;

  update quote_versions set
    subtotal_minor = v_sub,
    discount_minor = v_disc,
    tax_minor      = v_tax,
    total_minor    = v_sub - v_disc + v_tax
  where id = v_new_ver_id;

  -- Promote new version; reset status to draft
  update quotes
  set current_version_id = v_new_ver_id,
      status = 'draft',
      updated_by = v_actor_id
  where id = p_quote_id;

  insert into activities (
    activity_type, subject,
    quote_id, customer_id,
    actor_id, occurred_at
  ) values (
    'system',
    'Quote revised — version ' || v_next_num || ' created',
    p_quote_id, v_quote.customer_id,
    v_actor_id, now()
  );

  return jsonb_build_object('quote_id', p_quote_id, 'version_id', v_new_ver_id);
end;
$$;

grant execute on function public.revise_quote(uuid) to authenticated;

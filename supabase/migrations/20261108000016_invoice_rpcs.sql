-- Migration: invoice workflow RPCs

-- ─── recalculate_invoice_totals ──────────────────────────────────────────────

create or replace function recalculate_invoice_totals(
  p_invoice_id uuid
) returns void language plpgsql security definer
set search_path = ''
as $$
declare
  v_invoice       public.invoices;
  v_item          record;
  v_sub           bigint;
  v_disc          bigint;
  v_after         bigint;
  v_tax           bigint;
  v_total         bigint;
  agg_sub         bigint := 0;
  agg_disc        bigint := 0;
  agg_tax         bigint := 0;
  agg_total       bigint := 0;
begin
  if not public.is_active_staff() then
    raise exception 'Unauthorized';
  end if;

  select * into v_invoice from public.invoices where id = p_invoice_id;
  if not found then
    raise exception 'Invoice not found: %', p_invoice_id;
  end if;

  if v_invoice.status <> 'draft' then
    raise exception 'Invoice is not in draft status';
  end if;

  for v_item in
    select * from public.invoice_items where invoice_id = p_invoice_id
  loop
    v_sub   := floor(v_item.quantity::numeric * v_item.unit_price_minor::numeric)::bigint;
    v_disc  := floor(v_sub::numeric * v_item.discount_rate::numeric)::bigint;
    v_after := v_sub - v_disc;
    v_tax   := floor(v_after::numeric * v_item.tax_rate::numeric)::bigint;
    v_total := v_after + v_tax;

    update public.invoice_items
    set line_subtotal_minor = v_sub,
        line_discount_minor = v_disc,
        line_tax_minor      = v_tax,
        line_total_minor    = v_total
    where id = v_item.id;

    agg_sub   := agg_sub   + v_sub;
    agg_disc  := agg_disc  + v_disc;
    agg_tax   := agg_tax   + v_tax;
    agg_total := agg_total + v_total;
  end loop;

  update public.invoices
  set subtotal_minor = agg_sub,
      discount_minor = agg_disc,
      tax_minor      = agg_tax,
      total_minor    = agg_total,
      balance_minor  = agg_total - v_invoice.amount_paid_minor,
      updated_at     = now()
  where id = p_invoice_id;
end;
$$;

grant execute on function public.recalculate_invoice_totals(uuid) to authenticated;

-- ─── create_invoice ───────────────────────────────────────────────────────────

create or replace function create_invoice(
  p_customer_id  uuid,
  p_order_id     uuid    default null,
  p_project_id   uuid    default null,
  p_issue_date   date    default current_date,
  p_due_date     date    default current_date,
  p_notes        text    default null
) returns jsonb language plpgsql security definer
set search_path = ''
as $$
declare
  v_role          text;
  v_invoice_id    uuid;
  v_inv_number    text;
begin
  if not public.is_active_staff() then
    raise exception 'Unauthorized';
  end if;

  v_role := public.get_my_role()::text;
  if v_role not in ('admin', 'manager') then
    raise exception 'Only admin or manager can create invoices';
  end if;

  if p_due_date < p_issue_date then
    raise exception 'Due date must be on or after issue date';
  end if;

  -- Idempotency: return existing non-void invoice for this order
  if p_order_id is not null then
    select id into v_invoice_id
    from public.invoices
    where order_id = p_order_id
      and archived_at is null
      and status <> 'void'
    limit 1;

    if found then
      return jsonb_build_object(
        'invoice_id',     v_invoice_id,
        'invoice_number', (select invoice_number from public.invoices where id = v_invoice_id)
      );
    end if;
  end if;

  v_inv_number := public.next_invoice_number();

  insert into public.invoices (
    invoice_number, customer_id, order_id, project_id,
    status, issue_date, due_date, currency,
    subtotal_minor, discount_minor, tax_minor, total_minor,
    amount_paid_minor, balance_minor,
    notes, created_by, updated_by
  ) values (
    v_inv_number, p_customer_id, p_order_id, p_project_id,
    'draft', p_issue_date, p_due_date, 'INR',
    0, 0, 0, 0,
    0, 0,
    p_notes, auth.uid(), auth.uid()
  )
  returning id into v_invoice_id;

  insert into public.activities (
    activity_type, subject, customer_id, actor_id, occurred_at
  ) values (
    'system',
    'Invoice ' || v_inv_number || ' created',
    p_customer_id,
    auth.uid(),
    now()
  );

  return jsonb_build_object(
    'invoice_id',     v_invoice_id,
    'invoice_number', v_inv_number
  );
end;
$$;

grant execute on function public.create_invoice(uuid, uuid, uuid, date, date, text) to authenticated;

-- ─── add_invoice_item ────────────────────────────────────────────────────────

create or replace function add_invoice_item(
  p_invoice_id       uuid,
  p_title            text,
  p_description      text    default null,
  p_quantity         numeric default 1,
  p_unit             text    default 'unit',
  p_unit_price_minor bigint  default 0,
  p_discount_rate    numeric default 0,
  p_tax_rate         numeric default 0
) returns jsonb language plpgsql security definer
set search_path = ''
as $$
declare
  v_role          text;
  v_invoice       public.invoices;
  v_line_number   integer;
  v_sub           bigint;
  v_disc          bigint;
  v_after         bigint;
  v_tax           bigint;
  v_total         bigint;
  v_item_id       uuid;
begin
  if not public.is_active_staff() then
    raise exception 'Unauthorized';
  end if;

  v_role := public.get_my_role()::text;
  if v_role not in ('admin', 'manager') then
    raise exception 'Only admin or manager can add invoice items';
  end if;

  select * into v_invoice from public.invoices where id = p_invoice_id for update;
  if not found then
    raise exception 'Invoice not found: %', p_invoice_id;
  end if;

  if v_invoice.status <> 'draft' then
    raise exception 'Invoice is not in draft status';
  end if;

  select coalesce(max(line_number), 0) + 1
  into v_line_number
  from public.invoice_items
  where invoice_id = p_invoice_id;

  v_sub   := floor(p_quantity * p_unit_price_minor)::bigint;
  v_disc  := floor(v_sub::numeric * p_discount_rate)::bigint;
  v_after := v_sub - v_disc;
  v_tax   := floor(v_after::numeric * p_tax_rate)::bigint;
  v_total := v_after + v_tax;

  insert into public.invoice_items (
    invoice_id, line_number, title, description,
    quantity, unit, unit_price_minor,
    discount_rate, tax_rate,
    line_subtotal_minor, line_discount_minor, line_tax_minor, line_total_minor,
    sort_order
  ) values (
    p_invoice_id, v_line_number, p_title, p_description,
    p_quantity, p_unit, p_unit_price_minor,
    p_discount_rate, p_tax_rate,
    v_sub, v_disc, v_tax, v_total,
    v_line_number
  )
  returning id into v_item_id;

  perform public.recalculate_invoice_totals(p_invoice_id);

  return jsonb_build_object('item_id', v_item_id);
end;
$$;

grant execute on function public.add_invoice_item(uuid, text, text, numeric, text, bigint, numeric, numeric) to authenticated;

-- ─── issue_invoice ────────────────────────────────────────────────────────────

create or replace function issue_invoice(
  p_invoice_id uuid
) returns void language plpgsql security definer
set search_path = ''
as $$
declare
  v_role      text;
  v_invoice   public.invoices;
  v_status    public.invoice_status;
  v_customer  uuid;
  v_inv_num   text;
begin
  if not public.is_active_staff() then
    raise exception 'Unauthorized';
  end if;

  v_role := public.get_my_role()::text;
  if v_role not in ('admin', 'manager') then
    raise exception 'Only admin or manager can issue invoices';
  end if;

  select * into v_invoice from public.invoices where id = p_invoice_id for update;
  if not found then
    raise exception 'Invoice not found: %', p_invoice_id;
  end if;

  if v_invoice.status <> 'draft' then
    raise exception 'Invoice is not in draft status';
  end if;

  if v_invoice.total_minor = 0 then
    raise exception 'Cannot issue an invoice with zero total';
  end if;

  if v_invoice.due_date < current_date then
    v_status := 'overdue';
  else
    v_status := 'issued';
  end if;

  update public.invoices
  set status     = v_status,
      issued_at  = now(),
      updated_at = now(),
      updated_by = auth.uid()
  where id = p_invoice_id;

  insert into public.activities (
    activity_type, subject, customer_id, actor_id, occurred_at
  ) values (
    'system',
    'Invoice ' || v_invoice.invoice_number || ' issued',
    v_invoice.customer_id,
    auth.uid(),
    now()
  );
end;
$$;

grant execute on function public.issue_invoice(uuid) to authenticated;

-- ─── record_payment ───────────────────────────────────────────────────────────

create or replace function record_payment(
  p_invoice_id    uuid,
  p_amount_minor  bigint,
  p_method        public.payment_method,
  p_payment_date  date,
  p_reference     text    default null,
  p_notes         text    default null
) returns jsonb language plpgsql security definer
set search_path = ''
as $$
declare
  v_role           text;
  v_invoice        public.invoices;
  v_pay_number     text;
  v_payment_id     uuid;
begin
  if not public.is_active_staff() then
    raise exception 'Unauthorized';
  end if;

  v_role := public.get_my_role()::text;
  if v_role not in ('admin', 'manager') then
    raise exception 'Only admin or manager can record payments';
  end if;

  select * into v_invoice from public.invoices where id = p_invoice_id for update;
  if not found then
    raise exception 'Invoice not found: %', p_invoice_id;
  end if;

  if v_invoice.status in ('void', 'draft') then
    raise exception 'Cannot record payment on a % invoice', v_invoice.status;
  end if;

  if p_amount_minor <= 0 then
    raise exception 'Payment amount must be positive';
  end if;

  if v_invoice.amount_paid_minor + p_amount_minor > v_invoice.total_minor then
    raise exception 'Payment would exceed invoice total (invoice_id=%)', p_invoice_id
      using errcode = 'P0001';
  end if;

  v_pay_number := public.next_payment_number();

  insert into public.payments (
    payment_number, invoice_id, customer_id,
    amount_minor, currency, payment_date,
    method, status, reference, notes, recorded_by
  ) values (
    v_pay_number, p_invoice_id, v_invoice.customer_id,
    p_amount_minor, v_invoice.currency, p_payment_date,
    p_method, 'cleared', p_reference, p_notes, auth.uid()
  )
  returning id into v_payment_id;

  perform public.apply_payment(v_payment_id);

  insert into public.activities (
    activity_type, subject, customer_id, actor_id, occurred_at
  ) values (
    'payment',
    'Payment ' || v_pay_number || ' of ' || (p_amount_minor / 100)::text || ' recorded',
    v_invoice.customer_id,
    auth.uid(),
    now()
  );

  return jsonb_build_object(
    'payment_id',     v_payment_id,
    'payment_number', v_pay_number
  );
end;
$$;

grant execute on function public.record_payment(uuid, bigint, public.payment_method, date, text, text) to authenticated;

-- ─── reverse_payment ─────────────────────────────────────────────────────────

create or replace function reverse_payment(
  p_payment_id uuid,
  p_reason     text default null
) returns void language plpgsql security definer
set search_path = ''
as $$
declare
  v_role        text;
  v_payment     public.payments;
  v_invoice     public.invoices;
  v_new_paid    bigint;
  v_new_balance bigint;
  v_new_status  public.invoice_status;
begin
  if not public.is_active_staff() then
    raise exception 'Unauthorized';
  end if;

  v_role := public.get_my_role()::text;
  if v_role not in ('admin', 'manager') then
    raise exception 'Only admin or manager can reverse payments';
  end if;

  select * into v_payment from public.payments where id = p_payment_id for update;
  if not found then
    raise exception 'Payment not found: %', p_payment_id;
  end if;

  if v_payment.reversed_at is not null or v_payment.status = 'reversed' then
    raise exception 'Payment is already reversed';
  end if;

  select * into v_invoice from public.invoices where id = v_payment.invoice_id for update;

  v_new_paid    := v_invoice.amount_paid_minor - v_payment.amount_minor;
  v_new_balance := v_invoice.total_minor - v_new_paid;

  if v_new_paid < 0 then
    raise exception 'Reversal would result in negative balance';
  end if;

  if v_invoice.status = 'void' then
    v_new_status := 'void';
  elsif v_new_paid = 0 then
    if v_invoice.due_date < current_date then
      v_new_status := 'overdue';
    else
      v_new_status := 'issued';
    end if;
  else
    v_new_status := 'partially_paid';
  end if;

  update public.payments
  set reversed_at = now(),
      status      = 'reversed',
      updated_at  = now()
  where id = p_payment_id;

  update public.invoices
  set amount_paid_minor = v_new_paid,
      balance_minor     = v_new_balance,
      status            = v_new_status,
      updated_at        = now()
  where id = v_invoice.id;

  insert into public.activities (
    activity_type, subject, customer_id, actor_id, occurred_at
  ) values (
    'payment',
    'Payment ' || v_payment.payment_number || ' reversed'
      || coalesce(': ' || p_reason, ''),
    v_invoice.customer_id,
    auth.uid(),
    now()
  );
end;
$$;

grant execute on function public.reverse_payment(uuid, text) to authenticated;

-- ─── void_invoice ────────────────────────────────────────────────────────────

create or replace function void_invoice(
  p_invoice_id uuid
) returns void language plpgsql security definer
set search_path = ''
as $$
declare
  v_invoice   public.invoices;
begin
  if not public.is_active_staff() then
    raise exception 'Unauthorized';
  end if;

  if public.get_my_role()::text <> 'admin' then
    raise exception 'Only admin can void invoices';
  end if;

  select * into v_invoice from public.invoices where id = p_invoice_id for update;
  if not found then
    raise exception 'Invoice not found: %', p_invoice_id;
  end if;

  if v_invoice.status in ('void', 'paid') then
    raise exception 'Cannot void a % invoice', v_invoice.status;
  end if;

  update public.invoices
  set status     = 'void',
      updated_at = now(),
      updated_by = auth.uid()
  where id = p_invoice_id;

  insert into public.activities (
    activity_type, subject, customer_id, actor_id, occurred_at
  ) values (
    'system',
    'Invoice ' || v_invoice.invoice_number || ' voided',
    v_invoice.customer_id,
    auth.uid(),
    now()
  );
end;
$$;

grant execute on function public.void_invoice(uuid) to authenticated;

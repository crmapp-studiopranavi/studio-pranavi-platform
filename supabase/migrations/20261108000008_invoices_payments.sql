-- Migration: invoices, invoice items, and payments

-- ─── Document number sequences ────────────────────────────────────────────────

create sequence invoice_number_seq start 1;
create sequence payment_number_seq start 1;

create or replace function next_invoice_number()
returns text language plpgsql security definer
set search_path = ''
as $$
declare
  prefix text;
  seq_val bigint;
begin
  select coalesce(invoice_prefix, 'INV')
  into prefix
  from public.business_settings
  limit 1;
  seq_val := nextval('public.invoice_number_seq');
  return prefix || '-' || lpad(seq_val::text, 5, '0');
end;
$$;

create or replace function next_payment_number()
returns text language sql security definer
set search_path = ''
as $$
  select 'PAY-' || lpad(nextval('public.payment_number_seq')::text, 5, '0');
$$;

-- ─── Invoices ─────────────────────────────────────────────────────────────────

create table invoices (
  id               uuid           primary key default gen_random_uuid(),
  invoice_number   text           not null unique,
  customer_id      uuid           not null references customers(id),
  order_id         uuid           references orders(id),
  project_id       uuid           references projects(id),
  status           invoice_status not null default 'draft',
  issue_date       date           not null,
  due_date         date           not null,
  currency         char(3)        not null default 'INR',
  subtotal_minor   bigint         not null check (subtotal_minor >= 0),
  discount_minor   bigint         not null default 0 check (discount_minor >= 0),
  tax_minor        bigint         not null default 0 check (tax_minor >= 0),
  total_minor      bigint         not null check (total_minor >= 0),
  amount_paid_minor bigint        not null default 0 check (amount_paid_minor >= 0),
  balance_minor    bigint         not null,
  notes            text,
  issued_at        timestamptz,
  created_by       uuid           references profiles(id),
  updated_by       uuid           references profiles(id),
  created_at       timestamptz    not null default now(),
  updated_at       timestamptz    not null default now(),
  archived_at      timestamptz,

  constraint invoices_due_date_order
    check (due_date >= issue_date),
  constraint invoices_total_check
    check (total_minor = subtotal_minor - discount_minor + tax_minor),
  constraint invoices_balance_check
    check (balance_minor = total_minor - amount_paid_minor),
  constraint invoices_amount_paid_range
    check (amount_paid_minor <= total_minor)
);

create index invoices_status_due_idx    on invoices (status, due_date);
create index invoices_customer_idx      on invoices (customer_id, issue_date desc);

create trigger invoices_updated_at
  before update on invoices
  for each row execute function set_updated_at();

-- ─── Invoice items ────────────────────────────────────────────────────────────

create table invoice_items (
  id                   uuid          primary key default gen_random_uuid(),
  invoice_id           uuid          not null references invoices(id) on delete cascade,
  line_number          integer       not null,
  title                text          not null,
  description          text,
  quantity             numeric(12,3) not null check (quantity > 0),
  unit                 text          not null,
  unit_price_minor     bigint        not null check (unit_price_minor >= 0),
  discount_rate        numeric(7,4)  not null default 0 check (discount_rate >= 0 and discount_rate <= 1),
  tax_rate             numeric(7,4)  not null default 0 check (tax_rate >= 0),
  line_subtotal_minor  bigint        not null check (line_subtotal_minor >= 0),
  line_discount_minor  bigint        not null check (line_discount_minor >= 0),
  line_tax_minor       bigint        not null check (line_tax_minor >= 0),
  line_total_minor     bigint        not null check (line_total_minor >= 0),
  sort_order           integer       not null default 0
);

create unique index invoice_items_line_idx on invoice_items (invoice_id, line_number);

-- ─── Payments ─────────────────────────────────────────────────────────────────

create table payments (
  id             uuid           primary key default gen_random_uuid(),
  payment_number text           not null unique,
  invoice_id     uuid           not null references invoices(id),
  customer_id    uuid           not null references customers(id),
  amount_minor   bigint         not null check (amount_minor > 0),
  currency       char(3)        not null default 'INR',
  payment_date   date           not null,
  method         payment_method not null,
  status         payment_status not null default 'cleared',
  reference      text,
  notes          text,
  recorded_by    uuid           references profiles(id),
  created_at     timestamptz    not null default now(),
  updated_at     timestamptz    not null default now(),
  reversed_at    timestamptz
);

create index payments_invoice_idx   on payments (invoice_id);
create index payments_customer_idx  on payments (customer_id);
create index payments_date_idx      on payments (payment_date desc);

create trigger payments_updated_at
  before update on payments
  for each row execute function set_updated_at();

-- ─── Apply payment and update invoice balance atomically ──────────────────────

create or replace function apply_payment(
  p_payment_id uuid
) returns void language plpgsql security definer
set search_path = ''
as $$
declare
  v_payment      public.payments;
  v_invoice      public.invoices;
  v_new_paid     bigint;
  v_new_balance  bigint;
  v_new_status   public.invoice_status;
begin
  select * into v_payment from public.payments where id = p_payment_id for update;
  if not found then
    raise exception 'Payment not found: %', p_payment_id;
  end if;

  select * into v_invoice from public.invoices where id = v_payment.invoice_id for update;

  v_new_paid    := v_invoice.amount_paid_minor + v_payment.amount_minor;
  v_new_balance := v_invoice.total_minor - v_new_paid;

  if v_new_paid > v_invoice.total_minor then
    raise exception 'Payment would exceed invoice total (invoice_id=%)', v_invoice.id
      using errcode = 'P0001';
  end if;

  if v_new_balance = 0 then
    v_new_status := 'paid';
  elsif v_new_paid > 0 then
    v_new_status := 'partially_paid';
  else
    v_new_status := v_invoice.status;
  end if;

  update public.invoices
  set amount_paid_minor = v_new_paid,
      balance_minor     = v_new_balance,
      status            = v_new_status,
      updated_at        = now()
  where id = v_invoice.id;
end;
$$;

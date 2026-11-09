-- Migration: versioned quotations and line items

-- ─── Document number sequence and generator ───────────────────────────────────

create sequence quote_number_seq start 1;

create or replace function next_quote_number()
returns text language plpgsql security definer
set search_path = ''
as $$
declare
  prefix text;
  seq_val bigint;
begin
  select coalesce(quotation_prefix, 'QT')
  into prefix
  from public.business_settings
  limit 1;

  seq_val := nextval('public.quote_number_seq');
  return prefix || '-' || lpad(seq_val::text, 5, '0');
end;
$$;

-- ─── Quotes (commercial proposal identity) ───────────────────────────────────

create table quotes (
  id                  uuid         primary key default gen_random_uuid(),
  quote_number        text         not null unique,
  customer_id         uuid         not null references customers(id),
  lead_id             uuid         references leads(id),
  project_id          uuid,        -- FK added in projects migration
  status              quote_status not null default 'draft',
  current_version_id  uuid,        -- FK added after quote_versions
  owner_id            uuid         references profiles(id),
  accepted_at         timestamptz,
  rejected_at         timestamptz,
  created_by          uuid         references profiles(id),
  updated_by          uuid         references profiles(id),
  created_at          timestamptz  not null default now(),
  updated_at          timestamptz  not null default now(),
  archived_at         timestamptz
);

create index quotes_customer_idx on quotes (customer_id, created_at desc);
create index quotes_status_idx   on quotes (status, owner_id);
create index quotes_lead_idx     on quotes (lead_id);

create trigger quotes_updated_at
  before update on quotes
  for each row execute function set_updated_at();

-- ─── Quote versions (immutable after sent_at is set) ──────────────────────────

create table quote_versions (
  id                  uuid    primary key default gen_random_uuid(),
  quote_id            uuid    not null references quotes(id) on delete cascade,
  version_number      integer not null check (version_number > 0),
  issue_date          date    not null,
  valid_until         date    not null,
  currency            char(3) not null default 'INR',
  subtotal_minor      bigint  not null default 0 check (subtotal_minor >= 0),
  discount_minor      bigint  not null default 0 check (discount_minor >= 0),
  tax_minor           bigint  not null default 0 check (tax_minor >= 0),
  total_minor         bigint  not null default 0 check (total_minor >= 0),
  terms               text,
  customer_notes      text,
  internal_notes      text,   -- NEVER render on customer-facing documents
  sent_at             timestamptz,
  snapshot_customer   jsonb   not null default '{}',
  created_by          uuid    references profiles(id),
  created_at          timestamptz not null default now(),

  constraint quote_versions_dates_order
    check (valid_until >= issue_date),
  constraint quote_versions_total_check
    check (total_minor = subtotal_minor - discount_minor + tax_minor)
);

create unique index quote_versions_number_idx on quote_versions (quote_id, version_number);

-- Block mutations on sent versions (allow only setting sent_at once)
create or replace function prevent_sent_version_mutation()
returns trigger language plpgsql as $$
begin
  if old.sent_at is not null then
    -- Only allow updating internal_notes by admins (via separate audited procedure)
    raise exception
      'Cannot modify a sent quote version (quote_id=%, version=%). Create a new version instead.',
      old.quote_id, old.version_number
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger quote_versions_immutable
  before update on quote_versions
  for each row execute function prevent_sent_version_mutation();

-- ─── Quote items ──────────────────────────────────────────────────────────────

create table quote_items (
  id                   uuid           primary key default gen_random_uuid(),
  quote_version_id     uuid           not null references quote_versions(id) on delete cascade,
  line_number          integer        not null,
  item_type            text           not null
                       check (item_type in ('material', 'labour', 'installation', 'transport', 'discount', 'other')),
  title                text           not null,
  description          text,
  quantity             numeric(12,3)  not null check (quantity > 0),
  unit                 text           not null,
  unit_price_minor     bigint         not null check (unit_price_minor >= 0),
  discount_rate        numeric(7,4)   not null default 0 check (discount_rate >= 0 and discount_rate <= 1),
  tax_rate             numeric(7,4)   not null default 0 check (tax_rate >= 0),
  line_subtotal_minor  bigint         not null check (line_subtotal_minor >= 0),
  line_discount_minor  bigint         not null check (line_discount_minor >= 0),
  line_tax_minor       bigint         not null check (line_tax_minor >= 0),
  line_total_minor     bigint         not null check (line_total_minor >= 0),
  sort_order           integer        not null default 0,
  metadata             jsonb          not null default '{}'
);

create unique index quote_items_line_idx on quote_items (quote_version_id, line_number);

-- ─── Back-reference from quotes to current version ───────────────────────────

alter table quotes
  add constraint quotes_current_version_fk
  foreign key (current_version_id) references quote_versions(id);

-- ─── Back-references from activities and tasks ────────────────────────────────

alter table activities add constraint activities_quote_fk foreign key (quote_id) references quotes(id);
alter table tasks      add constraint tasks_quote_fk      foreign key (quote_id) references quotes(id);

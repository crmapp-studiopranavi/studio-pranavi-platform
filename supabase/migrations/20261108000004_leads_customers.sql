-- Migration: leads, customers, contacts, and addresses

-- ─── Lead number sequence ─────────────────────────────────────────────────────

create sequence lead_number_seq start 1000;

-- ─── Leads ────────────────────────────────────────────────────────────────────

create table leads (
  id                       uuid         primary key default gen_random_uuid(),
  lead_number              bigint       not null unique default nextval('lead_number_seq'),
  source                   text         not null default 'website',
  status                   lead_status  not null default 'new',
  priority                 lead_priority not null default 'medium',
  full_name                text         not null,
  email                    citext,
  phone                    text,
  whatsapp_number          text,
  preferred_contact_method contact_method,
  location_text            text,
  service_id               uuid         references services(id),
  service_interest         text,
  budget_min_minor         bigint       check (budget_min_minor >= 0),
  budget_max_minor         bigint       check (budget_max_minor >= 0),
  project_description      text         not null,
  owner_id                 uuid         references profiles(id),
  next_follow_up_at        timestamptz,
  lost_reason              text,
  consent_text_version     text,
  consented_at             timestamptz,
  -- converted_customer_id added after customers table (see below)
  created_at               timestamptz  not null default now(),
  updated_at               timestamptz  not null default now(),
  archived_at              timestamptz,

  -- At least one contact method is required
  constraint leads_contact_required
    check (email is not null or phone is not null or whatsapp_number is not null),
  -- Budget max must be >= min when both provided
  constraint leads_budget_order
    check (
      budget_min_minor is null or budget_max_minor is null
      or budget_max_minor >= budget_min_minor
    ),
  -- Lost reason required when status is 'lost'
  constraint leads_lost_reason_required
    check (status != 'lost' or lost_reason is not null)
);

create index leads_status_owner_idx  on leads (status, owner_id, next_follow_up_at);
create index leads_created_idx       on leads (created_at desc);
create index leads_phone_idx         on leads (phone);
create index leads_email_idx         on leads (lower(email::text));

create trigger leads_updated_at
  before update on leads
  for each row execute function set_updated_at();

-- ─── Customer number sequence ─────────────────────────────────────────────────

create sequence customer_number_seq start 100;

-- ─── Customers ────────────────────────────────────────────────────────────────

create table customers (
  id                  uuid    primary key default gen_random_uuid(),
  customer_number     bigint  not null unique default nextval('customer_number_seq'),
  display_name        text    not null,
  customer_type       text    check (customer_type in ('individual', 'business')),
  primary_contact_id  uuid,   -- FK added below after customer_contacts
  gstin               text,
  owner_id            uuid    references profiles(id),
  source_lead_id      uuid    unique references leads(id),
  notes               text,
  created_by          uuid    references profiles(id),
  updated_by          uuid    references profiles(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  archived_at         timestamptz
);

create index customers_owner_idx    on customers (owner_id);
create index customers_created_idx  on customers (created_at desc);

create trigger customers_updated_at
  before update on customers
  for each row execute function set_updated_at();

-- ─── Customer contacts ────────────────────────────────────────────────────────

create table customer_contacts (
  id                       uuid    primary key default gen_random_uuid(),
  customer_id              uuid    not null references customers(id) on delete cascade,
  full_name                text    not null,
  title                    text,
  email                    citext,
  phone                    text,
  whatsapp_number          text,
  preferred_contact_method contact_method,
  is_primary               boolean not null default false,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),

  constraint contacts_contact_required
    check (email is not null or phone is not null or whatsapp_number is not null)
);

-- At most one primary contact per customer
create unique index contacts_one_primary_idx
  on customer_contacts (customer_id)
  where is_primary = true;

create index contacts_customer_idx on customer_contacts (customer_id);

create trigger customer_contacts_updated_at
  before update on customer_contacts
  for each row execute function set_updated_at();

-- Now add the FK from customers to customer_contacts
alter table customers
  add constraint customers_primary_contact_fk
  foreign key (primary_contact_id) references customer_contacts(id);

-- ─── Addresses ────────────────────────────────────────────────────────────────

create table addresses (
  id           uuid    primary key default gen_random_uuid(),
  customer_id  uuid    not null references customers(id) on delete cascade,
  address_type text,
  line1        text    not null,
  line2        text,
  city         text,
  state        text,
  postal_code  text,
  country_code char(2) not null default 'IN',
  is_primary   boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- At most one primary address per customer and type
create unique index addresses_one_primary_idx
  on addresses (customer_id, address_type)
  where is_primary = true;

create index addresses_customer_idx on addresses (customer_id);

create trigger addresses_updated_at
  before update on addresses
  for each row execute function set_updated_at();

-- ─── Back-reference: leads.converted_customer_id ─────────────────────────────

alter table leads
  add column converted_customer_id uuid references customers(id);

create index leads_converted_customer_idx on leads (converted_customer_id);

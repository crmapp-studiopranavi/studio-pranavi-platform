-- Migration: orders, projects, milestones, and installations

-- ─── Document number sequences ────────────────────────────────────────────────

create sequence order_number_seq start 1;
create sequence project_number_seq start 1;

create or replace function next_order_number()
returns text language plpgsql security definer
set search_path = ''
as $$
declare
  prefix text;
  seq_val bigint;
begin
  select coalesce(order_prefix, 'ORD')
  into prefix
  from public.business_settings
  limit 1;
  seq_val := nextval('public.order_number_seq');
  return prefix || '-' || lpad(seq_val::text, 5, '0');
end;
$$;

create or replace function next_project_number()
returns text language sql security definer
set search_path = ''
as $$
  select 'PRJ-' || lpad(nextval('public.project_number_seq')::text, 5, '0');
$$;

-- ─── Orders ───────────────────────────────────────────────────────────────────

create table orders (
  id                        uuid         primary key default gen_random_uuid(),
  order_number              text         not null unique,
  customer_id               uuid         not null references customers(id),
  quote_id                  uuid         unique references quotes(id),
  accepted_quote_version_id uuid         references quote_versions(id),
  status                    order_status not null default 'confirmed',
  order_date                date         not null default current_date,
  target_completion_date    date,
  currency                  char(3)      not null default 'INR',
  total_minor               bigint       not null check (total_minor >= 0),
  owner_id                  uuid         references profiles(id),
  notes                     text,
  created_by                uuid         references profiles(id),
  updated_by                uuid         references profiles(id),
  created_at                timestamptz  not null default now(),
  updated_at                timestamptz  not null default now(),
  archived_at               timestamptz
);

create index orders_status_date_idx   on orders (status, target_completion_date);
create index orders_customer_idx      on orders (customer_id, created_at desc);

create trigger orders_updated_at
  before update on orders
  for each row execute function set_updated_at();

-- ─── Projects ─────────────────────────────────────────────────────────────────

create table projects (
  id                      uuid            primary key default gen_random_uuid(),
  project_number          text            not null unique,
  order_id                uuid            unique references orders(id),
  customer_id             uuid            not null references customers(id),
  name                    text            not null,
  status                  project_status  not null default 'planned',
  location_address_id     uuid            references addresses(id),
  start_date              date,
  target_completion_date  date,
  actual_completion_date  date,
  project_manager_id      uuid            references profiles(id),
  scope                   text,
  internal_notes          text,
  created_at              timestamptz     not null default now(),
  updated_at              timestamptz     not null default now(),
  archived_at             timestamptz,

  constraint projects_completion_order
    check (
      actual_completion_date is null or
      start_date is null or
      actual_completion_date >= start_date
    )
);

create index projects_status_idx    on projects (status);
create index projects_customer_idx  on projects (customer_id);
create index projects_manager_idx   on projects (project_manager_id);

create trigger projects_updated_at
  before update on projects
  for each row execute function set_updated_at();

-- ─── Project milestones ───────────────────────────────────────────────────────

create table project_milestones (
  id           uuid    primary key default gen_random_uuid(),
  project_id   uuid    not null references projects(id) on delete cascade,
  name         text    not null,
  description  text,
  status       text    not null default 'pending'
               check (status in ('pending', 'in_progress', 'completed', 'blocked', 'skipped')),
  due_date     date,
  completed_at timestamptz,
  sort_order   integer not null default 0,
  assigned_to  uuid    references profiles(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index milestones_project_sort_idx on project_milestones (project_id, sort_order);
create index milestones_assignee_idx     on project_milestones (assigned_to, status, due_date);

create trigger project_milestones_updated_at
  before update on project_milestones
  for each row execute function set_updated_at();

-- ─── Installations ────────────────────────────────────────────────────────────

create table installations (
  id                    uuid  primary key default gen_random_uuid(),
  project_id            uuid  not null references projects(id),
  scheduled_start       timestamptz,
  scheduled_end         timestamptz,
  assigned_team         text,
  lead_installer_id     uuid  references profiles(id),
  status                text  not null default 'scheduled'
                        check (status in ('scheduled', 'in_progress', 'completed', 'rescheduled', 'cancelled')),
  completion_notes      text,
  customer_signoff_name text,
  signed_off_at         timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  constraint installations_schedule_order
    check (
      scheduled_start is null or scheduled_end is null
      or scheduled_end > scheduled_start
    )
);

create index installations_project_idx  on installations (project_id);
create index installations_status_idx   on installations (status, scheduled_start);

create trigger installations_updated_at
  before update on installations
  for each row execute function set_updated_at();

-- ─── Back-references ──────────────────────────────────────────────────────────

alter table quotes        add constraint quotes_project_fk        foreign key (project_id) references projects(id);
alter table activities    add constraint activities_order_fk       foreign key (order_id)   references orders(id);
alter table activities    add constraint activities_project_fk     foreign key (project_id) references projects(id);
alter table tasks         add constraint tasks_order_fk            foreign key (order_id)   references orders(id);
alter table tasks         add constraint tasks_project_fk          foreign key (project_id) references projects(id);
alter table site_visits   add constraint site_visits_project_fk    foreign key (project_id) references projects(id);
alter table measurements  add constraint measurements_project_fk   foreign key (project_id) references projects(id);

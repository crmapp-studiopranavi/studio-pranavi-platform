-- Migration: activities (append-only timeline), tasks, site visits, measurements

-- ─── Activities ───────────────────────────────────────────────────────────────

create table activities (
  id            uuid          primary key default gen_random_uuid(),
  activity_type activity_type not null,
  subject       text,
  body          text,
  occurred_at   timestamptz   not null default now(),
  actor_id      uuid          references profiles(id),
  lead_id       uuid          references leads(id),
  customer_id   uuid          references customers(id),
  quote_id      uuid,         -- FK added in quotes migration
  order_id      uuid,         -- FK added in orders migration
  project_id    uuid,         -- FK added in projects migration
  metadata      jsonb         not null default '{}',
  created_at    timestamptz   not null default now(),

  -- At least one parent entity required
  constraint activities_parent_required
    check (
      lead_id is not null or customer_id is not null or
      quote_id is not null or order_id is not null or project_id is not null
    )
);

create index activities_lead_idx       on activities (lead_id);
create index activities_customer_idx   on activities (customer_id);
create index activities_quote_idx      on activities (quote_id);
create index activities_order_idx      on activities (order_id);
create index activities_project_idx    on activities (project_id);
create index activities_occurred_idx   on activities (occurred_at desc);

-- Activities are append-only — no updated_at, no update trigger

-- ─── Tasks ────────────────────────────────────────────────────────────────────

create table tasks (
  id          uuid          primary key default gen_random_uuid(),
  title       text          not null,
  description text,
  assigned_to uuid          references profiles(id),
  created_by  uuid          references profiles(id),
  due_at      timestamptz,
  completed_at timestamptz,
  priority    lead_priority,
  status      text          not null default 'todo'
                check (status in ('todo', 'in_progress', 'done', 'cancelled')),
  lead_id     uuid          references leads(id),
  customer_id uuid          references customers(id),
  quote_id    uuid,         -- FK added in quotes migration
  order_id    uuid,         -- FK added in orders migration
  project_id  uuid,         -- FK added in projects migration
  created_at  timestamptz   not null default now(),
  updated_at  timestamptz   not null default now(),
  archived_at timestamptz
);

create index tasks_assignee_idx on tasks (assigned_to, status, due_at);
create index tasks_lead_idx     on tasks (lead_id);
create index tasks_customer_idx on tasks (customer_id);

create trigger tasks_updated_at
  before update on tasks
  for each row execute function set_updated_at();

-- ─── Site visits ──────────────────────────────────────────────────────────────

create table site_visits (
  id              uuid  primary key default gen_random_uuid(),
  lead_id         uuid  references leads(id),
  customer_id     uuid  references customers(id),
  project_id      uuid,  -- FK added in projects migration
  scheduled_start timestamptz,
  scheduled_end   timestamptz,
  assigned_to     uuid  references profiles(id),
  address_id      uuid  references addresses(id),
  status          text  not null default 'scheduled'
                  check (status in ('scheduled', 'confirmed', 'completed', 'cancelled', 'rescheduled')),
  purpose         text,
  notes           text,
  completed_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- Require at least one parent
  constraint site_visits_parent_required
    check (lead_id is not null or customer_id is not null or project_id is not null),
  -- End must be after start when both set
  constraint site_visits_schedule_order
    check (scheduled_start is null or scheduled_end is null or scheduled_end > scheduled_start)
);

create index site_visits_lead_idx       on site_visits (lead_id);
create index site_visits_customer_idx   on site_visits (customer_id);
create index site_visits_assigned_idx   on site_visits (assigned_to, status);

create trigger site_visits_updated_at
  before update on site_visits
  for each row execute function set_updated_at();

-- ─── Measurements ─────────────────────────────────────────────────────────────

create table measurements (
  id            uuid         primary key default gen_random_uuid(),
  site_visit_id uuid         references site_visits(id),
  project_id    uuid,        -- FK added in projects migration
  area_or_item  text         not null,
  width_mm      numeric(12,2) check (width_mm > 0),
  height_mm     numeric(12,2) check (height_mm > 0),
  depth_mm      numeric(12,2) check (depth_mm > 0),
  quantity      numeric(12,3) not null default 1 check (quantity > 0),
  unit          text          not null default 'mm',
  notes         text,
  recorded_by   uuid          references profiles(id),
  created_at    timestamptz   not null default now(),
  updated_at    timestamptz   not null default now()
);

create index measurements_visit_idx    on measurements (site_visit_id);
create index measurements_project_idx  on measurements (project_id);

create trigger measurements_updated_at
  before update on measurements
  for each row execute function set_updated_at();

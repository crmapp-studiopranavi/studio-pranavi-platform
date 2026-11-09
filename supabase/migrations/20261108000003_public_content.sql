-- Migration: public-facing content — services, portfolio, testimonials

-- ─── Services ────────────────────────────────────────────────────────────────

create table services (
  id                uuid        primary key default gen_random_uuid(),
  slug              text        not null unique,
  title             text        not null,
  short_description text        not null,
  description       text,
  category          text        not null,
  hero_image_path   text,
  features          jsonb       not null default '[]',
  faqs              jsonb       not null default '[]',
  status            content_status not null default 'draft',
  sort_order        integer     not null default 0,
  seo_title         text,
  seo_description   text,
  created_by        uuid        references profiles(id),
  updated_by        uuid        references profiles(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  archived_at       timestamptz
);

create unique index services_slug_idx on services (slug);
create index services_status_sort_idx on services (status, sort_order);

create trigger services_updated_at
  before update on services
  for each row execute function set_updated_at();

-- ─── Portfolio projects ───────────────────────────────────────────────────────

create table portfolio_projects (
  id                uuid        primary key default gen_random_uuid(),
  slug              text        not null unique,
  title             text        not null,
  category          text        not null,
  location_label    text,
  summary           text        not null,
  description       text,
  materials         text[]      not null default '{}',
  completed_on      date,
  cover_image_path  text,
  status            content_status not null default 'draft',
  is_featured       boolean     not null default false,
  sort_order        integer     not null default 0,
  seo_title         text,
  seo_description   text,
  created_by        uuid        references profiles(id),
  updated_by        uuid        references profiles(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  archived_at       timestamptz
);

create unique index portfolio_projects_slug_idx on portfolio_projects (slug);
create index portfolio_projects_featured_idx  on portfolio_projects (status, is_featured, sort_order);
create index portfolio_projects_category_idx  on portfolio_projects (category, status);

create trigger portfolio_projects_updated_at
  before update on portfolio_projects
  for each row execute function set_updated_at();

-- ─── Portfolio images ─────────────────────────────────────────────────────────

create table portfolio_images (
  id            uuid    primary key default gen_random_uuid(),
  project_id    uuid    not null references portfolio_projects(id) on delete cascade,
  storage_path  text    not null,
  alt_text      text    not null,
  caption       text,
  width         integer check (width > 0),
  height        integer check (height > 0),
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);

create unique index portfolio_images_path_idx on portfolio_images (project_id, storage_path);
create index portfolio_images_sort_idx        on portfolio_images (project_id, sort_order);

-- ─── Testimonials ─────────────────────────────────────────────────────────────

create table testimonials (
  id                   uuid    primary key default gen_random_uuid(),
  display_name         text    not null,
  project_type         text,
  quote                text    not null,
  rating               smallint check (rating between 1 and 5),
  consent_recorded_at  timestamptz,
  status               content_status not null default 'draft',
  sort_order           integer not null default 0,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create trigger testimonials_updated_at
  before update on testimonials
  for each row execute function set_updated_at();

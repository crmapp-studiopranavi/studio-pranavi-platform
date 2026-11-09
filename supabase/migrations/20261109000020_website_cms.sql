-- Migration: Website CMS — media library, page sections, collections,
-- catalogue, testimonials extensions, navigation, SEO settings.
-- Builds on existing services, portfolio_projects, testimonials, business_settings.

-- ─── New enums ────────────────────────────────────────────────────────────────

create type section_type as enum (
  'hero', 'selected_projects', 'services', 'collections', 'gallery',
  'video', 'about', 'text_image', 'craftsmanship', 'materials',
  'process_timeline', 'before_after', 'testimonials', 'faq', 'cta',
  'contact', 'map'
);

create type section_theme as enum ('light', 'dark', 'stone', 'amber');

create type media_kind as enum ('image', 'video_file', 'video_embed');

create type video_platform as enum ('youtube', 'vimeo', 'upload');

-- ─── Media folders ────────────────────────────────────────────────────────────

create table media_folders (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  slug        text        not null unique,
  parent_id   uuid        references media_folders(id) on delete set null,
  is_public   boolean     not null default true,
  created_at  timestamptz not null default now()
);

create index media_folders_parent_idx on media_folders (parent_id);

-- ─── Media library ────────────────────────────────────────────────────────────

create table media_library (
  id                    uuid          primary key default gen_random_uuid(),
  folder_id             uuid          references media_folders(id) on delete set null,
  filename              text          not null,
  title                 text,
  caption               text,
  alt_text              text          not null default '',
  media_kind            media_kind    not null default 'image',
  -- uploaded files
  storage_path          text,
  -- video embeds
  external_url          text,
  video_platform        video_platform,
  video_id              text,
  thumbnail_path        text,
  poster_path           text,
  video_transcript      text,
  autoplay              boolean       not null default false,
  muted                 boolean       not null default true,
  loop                  boolean       not null default false,
  mobile_fallback_path  text,
  -- dimensions / size
  width                 integer       check (width > 0),
  height                integer       check (height > 0),
  file_size_bytes       bigint,
  -- focal point (0.0–1.0)
  focal_point_x         numeric(4,3)  not null default 0.500 check (focal_point_x between 0 and 1),
  focal_point_y         numeric(4,3)  not null default 0.500 check (focal_point_y between 0 and 1),
  -- classification
  tags                  text[]        not null default '{}',
  -- access control: false keeps file in private CRM storage only
  is_public             boolean       not null default true,
  -- soft archive
  archived_at           timestamptz,
  uploaded_by           uuid          references profiles(id),
  created_at            timestamptz   not null default now(),
  updated_at            timestamptz   not null default now(),
  -- either storage_path or external_url must be set
  constraint media_library_source_check check (
    storage_path is not null or external_url is not null
  )
);

create index media_library_folder_idx   on media_library (folder_id);
create index media_library_kind_idx     on media_library (media_kind);
create index media_library_public_idx   on media_library (is_public, archived_at);
create index media_library_tags_idx     on media_library using gin (tags);

create trigger media_library_updated_at
  before update on media_library
  for each row execute function set_updated_at();

-- Track which records use a given media item
create table media_usage (
  id           uuid        primary key default gen_random_uuid(),
  media_id     uuid        not null references media_library(id) on delete cascade,
  table_name   text        not null,
  record_id    uuid        not null,
  field_name   text        not null,
  created_at   timestamptz not null default now(),
  unique (media_id, table_name, record_id, field_name)
);

create index media_usage_media_idx  on media_usage (media_id);
create index media_usage_record_idx on media_usage (table_name, record_id);

-- ─── Website pages ────────────────────────────────────────────────────────────

create table website_pages (
  id               uuid           primary key default gen_random_uuid(),
  slug             text           not null unique,
  title            text           not null,
  meta_title       text,
  meta_description text,
  og_image_id      uuid           references media_library(id),
  status           content_status not null default 'draft',
  is_system        boolean        not null default false,
  created_by       uuid           references profiles(id),
  updated_by       uuid           references profiles(id),
  created_at       timestamptz    not null default now(),
  updated_at       timestamptz    not null default now()
);

create unique index website_pages_slug_idx on website_pages (slug);

create trigger website_pages_updated_at
  before update on website_pages
  for each row execute function set_updated_at();

-- Seed system pages
insert into website_pages (slug, title, is_system, status) values
  ('/', 'Home', true, 'published'),
  ('/projects', 'Projects', true, 'published'),
  ('/expertise', 'Expertise', true, 'published'),
  ('/studio/about', 'About the Studio', true, 'published'),
  ('/studio/craftsmanship', 'Craftsmanship', true, 'published'),
  ('/studio/materials', 'Materials', true, 'published'),
  ('/studio/process', 'Process', true, 'published'),
  ('/collections', 'Collections', true, 'published'),
  ('/catalogue', 'Catalogue', true, 'published'),
  ('/contact', 'Contact', true, 'published'),
  ('/start-a-project', 'Start a Project', true, 'published');

-- ─── Page sections ────────────────────────────────────────────────────────────

create table page_sections (
  id                    uuid           primary key default gen_random_uuid(),
  page_id               uuid           not null references website_pages(id) on delete cascade,
  section_type          section_type   not null,
  title                 text,
  subtitle              text,
  description           text,
  -- structured content — controlled fields only, no raw HTML injection
  content               jsonb          not null default '{}',
  -- primary media
  media_id              uuid           references media_library(id),
  theme                 section_theme  not null default 'light',
  background_color      text,
  -- CTAs
  cta_label             text,
  cta_url               text,
  cta_secondary_label   text,
  cta_secondary_url     text,
  -- layout
  alignment             text           not null default 'left'
                          check (alignment in ('left', 'center', 'right')),
  is_visible            boolean        not null default true,
  sort_order            integer        not null default 0,
  -- publish lifecycle
  status                content_status not null default 'draft',
  published_at          timestamptz,
  scheduled_publish_at  timestamptz,
  created_by            uuid           references profiles(id),
  updated_by            uuid           references profiles(id),
  created_at            timestamptz    not null default now(),
  updated_at            timestamptz    not null default now()
);

create index page_sections_page_idx   on page_sections (page_id, sort_order);
create index page_sections_status_idx on page_sections (status);

create trigger page_sections_updated_at
  before update on page_sections
  for each row execute function set_updated_at();

-- ─── Extend testimonials ──────────────────────────────────────────────────────
-- Add image + location fields; consent_recorded_at already exists.

alter table testimonials
  add column if not exists photo_id       uuid references media_library(id),
  add column if not exists location_label text,
  add column if not exists source_type    text check (source_type in ('direct', 'google', 'email', 'other')) default 'direct',
  add column if not exists role_label     text,
  add column if not exists organisation   text,
  add column if not exists is_featured    boolean not null default false;

-- ─── Collections ─────────────────────────────────────────────────────────────

create table website_collections (
  id               uuid           primary key default gen_random_uuid(),
  slug             text           not null unique,
  title            text           not null,
  description      text,
  cover_image_id   uuid           references media_library(id),
  status           content_status not null default 'draft',
  sort_order       integer        not null default 0,
  seo_title        text,
  seo_description  text,
  created_by       uuid           references profiles(id),
  updated_by       uuid           references profiles(id),
  created_at       timestamptz    not null default now(),
  updated_at       timestamptz    not null default now()
);

create unique index website_collections_slug_idx on website_collections (slug);

create trigger website_collections_updated_at
  before update on website_collections
  for each row execute function set_updated_at();

-- ─── Catalogue ───────────────────────────────────────────────────────────────

create table catalogue_categories (
  id              uuid        primary key default gen_random_uuid(),
  slug            text        not null unique,
  name            text        not null,
  description     text,
  parent_id       uuid        references catalogue_categories(id),
  cover_image_id  uuid        references media_library(id),
  sort_order      integer     not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger catalogue_categories_updated_at
  before update on catalogue_categories
  for each row execute function set_updated_at();

create table catalogue_items (
  id                  uuid           primary key default gen_random_uuid(),
  category_id         uuid           not null references catalogue_categories(id),
  slug                text           not null unique,
  model_number        text,
  name                text           not null,
  short_description   text,
  description         text,
  specifications      jsonb          not null default '{}',
  cover_image_id      uuid           references media_library(id),
  gallery_media_ids   uuid[]         not null default '{}',
  catalogue_pdf_id    uuid           references media_library(id),
  is_downloadable     boolean        not null default false,
  status              content_status not null default 'draft',
  sort_order          integer        not null default 0,
  created_by          uuid           references profiles(id),
  updated_by          uuid           references profiles(id),
  created_at          timestamptz    not null default now(),
  updated_at          timestamptz    not null default now()
);

create index catalogue_items_category_idx on catalogue_items (category_id, sort_order);
create index catalogue_items_status_idx   on catalogue_items (status);

create trigger catalogue_items_updated_at
  before update on catalogue_items
  for each row execute function set_updated_at();

-- ─── Website navigation ───────────────────────────────────────────────────────

create table website_navigation (
  id                uuid        primary key default gen_random_uuid(),
  label             text        not null,
  url               text        not null,
  parent_id         uuid        references website_navigation(id),
  sort_order        integer     not null default 0,
  is_visible        boolean     not null default true,
  opens_in_new_tab  boolean     not null default false,
  nav_group         text        not null default 'main'
                      check (nav_group in ('main', 'footer', 'mobile')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index website_nav_group_idx on website_navigation (nav_group, sort_order);

create trigger website_navigation_updated_at
  before update on website_navigation
  for each row execute function set_updated_at();

-- Seed default navigation
insert into website_navigation (label, url, sort_order, nav_group) values
  ('Projects',  '/projects',      10, 'main'),
  ('Expertise', '/expertise',     20, 'main'),
  ('Studio',    '/studio/about',  30, 'main'),
  ('Contact',   '/contact',       40, 'main');

-- ─── Website SEO settings ─────────────────────────────────────────────────────

create table website_seo (
  id                  uuid        primary key default gen_random_uuid(),
  page_path           text        not null unique,
  meta_title          text,
  meta_description    text,
  og_title            text,
  og_description      text,
  og_image_id         uuid        references media_library(id),
  canonical_url       text,
  robots_directive    text        not null default 'index, follow',
  structured_data     jsonb,
  created_by          uuid        references profiles(id),
  updated_by          uuid        references profiles(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger website_seo_updated_at
  before update on website_seo
  for each row execute function set_updated_at();

-- ─── RLS ──────────────────────────────────────────────────────────────────────

alter table media_folders         enable row level security;
alter table media_library         enable row level security;
alter table media_usage           enable row level security;
alter table website_pages         enable row level security;
alter table page_sections         enable row level security;
alter table website_collections   enable row level security;
alter table catalogue_categories  enable row level security;
alter table catalogue_items       enable row level security;
alter table website_navigation    enable row level security;
alter table website_seo           enable row level security;

-- Helper: is the caller an authenticated active staff member?
-- Reuses the function pattern from existing migrations.

-- ── Media folders ──────────────────────────────────────────────────────────
-- Public folders are readable anonymously; management requires staff.
create policy "media_folders_anon_read"
  on media_folders for select
  to anon
  using (is_public = true);

create policy "media_folders_staff_all"
  on media_folders for all
  to authenticated
  using (
    exists (select 1 from profiles p
            where p.id = auth.uid() and p.is_active = true)
  )
  with check (
    exists (select 1 from profiles p
            where p.id = auth.uid() and p.is_active = true)
  );

-- ── Media library ──────────────────────────────────────────────────────────
-- Anon can only read non-archived public media.
create policy "media_library_anon_read"
  on media_library for select
  to anon
  using (is_public = true and archived_at is null);

create policy "media_library_staff_read"
  on media_library for select
  to authenticated
  using (
    exists (select 1 from profiles p
            where p.id = auth.uid() and p.is_active = true)
  );

create policy "media_library_staff_insert"
  on media_library for insert
  to authenticated
  with check (
    exists (select 1 from profiles p
            where p.id = auth.uid() and p.is_active = true
              and p.role in ('admin','manager','operations'))
  );

create policy "media_library_staff_update"
  on media_library for update
  to authenticated
  using (
    exists (select 1 from profiles p
            where p.id = auth.uid() and p.is_active = true
              and p.role in ('admin','manager','operations'))
  );

-- No hard delete — only archive. Restrict even that to admin/manager.
create policy "media_library_admin_delete"
  on media_library for delete
  to authenticated
  using (
    exists (select 1 from profiles p
            where p.id = auth.uid() and p.is_active = true
              and p.role in ('admin','manager'))
  );

-- ── Media usage ────────────────────────────────────────────────────────────
create policy "media_usage_staff_all"
  on media_usage for all
  to authenticated
  using (
    exists (select 1 from profiles p
            where p.id = auth.uid() and p.is_active = true)
  )
  with check (
    exists (select 1 from profiles p
            where p.id = auth.uid() and p.is_active = true)
  );

-- ── Website pages ──────────────────────────────────────────────────────────
create policy "website_pages_anon_read"
  on website_pages for select
  to anon
  using (status = 'published');

create policy "website_pages_staff_read"
  on website_pages for select
  to authenticated
  using (
    exists (select 1 from profiles p
            where p.id = auth.uid() and p.is_active = true)
  );

create policy "website_pages_admin_write"
  on website_pages for insert
  to authenticated
  with check (
    exists (select 1 from profiles p
            where p.id = auth.uid() and p.is_active = true
              and p.role in ('admin','manager'))
  );

create policy "website_pages_admin_update"
  on website_pages for update
  to authenticated
  using (
    exists (select 1 from profiles p
            where p.id = auth.uid() and p.is_active = true
              and p.role in ('admin','manager'))
  );

-- ── Page sections ──────────────────────────────────────────────────────────
create policy "page_sections_anon_read"
  on page_sections for select
  to anon
  using (status = 'published' and is_visible = true);

create policy "page_sections_staff_read"
  on page_sections for select
  to authenticated
  using (
    exists (select 1 from profiles p
            where p.id = auth.uid() and p.is_active = true)
  );

create policy "page_sections_admin_write"
  on page_sections for insert
  to authenticated
  with check (
    exists (select 1 from profiles p
            where p.id = auth.uid() and p.is_active = true
              and p.role in ('admin','manager'))
  );

create policy "page_sections_admin_update"
  on page_sections for update
  to authenticated
  using (
    exists (select 1 from profiles p
            where p.id = auth.uid() and p.is_active = true
              and p.role in ('admin','manager'))
  );

create policy "page_sections_admin_delete"
  on page_sections for delete
  to authenticated
  using (
    exists (select 1 from profiles p
            where p.id = auth.uid() and p.is_active = true
              and p.role in ('admin','manager'))
  );

-- ── Collections ────────────────────────────────────────────────────────────
create policy "website_collections_anon_read"
  on website_collections for select
  to anon
  using (status = 'published');

create policy "website_collections_staff_read"
  on website_collections for select
  to authenticated
  using (
    exists (select 1 from profiles p
            where p.id = auth.uid() and p.is_active = true)
  );

create policy "website_collections_admin_write"
  on website_collections for all
  to authenticated
  using (
    exists (select 1 from profiles p
            where p.id = auth.uid() and p.is_active = true
              and p.role in ('admin','manager'))
  )
  with check (
    exists (select 1 from profiles p
            where p.id = auth.uid() and p.is_active = true
              and p.role in ('admin','manager'))
  );

-- ── Catalogue ──────────────────────────────────────────────────────────────
create policy "catalogue_categories_anon_read"
  on catalogue_categories for select
  to anon
  using (true);

create policy "catalogue_categories_staff_write"
  on catalogue_categories for all
  to authenticated
  using (
    exists (select 1 from profiles p
            where p.id = auth.uid() and p.is_active = true
              and p.role in ('admin','manager'))
  )
  with check (
    exists (select 1 from profiles p
            where p.id = auth.uid() and p.is_active = true
              and p.role in ('admin','manager'))
  );

create policy "catalogue_items_anon_read"
  on catalogue_items for select
  to anon
  using (status = 'published');

create policy "catalogue_items_staff_read"
  on catalogue_items for select
  to authenticated
  using (
    exists (select 1 from profiles p
            where p.id = auth.uid() and p.is_active = true)
  );

create policy "catalogue_items_admin_write"
  on catalogue_items for all
  to authenticated
  using (
    exists (select 1 from profiles p
            where p.id = auth.uid() and p.is_active = true
              and p.role in ('admin','manager'))
  )
  with check (
    exists (select 1 from profiles p
            where p.id = auth.uid() and p.is_active = true
              and p.role in ('admin','manager'))
  );

-- ── Navigation ─────────────────────────────────────────────────────────────
create policy "website_nav_anon_read"
  on website_navigation for select
  to anon
  using (is_visible = true);

create policy "website_nav_staff_read"
  on website_navigation for select
  to authenticated
  using (
    exists (select 1 from profiles p
            where p.id = auth.uid() and p.is_active = true)
  );

create policy "website_nav_admin_write"
  on website_navigation for all
  to authenticated
  using (
    exists (select 1 from profiles p
            where p.id = auth.uid() and p.is_active = true
              and p.role in ('admin','manager'))
  )
  with check (
    exists (select 1 from profiles p
            where p.id = auth.uid() and p.is_active = true
              and p.role in ('admin','manager'))
  );

-- ── SEO ────────────────────────────────────────────────────────────────────
create policy "website_seo_anon_read"
  on website_seo for select
  to anon
  using (true);

create policy "website_seo_admin_write"
  on website_seo for all
  to authenticated
  using (
    exists (select 1 from profiles p
            where p.id = auth.uid() and p.is_active = true
              and p.role in ('admin','manager'))
  )
  with check (
    exists (select 1 from profiles p
            where p.id = auth.uid() and p.is_active = true
              and p.role in ('admin','manager'))
  );

-- ─── Storage bucket ──────────────────────────────────────────────────────────
-- Website public media lives in 'website-media' (public bucket).
-- CRM private media lives in 'crm-media' (private bucket, signed URLs only).
-- Bucket creation requires the Supabase dashboard or CLI:
--   supabase storage create website-media --public
--   supabase storage create crm-media
-- Policies are managed via the Supabase dashboard for storage.

-- ─── RPC: publish_page_section ───────────────────────────────────────────────

create or replace function publish_page_section(p_section_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_role text;
begin
  select role into v_role from profiles where id = auth.uid() and is_active = true;
  if v_role not in ('admin','manager') then
    raise exception 'insufficient_privilege';
  end if;

  update page_sections
  set status = 'published',
      published_at = now(),
      updated_at = now()
  where id = p_section_id;
end;
$$;

-- ─── RPC: reorder_page_sections ──────────────────────────────────────────────

create or replace function reorder_page_sections(p_page_id uuid, p_ordered_ids uuid[])
returns void
language plpgsql
security definer
as $$
declare
  v_role text;
  v_id uuid;
  v_pos integer := 0;
begin
  select role into v_role from profiles where id = auth.uid() and is_active = true;
  if v_role not in ('admin','manager') then
    raise exception 'insufficient_privilege';
  end if;

  foreach v_id in array p_ordered_ids loop
    v_pos := v_pos + 10;
    update page_sections set sort_order = v_pos, updated_at = now()
    where id = v_id and page_id = p_page_id;
  end loop;
end;
$$;

grant execute on function publish_page_section(uuid) to authenticated;
grant execute on function reorder_page_sections(uuid, uuid[]) to authenticated;

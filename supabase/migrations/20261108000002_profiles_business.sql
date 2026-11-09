-- Migration: user profiles and business settings

-- ─── Profiles (extends auth.users) ───────────────────────────────────────────

create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text        not null,
  phone       text,
  role        app_role    not null default 'viewer',
  is_active   boolean     not null default true,
  avatar_path text,
  last_seen_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index profiles_role_active_idx on profiles (role, is_active);

create trigger profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- Auto-create a profile when a user signs up via Supabase Auth
create or replace function handle_new_user()
returns trigger language plpgsql security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      split_part(new.email, '@', 1),
      'Unknown'
    ),
    coalesce(
      (new.raw_user_meta_data ->> 'role')::public.app_role,
      'viewer'::public.app_role
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─── Business settings (single row per deployment) ────────────────────────────

create table business_settings (
  id                  uuid        primary key default gen_random_uuid(),
  business_name       text        not null,
  legal_name          text,
  gstin               text,
  default_currency    char(3)     not null default 'INR',
  timezone            text        not null default 'Asia/Kolkata',
  phone               text,
  email               citext,
  whatsapp_number     text,
  address             jsonb,
  logo_path           text,
  quotation_prefix    text        not null default 'QT',
  order_prefix        text        not null default 'ORD',
  invoice_prefix      text        not null default 'INV',
  default_tax_rate    numeric(7,4) not null default 0,
  quote_validity_days integer     not null default 15 check (quote_validity_days > 0),
  updated_by          uuid        references profiles(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger business_settings_updated_at
  before update on business_settings
  for each row execute function set_updated_at();

-- ─── Role-check helpers (security definer avoids recursive RLS) ───────────────

create or replace function get_my_role()
returns app_role language sql stable security definer
set search_path = ''
as $$
  select role from public.profiles
  where id = auth.uid() and is_active = true
  limit 1;
$$;

create or replace function is_active_staff()
returns boolean language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_active = true
  );
$$;

create or replace function is_admin_or_manager()
returns boolean language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and is_active = true
      and role in ('admin', 'manager')
  );
$$;

create or replace function is_admin()
returns boolean language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and is_active = true
      and role = 'admin'
  );
$$;

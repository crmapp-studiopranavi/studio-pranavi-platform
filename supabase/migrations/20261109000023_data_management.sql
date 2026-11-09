-- import_jobs: audit record for every import run
create table if not exists public.import_jobs (
  id            uuid primary key default gen_random_uuid(),
  entity_type   text not null check (entity_type in ('leads','customers','orders','projects','tasks')),
  actor_id      uuid not null references auth.users(id),
  status        text not null default 'pending'
                  check (status in ('pending','processing','done','failed')),
  total_rows    integer,
  valid_rows    integer,
  invalid_rows  integer,
  duplicate_rows integer,
  imported_rows integer,
  error_summary jsonb,
  created_at    timestamptz not null default now(),
  completed_at  timestamptz
);

alter table public.import_jobs enable row level security;

create policy "import_jobs staff own"
  on public.import_jobs for select
  using (actor_id = auth.uid() and (select is_active_staff()));

create policy "import_jobs admin all"
  on public.import_jobs for select
  using ((select get_my_role()) in ('admin','manager'));

create policy "import_jobs insert self"
  on public.import_jobs for insert
  with check (actor_id = auth.uid() and (select is_active_staff()));

create policy "import_jobs update self"
  on public.import_jobs for update
  using (actor_id = auth.uid() and (select is_active_staff()));

-- export_jobs: audit record for every export
create table if not exists public.export_jobs (
  id            uuid primary key default gen_random_uuid(),
  entity_type   text not null,
  actor_id      uuid not null references auth.users(id),
  format        text not null check (format in ('csv','xlsx')),
  scope         text not null check (scope in ('filtered','selected','all')),
  row_count     integer,
  created_at    timestamptz not null default now()
);

alter table public.export_jobs enable row level security;

create policy "export_jobs own"
  on public.export_jobs for select
  using (actor_id = auth.uid() and (select is_active_staff()));

create policy "export_jobs admin all"
  on public.export_jobs for select
  using ((select get_my_role()) in ('admin','manager'));

create policy "export_jobs insert"
  on public.export_jobs for insert
  with check (actor_id = auth.uid() and (select is_active_staff()));

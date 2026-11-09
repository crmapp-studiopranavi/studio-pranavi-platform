-- Create storage buckets for media library
-- website-media: public bucket for website-facing images/assets
-- crm-media: private bucket for internal/draft media

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'website-media',
    'website-media',
    true,
    52428800, -- 50 MB
    array[
      'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
      'video/mp4', 'video/webm',
      'application/pdf'
    ]
  ),
  (
    'crm-media',
    'crm-media',
    false,
    52428800,
    array[
      'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
      'video/mp4', 'video/webm',
      'application/pdf'
    ]
  )
on conflict (id) do nothing;

-- ── Storage RLS policies ──────────────────────────────────────────────────────

-- website-media: public read, staff write
create policy "website-media public read"
  on storage.objects for select
  using (bucket_id = 'website-media');

create policy "website-media staff upload"
  on storage.objects for insert
  with check (
    bucket_id = 'website-media'
    and (select is_active_staff())
  );

create policy "website-media staff update"
  on storage.objects for update
  using (
    bucket_id = 'website-media'
    and (select is_active_staff())
  );

create policy "website-media admin delete"
  on storage.objects for delete
  using (
    bucket_id = 'website-media'
    and (select get_my_role()) in ('admin', 'manager')
  );

-- crm-media: staff read/write, admin delete
create policy "crm-media staff read"
  on storage.objects for select
  using (
    bucket_id = 'crm-media'
    and (select is_active_staff())
  );

create policy "crm-media staff upload"
  on storage.objects for insert
  with check (
    bucket_id = 'crm-media'
    and (select is_active_staff())
  );

create policy "crm-media staff update"
  on storage.objects for update
  using (
    bucket_id = 'crm-media'
    and (select is_active_staff())
  );

create policy "crm-media admin delete"
  on storage.objects for delete
  using (
    bucket_id = 'crm-media'
    and (select get_my_role()) in ('admin', 'manager')
  );

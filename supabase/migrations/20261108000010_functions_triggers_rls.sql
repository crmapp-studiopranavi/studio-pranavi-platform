-- Migration: storage buckets, RLS policies, and public-submission RPC
-- This migration contains all access-control rules. Review carefully before deploying.

-- ─── Storage buckets ──────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('public-content', 'public-content', true,  52428800,  -- 50 MB
   array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']),
  ('lead-uploads',   'lead-uploads',   false, 10485760,  -- 10 MB
   array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('crm-documents',  'crm-documents',  false, 52428800,
   array['image/jpeg', 'image/png', 'image/webp', 'application/pdf',
         'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('avatars',        'avatars',        false, 5242880,   -- 5 MB
   array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Public-content: anyone can read; authenticated admin/manager can write
create policy "public_content_public_read"
  on storage.objects for select
  using (bucket_id = 'public-content');

create policy "public_content_staff_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'public-content'
    and public.is_admin_or_manager()
  );

create policy "public_content_staff_update"
  on storage.objects for update
  using (
    bucket_id = 'public-content'
    and public.is_admin_or_manager()
  );

create policy "public_content_staff_delete"
  on storage.objects for delete
  using (
    bucket_id = 'public-content'
    and public.is_admin_or_manager()
  );

-- Lead uploads: write during public submission (path enforced by RPC); staff read
create policy "lead_uploads_staff_read"
  on storage.objects for select
  using (
    bucket_id = 'lead-uploads'
    and public.is_active_staff()
  );

create policy "lead_uploads_staff_delete"
  on storage.objects for delete
  using (
    bucket_id = 'lead-uploads'
    and public.is_admin_or_manager()
  );

-- CRM documents: authenticated active staff
create policy "crm_docs_staff_all"
  on storage.objects for all
  using (
    bucket_id = 'crm-documents'
    and public.is_active_staff()
  );

-- Avatars: each user manages their own path
create policy "avatars_own_path"
  on storage.objects for all
  using (
    bucket_id = 'avatars'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ─── Enable RLS on all exposed tables ────────────────────────────────────────

alter table profiles           enable row level security;
alter table business_settings  enable row level security;
alter table services           enable row level security;
alter table portfolio_projects enable row level security;
alter table portfolio_images   enable row level security;
alter table testimonials       enable row level security;
alter table leads              enable row level security;
alter table customers          enable row level security;
alter table customer_contacts  enable row level security;
alter table addresses          enable row level security;
alter table activities         enable row level security;
alter table tasks              enable row level security;
alter table site_visits        enable row level security;
alter table measurements       enable row level security;
alter table quotes             enable row level security;
alter table quote_versions     enable row level security;
alter table quote_items        enable row level security;
alter table orders             enable row level security;
alter table projects           enable row level security;
alter table project_milestones enable row level security;
alter table installations      enable row level security;
alter table invoices           enable row level security;
alter table invoice_items      enable row level security;
alter table payments           enable row level security;
alter table attachments        enable row level security;
alter table notification_outbox enable row level security;
alter table audit_log          enable row level security;

-- ─── Profiles ─────────────────────────────────────────────────────────────────

create policy "profiles_own_read"
  on profiles for select
  using (auth.uid() = id);

create policy "profiles_own_update"
  on profiles for update
  using (auth.uid() = id);

create policy "profiles_staff_read"
  on profiles for select
  using (public.is_active_staff());

create policy "profiles_admin_full"
  on profiles for all
  using (public.is_admin());

-- ─── Business settings ────────────────────────────────────────────────────────

create policy "business_settings_staff_read"
  on business_settings for select
  using (public.is_active_staff());

create policy "business_settings_admin_write"
  on business_settings for all
  using (public.is_admin());

-- ─── Services: public can read published; admin/manager can manage ────────────

create policy "services_public_read"
  on services for select
  using (status = 'published' and archived_at is null);

create policy "services_staff_read"
  on services for select
  using (public.is_active_staff());

create policy "services_admin_write"
  on services for insert
  with check (public.is_admin_or_manager());

create policy "services_admin_update"
  on services for update
  using (public.is_admin_or_manager());

create policy "services_admin_delete"
  on services for delete
  using (public.is_admin());

-- ─── Portfolio projects ───────────────────────────────────────────────────────

create policy "portfolio_public_read"
  on portfolio_projects for select
  using (status = 'published' and archived_at is null);

create policy "portfolio_staff_read"
  on portfolio_projects for select
  using (public.is_active_staff());

create policy "portfolio_admin_write"
  on portfolio_projects for insert
  with check (public.is_admin_or_manager());

create policy "portfolio_admin_update"
  on portfolio_projects for update
  using (public.is_admin_or_manager());

create policy "portfolio_admin_delete"
  on portfolio_projects for delete
  using (public.is_admin());

-- ─── Portfolio images ─────────────────────────────────────────────────────────

create policy "portfolio_images_public_read"
  on portfolio_images for select
  using (
    exists (
      select 1 from portfolio_projects p
      where p.id = portfolio_images.project_id
        and p.status = 'published'
        and p.archived_at is null
    )
  );

create policy "portfolio_images_staff_read"
  on portfolio_images for select
  using (public.is_active_staff());

create policy "portfolio_images_admin_write"
  on portfolio_images for insert
  with check (public.is_admin_or_manager());

create policy "portfolio_images_admin_update"
  on portfolio_images for update
  using (public.is_admin_or_manager());

create policy "portfolio_images_admin_delete"
  on portfolio_images for delete
  using (public.is_admin_or_manager());

-- ─── Testimonials ─────────────────────────────────────────────────────────────

create policy "testimonials_public_read"
  on testimonials for select
  using (status = 'published');

create policy "testimonials_staff_read"
  on testimonials for select
  using (public.is_active_staff());

create policy "testimonials_admin_write"
  on testimonials for all
  using (public.is_admin_or_manager());

-- ─── Leads: no public read; staff access by role ─────────────────────────────

-- No public select policy — anonymous cannot read leads after submission
create policy "leads_staff_read"
  on leads for select
  using (public.is_active_staff());

create policy "leads_sales_write"
  on leads for insert
  with check (public.is_active_staff());

create policy "leads_staff_update"
  on leads for update
  using (public.is_active_staff());

create policy "leads_admin_delete"
  on leads for delete
  using (public.is_admin());

-- ─── Customers ────────────────────────────────────────────────────────────────

create policy "customers_staff_read"
  on customers for select
  using (public.is_active_staff());

create policy "customers_staff_write"
  on customers for insert
  with check (public.is_active_staff());

create policy "customers_staff_update"
  on customers for update
  using (public.is_active_staff());

create policy "customers_admin_delete"
  on customers for delete
  using (public.is_admin());

-- ─── Customer contacts ────────────────────────────────────────────────────────

create policy "contacts_staff_all"
  on customer_contacts for all
  using (public.is_active_staff());

-- ─── Addresses ────────────────────────────────────────────────────────────────

create policy "addresses_staff_all"
  on addresses for all
  using (public.is_active_staff());

-- ─── Activities ───────────────────────────────────────────────────────────────

create policy "activities_staff_read"
  on activities for select
  using (public.is_active_staff());

create policy "activities_staff_insert"
  on activities for insert
  with check (public.is_active_staff());

-- Activities are append-only — no update or delete for regular staff
create policy "activities_admin_delete"
  on activities for delete
  using (public.is_admin());

-- ─── Tasks ────────────────────────────────────────────────────────────────────

create policy "tasks_staff_all"
  on tasks for all
  using (public.is_active_staff());

-- ─── Site visits ──────────────────────────────────────────────────────────────

create policy "site_visits_staff_all"
  on site_visits for all
  using (public.is_active_staff());

-- ─── Measurements ─────────────────────────────────────────────────────────────

create policy "measurements_staff_all"
  on measurements for all
  using (public.is_active_staff());

-- ─── Quotes ───────────────────────────────────────────────────────────────────

create policy "quotes_staff_read"
  on quotes for select
  using (public.is_active_staff());

create policy "quotes_sales_write"
  on quotes for insert
  with check (
    public.is_active_staff()
    and public.get_my_role() in ('admin', 'manager', 'sales')
  );

create policy "quotes_sales_update"
  on quotes for update
  using (
    public.is_active_staff()
    and public.get_my_role() in ('admin', 'manager', 'sales')
  );

create policy "quotes_admin_delete"
  on quotes for delete
  using (public.is_admin());

-- ─── Quote versions ───────────────────────────────────────────────────────────

create policy "quote_versions_staff_read"
  on quote_versions for select
  using (public.is_active_staff());

create policy "quote_versions_sales_write"
  on quote_versions for insert
  with check (
    public.is_active_staff()
    and public.get_my_role() in ('admin', 'manager', 'sales')
  );

-- No update policy — sent versions are immutable (enforced by trigger too)
create policy "quote_versions_admin_update"
  on quote_versions for update
  using (public.is_admin());

-- ─── Quote items ──────────────────────────────────────────────────────────────

create policy "quote_items_staff_read"
  on quote_items for select
  using (public.is_active_staff());

create policy "quote_items_sales_write"
  on quote_items for insert
  with check (
    public.is_active_staff()
    and public.get_my_role() in ('admin', 'manager', 'sales')
  );

create policy "quote_items_sales_update"
  on quote_items for update
  using (
    public.is_active_staff()
    and public.get_my_role() in ('admin', 'manager', 'sales')
  );

-- ─── Orders ───────────────────────────────────────────────────────────────────

create policy "orders_staff_read"
  on orders for select
  using (public.is_active_staff());

create policy "orders_sales_ops_write"
  on orders for insert
  with check (
    public.is_active_staff()
    and public.get_my_role() in ('admin', 'manager', 'sales', 'operations')
  );

create policy "orders_ops_update"
  on orders for update
  using (
    public.is_active_staff()
    and public.get_my_role() in ('admin', 'manager', 'sales', 'operations')
  );

create policy "orders_admin_delete"
  on orders for delete
  using (public.is_admin());

-- ─── Projects ─────────────────────────────────────────────────────────────────

create policy "projects_staff_read"
  on projects for select
  using (public.is_active_staff());

create policy "projects_ops_write"
  on projects for insert
  with check (
    public.is_active_staff()
    and public.get_my_role() in ('admin', 'manager', 'operations')
  );

create policy "projects_ops_update"
  on projects for update
  using (
    public.is_active_staff()
    and public.get_my_role() in ('admin', 'manager', 'operations')
  );

create policy "projects_admin_delete"
  on projects for delete
  using (public.is_admin());

-- ─── Project milestones and installations ─────────────────────────────────────

create policy "milestones_staff_all"
  on project_milestones for all
  using (public.is_active_staff());

create policy "installations_staff_all"
  on installations for all
  using (public.is_active_staff());

-- ─── Invoices ─────────────────────────────────────────────────────────────────

create policy "invoices_staff_read"
  on invoices for select
  using (public.is_active_staff());

create policy "invoices_manager_write"
  on invoices for insert
  with check (
    public.is_active_staff()
    and public.get_my_role() in ('admin', 'manager')
  );

create policy "invoices_manager_update"
  on invoices for update
  using (
    public.is_active_staff()
    and public.get_my_role() in ('admin', 'manager')
  );

create policy "invoices_admin_delete"
  on invoices for delete
  using (public.is_admin());

-- ─── Invoice items ────────────────────────────────────────────────────────────

create policy "invoice_items_staff_all"
  on invoice_items for all
  using (public.is_active_staff());

-- ─── Payments ─────────────────────────────────────────────────────────────────

create policy "payments_staff_read"
  on payments for select
  using (public.is_active_staff());

create policy "payments_manager_write"
  on payments for insert
  with check (
    public.is_active_staff()
    and public.get_my_role() in ('admin', 'manager')
  );

-- Payments are never deleted; reversal is modeled via reversed_at + activity
create policy "payments_admin_update"
  on payments for update
  using (public.is_admin());

-- ─── Attachments ──────────────────────────────────────────────────────────────

create policy "attachments_staff_read"
  on attachments for select
  using (public.is_active_staff());

create policy "attachments_staff_insert"
  on attachments for insert
  with check (public.is_active_staff());

create policy "attachments_admin_delete"
  on attachments for delete
  using (public.is_admin_or_manager());

-- ─── Notification outbox ──────────────────────────────────────────────────────

create policy "outbox_manager_read"
  on notification_outbox for select
  using (public.is_admin_or_manager());

create policy "outbox_staff_insert"
  on notification_outbox for insert
  with check (public.is_active_staff());

-- ─── Audit log ────────────────────────────────────────────────────────────────

create policy "audit_log_manager_read"
  on audit_log for select
  using (public.is_admin_or_manager());

-- No insert policy for audit_log — inserts come only from security-definer triggers
-- No update/delete policies

-- ─── Public lead submission RPC ───────────────────────────────────────────────
-- SECURITY DEFINER with fixed search_path. Returns only a non-sensitive receipt ID.
-- The calling user must NOT have direct insert access to the leads table.

create or replace function submit_public_lead(
  p_full_name             text,
  p_email                 text    default null,
  p_phone                 text    default null,
  p_whatsapp_number       text    default null,
  p_preferred_contact_method text default null,
  p_location_text         text    default null,
  p_service_id            uuid    default null,
  p_budget_min_minor      bigint  default null,
  p_budget_max_minor      bigint  default null,
  p_project_description   text    default null,
  p_consent_text_version  text    default null,
  p_source                text    default 'website'
) returns jsonb language plpgsql security definer
set search_path = ''
as $$
declare
  v_lead_id uuid;
begin
  -- Server-side validation
  if trim(coalesce(p_full_name, '')) = '' then
    raise exception 'full_name is required' using errcode = 'P0002';
  end if;

  if p_email is null and p_phone is null and p_whatsapp_number is null then
    raise exception 'At least one contact method is required' using errcode = 'P0002';
  end if;

  if trim(coalesce(p_project_description, '')) = '' then
    raise exception 'project_description is required' using errcode = 'P0002';
  end if;

  if length(p_full_name) > 200 then
    raise exception 'full_name too long' using errcode = 'P0002';
  end if;

  if p_budget_min_minor is not null and p_budget_min_minor < 0 then
    raise exception 'budget_min_minor must be non-negative' using errcode = 'P0002';
  end if;

  if p_budget_max_minor is not null and p_budget_min_minor is not null
     and p_budget_max_minor < p_budget_min_minor then
    raise exception 'budget_max_minor must be >= budget_min_minor' using errcode = 'P0002';
  end if;

  -- Verify service_id exists and is published (if provided)
  if p_service_id is not null then
    if not exists (
      select 1 from public.services
      where id = p_service_id and status = 'published' and archived_at is null
    ) then
      -- Silently clear invalid service_id rather than leaking service IDs
      p_service_id := null;
    end if;
  end if;

  insert into public.leads (
    full_name,
    email,
    phone,
    whatsapp_number,
    preferred_contact_method,
    location_text,
    service_id,
    budget_min_minor,
    budget_max_minor,
    project_description,
    consent_text_version,
    consented_at,
    source,
    status,
    priority
  ) values (
    trim(p_full_name),
    lower(trim(p_email)),
    trim(p_phone),
    trim(p_whatsapp_number),
    p_preferred_contact_method::public.contact_method,
    trim(p_location_text),
    p_service_id,
    p_budget_min_minor,
    p_budget_max_minor,
    trim(p_project_description),
    p_consent_text_version,
    case when p_consent_text_version is not null then now() else null end,
    coalesce(p_source, 'website'),
    'new',
    'medium'
  )
  returning id into v_lead_id;

  -- Create initial activity record
  insert into public.activities (
    activity_type, subject, body, lead_id, actor_id, metadata
  ) values (
    'system',
    'Lead submitted',
    'New enquiry received from ' || p_source,
    v_lead_id,
    null,
    jsonb_build_object('source', p_source, 'ip', current_setting('request.headers', true)::jsonb ->> 'x-forwarded-for')
  );

  -- Return only a non-sensitive receipt identifier — not the lead UUID
  return jsonb_build_object('receipt_id', encode(sha256(v_lead_id::text::bytea), 'hex'));

exception
  when others then
    raise;
end;
$$;

-- Grant execute to the anon role so the public website can call this
grant execute on function submit_public_lead(
  text, text, text, text, text, text, uuid, bigint, bigint, text, text, text
) to anon;

-- Revoke direct table insert from anon and authenticated (use the RPC)
revoke insert on leads from anon;

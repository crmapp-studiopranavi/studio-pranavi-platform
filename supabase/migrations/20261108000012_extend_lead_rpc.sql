-- Migration: extend submit_public_lead to accept attachment paths
-- Drop the old 12-parameter overload first (exact parameter types matter in PostgreSQL)

drop function if exists public.submit_public_lead(
  text, text, text, text, text, text, uuid, bigint, bigint, text, text, text
);

create or replace function submit_public_lead(
  p_full_name             text,
  p_email                 text      default null,
  p_phone                 text      default null,
  p_whatsapp_number       text      default null,
  p_preferred_contact_method text   default null,
  p_location_text         text      default null,
  p_service_id            uuid      default null,
  p_budget_min_minor      bigint    default null,
  p_budget_max_minor      bigint    default null,
  p_project_description   text      default null,
  p_consent_text_version  text      default null,
  p_source                text      default 'website',
  p_attachment_paths      text[]    default null
) returns jsonb language plpgsql security definer
set search_path = ''
as $$
declare
  v_lead_id uuid;
  v_path    text;
  v_fname   text;
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

  -- Validate attachment paths count (max 5)
  if p_attachment_paths is not null and array_length(p_attachment_paths, 1) > 5 then
    raise exception 'Too many attachments (max 5)' using errcode = 'P0002';
  end if;

  -- Verify service_id exists and is published (if provided)
  if p_service_id is not null then
    if not exists (
      select 1 from public.services
      where id = p_service_id and status = 'published' and archived_at is null
    ) then
      p_service_id := null;
    end if;
  end if;

  insert into public.leads (
    full_name, email, phone, whatsapp_number, preferred_contact_method,
    location_text, service_id, budget_min_minor, budget_max_minor,
    project_description, consent_text_version, consented_at, source, status, priority
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
    'New enquiry received from ' || coalesce(p_source, 'website'),
    v_lead_id,
    null,
    jsonb_build_object(
      'source', p_source,
      'attachment_count', coalesce(array_length(p_attachment_paths, 1), 0)
    )
  );

  -- Insert attachment records for uploaded files
  if p_attachment_paths is not null then
    foreach v_path in array p_attachment_paths
    loop
      -- Validate the path is in the allowed pending/ prefix
      if v_path not like 'pending/%' then
        raise exception 'Invalid attachment path' using errcode = 'P0002';
      end if;

      v_fname := split_part(v_path, '/', array_length(string_to_array(v_path, '/'), 1));

      insert into public.attachments (
        bucket, storage_path, original_filename, content_type, size_bytes,
        visibility, lead_id, uploaded_by
      ) values (
        'lead-uploads',
        v_path,
        v_fname,
        'application/octet-stream',
        1,
        'private',
        v_lead_id,
        null
      );
    end loop;
  end if;

  return jsonb_build_object('receipt_id', encode(sha256(v_lead_id::text::bytea), 'hex'));

exception
  when others then
    raise;
end;
$$;

-- Grant execute to the anon role on the new 13-parameter overload
grant execute on function submit_public_lead(
  text, text, text, text, text, text, uuid, bigint, bigint, text, text, text, text[]
) to anon;

-- Ensure insert remains revoked for anon
revoke insert on leads from anon;

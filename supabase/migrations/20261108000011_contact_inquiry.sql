-- Storage policy: anon can upload to lead-uploads/pending/
create policy "lead_uploads_public_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'lead-uploads'
    and auth.role() = 'anon'
    and name like 'pending/%'
  );

-- Contact inquiry submission function (no auth required)
create or replace function submit_contact_inquiry(
  p_name    text,
  p_email   text    default null,
  p_phone   text    default null,
  p_message text    default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name    text;
  v_email   text;
  v_phone   text;
  v_message text;
begin
  -- Trim inputs
  v_name    := trim(p_name);
  v_email   := trim(p_email);
  v_phone   := trim(p_phone);
  v_message := trim(p_message);

  -- Validate required fields
  if v_name is null or char_length(v_name) < 2 then
    raise exception 'Name must be at least 2 characters' using errcode = 'CIQV1';
  end if;
  if char_length(v_name) > 200 then
    raise exception 'Name is too long' using errcode = 'CIQV2';
  end if;
  if v_email is not null and char_length(v_email) > 320 then
    raise exception 'Email address is too long' using errcode = 'CIQV3';
  end if;
  if v_phone is not null and char_length(v_phone) > 30 then
    raise exception 'Phone number is too long' using errcode = 'CIQV4';
  end if;
  if v_message is not null and char_length(v_message) > 5000 then
    raise exception 'Message is too long' using errcode = 'CIQV5';
  end if;
  if v_email is null and v_phone is null then
    raise exception 'Please provide at least an email or phone number' using errcode = 'CIQV6';
  end if;

  -- Queue notification
  insert into public.notification_outbox (
    channel,
    payload,
    created_at
  ) values (
    'contact_inquiry',
    jsonb_build_object(
      'name',    v_name,
      'email',   v_email,
      'phone',   v_phone,
      'message', v_message,
      'submitted_at', now()
    ),
    now()
  );

  return jsonb_build_object('success', true);
end;
$$;

grant execute on function submit_contact_inquiry(text, text, text, text) to anon;

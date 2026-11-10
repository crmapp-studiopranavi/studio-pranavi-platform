-- Admin RPCs for user management (delete, update email, list with email)

-- Returns all profiles joined with their auth email, admin only
create or replace function public.admin_list_users()
returns table (
  id          uuid,
  full_name   text,
  phone       text,
  email       text,
  role        app_role,
  is_active   boolean,
  avatar_path text,
  last_seen_at timestamptz,
  created_at  timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Permission denied';
  end if;

  return query
  select
    p.id,
    p.full_name,
    p.phone,
    u.email::text,
    p.role,
    p.is_active,
    p.avatar_path,
    p.last_seen_at,
    p.created_at
  from public.profiles p
  join auth.users u on u.id = p.id
  order by p.full_name;
end;
$$;

-- Update a user's email in auth.users, admin only
create or replace function public.admin_update_user_email(target_id uuid, new_email text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Permission denied';
  end if;
  if target_id = auth.uid() then
    raise exception 'Cannot change your own email via admin panel';
  end if;

  update auth.users set email = new_email, email_confirmed_at = now()
  where id = target_id;
end;
$$;

-- Delete a user from auth.users (cascades to profiles), admin only
create or replace function public.admin_delete_user(target_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Permission denied';
  end if;
  if target_id = auth.uid() then
    raise exception 'Cannot delete your own account';
  end if;

  delete from auth.users where id = target_id;
end;
$$;

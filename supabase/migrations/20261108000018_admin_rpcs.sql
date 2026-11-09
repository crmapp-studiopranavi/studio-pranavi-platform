-- Migration: admin RPCs for user management

create or replace function get_staff_list()
returns table(
  id           uuid,
  full_name    text,
  email        text,
  phone        text,
  role         public.app_role,
  is_active    boolean,
  last_seen_at timestamptz,
  created_at   timestamptz
)
language plpgsql security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;
  return query
    select
      p.id,
      p.full_name,
      u.email::text,
      p.phone,
      p.role,
      p.is_active,
      p.last_seen_at,
      p.created_at
    from public.profiles p
    join auth.users u on u.id = p.id
    order by p.created_at asc;
end;
$$;

grant execute on function get_staff_list() to authenticated;

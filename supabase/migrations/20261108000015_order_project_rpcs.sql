-- Phase 6: Order and Project RPCs

-- create_order_from_quote: idempotent, requires accepted quote
create or replace function public.create_order_from_quote(p_quote_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_order_id uuid;
  v_quote record;
  v_version record;
  v_order_number text;
  v_order record;
begin
  if not public.is_active_staff() then
    raise exception 'Authentication required' using errcode = 'PGRST301';
  end if;
  if public.get_my_role() not in ('admin', 'manager', 'sales') then
    raise exception 'Insufficient permissions: sales role required' using errcode = '42501';
  end if;

  -- Idempotency: return existing order if already created
  select id into v_order_id from orders where quote_id = p_quote_id;
  if found then
    return jsonb_build_object('order_id', v_order_id);
  end if;

  -- Validate quote
  select * into v_quote from quotes where id = p_quote_id;
  if not found then
    raise exception 'Quote not found' using errcode = 'P0002';
  end if;
  if v_quote.status <> 'accepted' then
    raise exception 'Quote must be accepted before creating an order' using errcode = 'P0001';
  end if;

  -- Get accepted version totals
  select * into v_version from quote_versions where id = v_quote.current_version_id;
  if not found then
    raise exception 'Quote version not found' using errcode = 'P0002';
  end if;

  -- Generate order number
  v_order_number := public.next_order_number();

  -- Create the order
  insert into orders (
    order_number, customer_id, quote_id, accepted_quote_version_id,
    status, order_date, currency, total_minor,
    owner_id, created_by, updated_by
  ) values (
    v_order_number, v_quote.customer_id, p_quote_id, v_quote.current_version_id,
    'confirmed', current_date, 'INR', v_version.total_minor,
    v_quote.owner_id, auth.uid(), auth.uid()
  )
  returning * into v_order;

  -- Activity log
  insert into activities (
    activity_type, subject, customer_id, quote_id, order_id, actor_id, occurred_at
  ) values (
    'system',
    'Order ' || v_order_number || ' created from quote ' || v_quote.quote_number,
    v_quote.customer_id, p_quote_id, v_order.id, auth.uid(), now()
  );

  return jsonb_build_object('order_id', v_order.id);
end;
$$;
grant execute on function public.create_order_from_quote(uuid) to authenticated;

-- create_project: idempotent when order_id provided
create or replace function public.create_project(
  p_name text,
  p_customer_id uuid,
  p_order_id uuid default null,
  p_manager_id uuid default null,
  p_scope text default null,
  p_start_date date default null,
  p_target_completion_date date default null
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_project_id uuid;
  v_project_number text;
  v_project record;
begin
  if not public.is_active_staff() then
    raise exception 'Authentication required' using errcode = 'PGRST301';
  end if;
  if public.get_my_role() not in ('admin', 'manager', 'operations') then
    raise exception 'Insufficient permissions: operations role required' using errcode = '42501';
  end if;

  -- Idempotency: return existing project if already linked to order
  if p_order_id is not null then
    select id into v_project_id from projects where order_id = p_order_id;
    if found then
      select project_number into v_project_number from projects where id = v_project_id;
      return jsonb_build_object('project_id', v_project_id, 'project_number', v_project_number);
    end if;
  end if;

  -- Generate project number
  v_project_number := public.next_project_number();

  -- Create the project
  insert into projects (
    project_number, name, customer_id, order_id, status,
    project_manager_id, scope, start_date, target_completion_date
  ) values (
    v_project_number, p_name, p_customer_id, p_order_id, 'planned',
    p_manager_id, p_scope, p_start_date, p_target_completion_date
  )
  returning * into v_project;

  -- Touch the order's updated_at if linked
  if p_order_id is not null then
    update orders set updated_at = now() where id = p_order_id;
  end if;

  -- Activity log on customer
  insert into activities (
    activity_type, subject, customer_id, project_id, actor_id, occurred_at
  ) values (
    'system',
    'Project ' || v_project_number || ' created',
    p_customer_id, v_project.id, auth.uid(), now()
  );

  return jsonb_build_object('project_id', v_project.id, 'project_number', v_project.project_number);
end;
$$;
grant execute on function public.create_project(text, uuid, uuid, uuid, text, date, date) to authenticated;

-- Migration: convert_lead_to_customer — idempotent SECURITY DEFINER RPC

create or replace function public.convert_lead_to_customer(
  p_lead_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role      app_role;
  v_lead      leads%rowtype;
  v_customer  customers%rowtype;
  v_contact   customer_contacts%rowtype;
  v_actor_id  uuid := auth.uid();
begin
  -- Auth check
  if not public.is_active_staff() then
    raise exception 'Unauthorized' using errcode = 'PGRST301';
  end if;

  v_role := public.get_my_role();
  if v_role not in ('admin', 'manager', 'sales') then
    raise exception 'Insufficient role to convert leads' using errcode = 'PGRST301';
  end if;

  -- Lock lead row
  select * into v_lead
  from leads
  where id = p_lead_id
  for update;

  if not found then
    raise exception 'Lead not found' using errcode = 'P0002';
  end if;

  -- Idempotent: already converted
  if v_lead.converted_customer_id is not null then
    return jsonb_build_object('customer_id', v_lead.converted_customer_id);
  end if;

  -- Create customer
  insert into customers (
    display_name,
    customer_type,
    owner_id,
    source_lead_id,
    created_by,
    updated_by
  ) values (
    v_lead.full_name,
    'individual',
    v_lead.owner_id,
    p_lead_id,
    v_actor_id,
    v_actor_id
  )
  returning * into v_customer;

  -- Create primary contact from lead contact data
  insert into customer_contacts (
    customer_id,
    full_name,
    email,
    phone,
    whatsapp_number,
    preferred_contact_method,
    is_primary
  ) values (
    v_customer.id,
    v_lead.full_name,
    v_lead.email,
    v_lead.phone,
    v_lead.whatsapp_number,
    v_lead.preferred_contact_method,
    true
  )
  returning * into v_contact;

  -- Set primary contact on customer
  update customers
  set primary_contact_id = v_contact.id
  where id = v_customer.id;

  -- Stamp lead as converted
  update leads
  set
    converted_customer_id = v_customer.id,
    status = case
      when status not in ('won', 'lost', 'archived') then 'won'
      else status
    end,
    updated_at = now()
  where id = p_lead_id;

  -- Activity on lead
  insert into activities (activity_type, subject, lead_id, customer_id, actor_id, occurred_at)
  values (
    'status_change',
    'Lead converted to customer #' || v_customer.customer_number,
    p_lead_id,
    v_customer.id,
    v_actor_id,
    now()
  );

  -- Activity on customer
  insert into activities (activity_type, subject, customer_id, lead_id, actor_id, occurred_at)
  values (
    'system',
    'Customer created from lead #' || v_lead.lead_number,
    v_customer.id,
    p_lead_id,
    v_actor_id,
    now()
  );

  return jsonb_build_object('customer_id', v_customer.id);
end;
$$;

-- Grant to authenticated users only (RLS inside the function handles role enforcement)
grant execute on function public.convert_lead_to_customer(uuid) to authenticated;

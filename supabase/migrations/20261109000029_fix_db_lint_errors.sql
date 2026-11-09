-- Fix 1: get_sales_metrics — quotes.valid_until doesn't exist; join quote_versions instead
create or replace function get_sales_metrics()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_me  uuid := auth.uid();
begin
  return jsonb_build_object(
    'my_leads',           (select count(*) from public.leads
                           where owner_id = v_me
                             and status not in ('won','lost','archived')),
    'overdue_followups',  (select count(*) from public.leads
                           where owner_id = v_me
                             and status not in ('won','lost','archived')
                             and next_follow_up_at < now()),
    'site_visits_pending',(select count(*) from public.site_visits
                           where assigned_to = v_me
                             and status in ('scheduled','confirmed')
                             and scheduled_start >= current_date),
    'quotes_awaiting',    (select count(*) from public.quotes q
                           join public.leads l on l.id = q.lead_id
                           where q.status in ('sent','viewed')
                             and l.owner_id = v_me),
    'quotes_expiring',    (select count(*) from public.quotes q2
                           join public.quote_versions qv on qv.id = q2.current_version_id
                           join public.leads l2 on l2.id = q2.lead_id
                           where q2.status in ('sent','viewed')
                             and qv.valid_until <= current_date + 7
                             and l2.owner_id = v_me),
    'pipeline_leads',     (select count(*) from public.leads
                           where owner_id = v_me
                             and status in ('contacted','site_visit_scheduled',
                               'site_visit_completed','quote_drafting',
                               'quote_sent','negotiation'))
  );
end;
$$;

grant execute on function get_sales_metrics() to authenticated;

-- Fix 2: handle_order_confirmed — use ARRAY[]::uuid[] instead of '{}' to avoid implicit text cast
create or replace function public.handle_order_confirmed(p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_rule      public.automation_rules%rowtype;
  v_order     public.orders%rowtype;
  v_project   public.projects%rowtype;
  v_templates jsonb;
  v_tpl       jsonb;
  v_sort      integer := 0;
  v_ms_ids    uuid[] := ARRAY[]::uuid[];
  v_ms_id     uuid;
begin
  select * into v_rule
  from public.automation_rules
  where rule_key = 'order_confirmed' and enabled;

  if not found then
    return jsonb_build_object('skipped', 'rule_disabled');
  end if;

  select * into v_order
  from public.orders
  where id = (p_payload->>'order_id')::uuid;

  if not found then
    return jsonb_build_object('skipped', 'order_not_found');
  end if;

  select * into v_project
  from public.projects
  where order_id = v_order.id
  limit 1;

  if not found then
    return jsonb_build_object('skipped', 'no_project_for_order');
  end if;

  v_templates := coalesce(v_rule.config->'milestone_templates', '[]'::jsonb);

  for v_tpl in select * from jsonb_array_elements(v_templates)
  loop
    insert into public.project_milestones (
      project_id, name, status, due_date, sort_order
    ) values (
      v_project.id,
      v_tpl->>'name',
      'pending',
      current_date + ((v_tpl->>'offset_days')::integer),
      v_sort
    )
    returning id into v_ms_id;
    v_ms_ids := array_append(v_ms_ids, v_ms_id);
    v_sort := v_sort + 1;
  end loop;

  return jsonb_build_object('milestone_ids', to_jsonb(v_ms_ids), 'project_id', v_project.id);
end;
$$;

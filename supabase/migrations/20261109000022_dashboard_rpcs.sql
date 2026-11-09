-- ── Owner/Manager dashboard metrics ──────────────────────────────────────────
create or replace function get_manager_metrics()
returns jsonb language plpgsql security definer
set search_path = ''
as $$
begin
  if public.get_my_role() not in ('admin', 'manager') then
    raise exception 'permission denied' using errcode = 'insufficient_privilege';
  end if;
  return jsonb_build_object(
    'new_leads',          (select count(*) from public.leads where status = 'new'),
    'followups_due',      (select count(*) from public.leads
                           where status not in ('won','lost','archived')
                             and next_follow_up_at <= now()),
    'quotes_awaiting',    (select count(*) from public.quotes
                           where status in ('sent','viewed')),
    'active_orders',      (select count(*) from public.orders
                           where status not in ('completed','cancelled')
                             and archived_at is null),
    'active_projects',    (select count(*) from public.projects
                           where status in ('active','planned')
                             and archived_at is null),
    'delayed_projects',   (select count(*) from public.projects
                           where status = 'active'
                             and archived_at is null
                             and target_completion_date < current_date
                             and actual_completion_date is null),
    'installs_this_week', (select count(*) from public.installations
                           where scheduled_start >= now()
                             and scheduled_start <= now() + interval '7 days'
                             and status in ('scheduled','in_progress')),
    'invoiced_minor',     (select coalesce(sum(total_minor),0) from public.invoices
                           where status not in ('void','draft')
                             and archived_at is null),
    'received_minor',     (select coalesce(sum(amount_paid_minor),0) from public.invoices
                           where archived_at is null),
    'outstanding_minor',  (select coalesce(sum(balance_minor),0) from public.invoices
                           where status in ('issued','partially_paid','overdue')
                             and archived_at is null)
  );
end;
$$;

grant execute on function get_manager_metrics() to authenticated;

-- ── Sales dashboard metrics ───────────────────────────────────────────────────
create or replace function get_sales_metrics()
returns jsonb language plpgsql security definer
set search_path = ''
as $$
declare v_me uuid := auth.uid();
begin
  if public.get_my_role() not in ('admin', 'manager', 'sales') then
    raise exception 'permission denied' using errcode = 'insufficient_privilege';
  end if;
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
                           join public.leads l2 on l2.id = q2.lead_id
                           where q2.status in ('sent','viewed')
                             and q2.valid_until <= current_date + 7
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

-- ── Operations dashboard metrics ─────────────────────────────────────────────
create or replace function get_operations_metrics()
returns jsonb language plpgsql security definer
set search_path = ''
as $$
begin
  if public.get_my_role() not in ('admin', 'manager', 'operations') then
    raise exception 'permission denied' using errcode = 'insufficient_privilege';
  end if;
  return jsonb_build_object(
    'orders_in_production',   (select count(*) from public.orders
                               where status = 'production'
                                 and archived_at is null),
    'blocked_projects',       (select count(*) from public.projects
                               where status = 'blocked'
                                 and archived_at is null),
    'overdue_milestones',     (select count(*) from public.project_milestones
                               where due_date < current_date
                                 and status in ('pending','in_progress','blocked')),
    'measurements_pending',   (select count(*) from public.site_visits
                               where status = 'completed'
                                 and id not in (
                                   select distinct site_visit_id from public.measurements
                                   where site_visit_id is not null
                                 )),
    'upcoming_installations', (select count(*) from public.installations
                               where scheduled_start >= now()
                                 and scheduled_start <= now() + interval '7 days'
                                 and status in ('scheduled','in_progress'))
  );
end;
$$;

grant execute on function get_operations_metrics() to authenticated;

-- ── Finance dashboard metrics ─────────────────────────────────────────────────
create or replace function get_finance_metrics()
returns jsonb language plpgsql security definer
set search_path = ''
as $$
begin
  if public.get_my_role() not in ('admin', 'manager') then
    raise exception 'permission denied' using errcode = 'insufficient_privilege';
  end if;
  return jsonb_build_object(
    'invoices_issued',    (select count(*) from public.invoices
                           where status in ('issued','partially_paid')
                             and archived_at is null),
    'overdue_invoices',   (select count(*) from public.invoices
                           where status = 'overdue'
                             and archived_at is null),
    'payments_received_minor', (select coalesce(sum(amount_minor),0)
                           from public.payments
                           where status = 'cleared'
                             and payment_date >= date_trunc('month', current_date)),
    'outstanding_minor',  (select coalesce(sum(balance_minor),0) from public.invoices
                           where status in ('issued','partially_paid','overdue')
                             and archived_at is null),
    'ageing_30_minor',    (select coalesce(sum(balance_minor),0) from public.invoices
                           where status in ('issued','partially_paid','overdue')
                             and issue_date <= current_date - 30
                             and archived_at is null),
    'ageing_60_minor',    (select coalesce(sum(balance_minor),0) from public.invoices
                           where status in ('issued','partially_paid','overdue')
                             and issue_date <= current_date - 60
                             and archived_at is null)
  );
end;
$$;

grant execute on function get_finance_metrics() to authenticated;

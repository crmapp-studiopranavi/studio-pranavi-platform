-- ── get_sales_report ────────────────────────────────────────────────────────
-- Roles: admin, manager, sales (sales sees own leads only)
-- All filter params are nullable; null = no filter

create or replace function get_sales_report(
  p_from       date  default null,
  p_to         date  default null,
  p_source     text  default null,
  p_service_id uuid  default null,
  p_owner_id   uuid  default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role              text := public.get_my_role();
  v_me                uuid := auth.uid();
  v_effective_owner   uuid;
begin
  if v_role not in ('admin','manager','sales') then
    raise exception 'permission denied' using errcode = 'insufficient_privilege';
  end if;

  -- Sales users are scoped to their own leads regardless of p_owner_id
  v_effective_owner := case when v_role = 'sales' then v_me else p_owner_id end;

  return jsonb_build_object(

    -- ── Summary ──────────────────────────────────────────────────────────────
    'summary', (
      select jsonb_build_object(
        'total_leads',             count(*),
        'won_leads',               count(*) filter (where l.status = 'won'),
        'lost_leads',              count(*) filter (where l.status = 'lost'),
        'conversion_rate',
          case when count(*) filter (where l.status in ('won','lost')) > 0
               then round(
                 count(*) filter (where l.status = 'won')::numeric /
                 count(*) filter (where l.status in ('won','lost'))::numeric * 100, 1)
               else null end,
        'avg_first_response_days', (
          select round(avg(
            extract(epoch from (fa.first_activity - l2.created_at)) / 86400.0
          )::numeric, 1)
          from public.leads l2
          join lateral (
            select min(a.occurred_at) as first_activity
            from public.activities a
            where a.lead_id = l2.id
          ) fa on fa.first_activity is not null
          where l2.archived_at is null
            and (p_from is null or l2.created_at::date >= p_from)
            and (p_to   is null or l2.created_at::date <= p_to)
            and (p_source is null or l2.source = p_source)
            and (p_service_id is null or l2.service_id = p_service_id)
            and (v_effective_owner is null or l2.owner_id = v_effective_owner)
        ),
        'avg_lead_to_quote_days',  (
          select round(avg(
            extract(epoch from (fq.first_quote - l3.created_at)) / 86400.0
          )::numeric, 1)
          from public.leads l3
          join lateral (
            select min(q.created_at) as first_quote
            from public.quotes q
            where q.lead_id = l3.id
          ) fq on fq.first_quote is not null
          where l3.archived_at is null
            and (p_from is null or l3.created_at::date >= p_from)
            and (p_to   is null or l3.created_at::date <= p_to)
            and (p_source is null or l3.source = p_source)
            and (p_service_id is null or l3.service_id = p_service_id)
            and (v_effective_owner is null or l3.owner_id = v_effective_owner)
        )
      )
      from public.leads l
      where l.archived_at is null
        and (p_from is null or l.created_at::date >= p_from)
        and (p_to   is null or l.created_at::date <= p_to)
        and (p_source is null or l.source = p_source)
        and (p_service_id is null or l.service_id = p_service_id)
        and (v_effective_owner is null or l.owner_id = v_effective_owner)
    ),

    -- ── Leads by month ────────────────────────────────────────────────────────
    'leads_by_month', (
      select coalesce(jsonb_agg(row order by row.month), '[]'::jsonb)
      from (
        select to_char(date_trunc('month', created_at), 'YYYY-MM') as month,
               count(*) as count
        from public.leads
        where archived_at is null
          and (p_from is null or created_at::date >= p_from)
          and (p_to   is null or created_at::date <= p_to)
          and (p_source is null or source = p_source)
          and (p_service_id is null or service_id = p_service_id)
          and (v_effective_owner is null or owner_id = v_effective_owner)
        group by date_trunc('month', created_at)
        order by month
      ) row
    ),

    -- ── Leads by source ──────────────────────────────────────────────────────
    'leads_by_source', (
      select coalesce(jsonb_agg(row order by row.count desc), '[]'::jsonb)
      from (
        select source,
               count(*) as count,
               count(*) filter (where status = 'won') as won
        from public.leads
        where archived_at is null
          and (p_from is null or created_at::date >= p_from)
          and (p_to   is null or created_at::date <= p_to)
          and (p_source is null or source = p_source)
          and (p_service_id is null or service_id = p_service_id)
          and (v_effective_owner is null or owner_id = v_effective_owner)
        group by source
        order by count desc
      ) row
    ),

    -- ── Leads by service ─────────────────────────────────────────────────────
    'leads_by_service', (
      select coalesce(jsonb_agg(row order by row.count desc), '[]'::jsonb)
      from (
        select coalesce(s.title, 'Unspecified') as service,
               count(l.id) as count,
               count(l.id) filter (where l.status = 'won') as won
        from public.leads l
        left join public.services s on s.id = l.service_id
        where l.archived_at is null
          and (p_from is null or l.created_at::date >= p_from)
          and (p_to   is null or l.created_at::date <= p_to)
          and (p_source is null or l.source = p_source)
          and (v_effective_owner is null or l.owner_id = v_effective_owner)
        group by coalesce(s.title, 'Unspecified')
        order by count desc
      ) row
    ),

    -- ── Pipeline ─────────────────────────────────────────────────────────────
    'pipeline', (
      select coalesce(jsonb_agg(row), '[]'::jsonb)
      from (
        select status::text, count(*) as count
        from public.leads
        where archived_at is null
          and status not in ('won','lost','archived')
          and (p_source is null or source = p_source)
          and (p_service_id is null or service_id = p_service_id)
          and (v_effective_owner is null or owner_id = v_effective_owner)
        group by status
      ) row
    ),

    -- ── Won/lost reasons ─────────────────────────────────────────────────────
    'won_lost_reasons', (
      select coalesce(jsonb_agg(row order by row.count desc), '[]'::jsonb)
      from (
        select coalesce(lost_reason, 'No reason given') as reason,
               count(*) as count
        from public.leads
        where archived_at is null
          and status = 'lost'
          and (p_from is null or created_at::date >= p_from)
          and (p_to   is null or created_at::date <= p_to)
          and (p_source is null or source = p_source)
          and (p_service_id is null or service_id = p_service_id)
          and (v_effective_owner is null or owner_id = v_effective_owner)
        group by lost_reason
        order by count desc
      ) row
    ),

    -- ── Sales performance per owner (admin/manager only) ─────────────────────
    'sales_performance', (
      case when v_role in ('admin','manager') then (
        select coalesce(jsonb_agg(row order by row.total desc), '[]'::jsonb)
        from (
          select p.full_name as owner,
                 count(l.id) as total,
                 count(l.id) filter (where l.status = 'won') as won,
                 count(l.id) filter (where l.status = 'lost') as lost,
                 case when count(l.id) filter (where l.status in ('won','lost')) > 0
                      then round(
                        count(l.id) filter (where l.status = 'won')::numeric /
                        count(l.id) filter (where l.status in ('won','lost'))::numeric * 100, 1)
                      else null end as conversion_rate
          from public.leads l
          join public.profiles p on p.id = l.owner_id
          where l.archived_at is null
            and l.owner_id is not null
            and (p_from is null or l.created_at::date >= p_from)
            and (p_to   is null or l.created_at::date <= p_to)
            and (p_source is null or l.source = p_source)
            and (p_service_id is null or l.service_id = p_service_id)
          group by l.owner_id, p.full_name
          order by total desc
        ) row
      ) else '[]'::jsonb end
    )
  );
end;
$$;

grant execute on function get_sales_report(date,date,text,uuid,uuid) to authenticated;


-- ── get_operations_report ──────────────────────────────────────────────────
-- Roles: admin, manager, operations

create or replace function get_operations_report(
  p_from           date  default null,
  p_to             date  default null,
  p_project_status text  default null,
  p_owner_id       uuid  default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text := public.get_my_role();
begin
  if v_role not in ('admin','manager','operations') then
    raise exception 'permission denied' using errcode = 'insufficient_privilege';
  end if;

  return jsonb_build_object(

    -- ── Summary ──────────────────────────────────────────────────────────────
    'summary', jsonb_build_object(
      'active_projects',           (
        select count(*) from public.projects
        where archived_at is null and status in ('active','planned')
          and (p_project_status is null or status::text = p_project_status)
          and (p_owner_id is null or project_manager_id = p_owner_id)
          and (p_from is null or created_at::date >= p_from)
          and (p_to   is null or created_at::date <= p_to)
      ),
      'delayed_projects',          (
        select count(*) from public.projects
        where archived_at is null
          and status = 'active'
          and target_completion_date < current_date
          and actual_completion_date is null
          and (p_owner_id is null or project_manager_id = p_owner_id)
      ),
      'overdue_milestones',        (
        select count(*) from public.project_milestones pm
        join public.projects pr on pr.id = pm.project_id
        where pm.due_date < current_date
          and pm.status in ('pending','in_progress','blocked')
          and pr.archived_at is null
          and (p_owner_id is null or pr.project_manager_id = p_owner_id)
      ),
      'upcoming_installations_30d',(
        select count(*) from public.installations i
        join public.projects pr on pr.id = i.project_id
        where i.scheduled_start >= now()
          and i.scheduled_start <= now() + interval '30 days'
          and i.status in ('scheduled','in_progress')
          and pr.archived_at is null
          and (p_owner_id is null or pr.project_manager_id = p_owner_id)
      ),
      'avg_order_to_completion_days', (
        select round(avg(
          extract(epoch from (p2.actual_completion_date::timestamptz - o.order_date::timestamptz)) / 86400.0
        )::numeric, 1)
        from public.orders o
        join public.projects p2 on p2.order_id = o.id
        where p2.actual_completion_date is not null
          and o.archived_at is null
          and p2.archived_at is null
          and (p_from is null or o.order_date >= p_from)
          and (p_to   is null or o.order_date <= p_to)
      ),
      'installation_total',        (
        select count(*) from public.installations i
        join public.projects pr on pr.id = i.project_id
        where pr.archived_at is null
          and (p_from is null or i.scheduled_start::date >= p_from)
          and (p_to   is null or i.scheduled_start::date <= p_to)
          and (p_owner_id is null or pr.project_manager_id = p_owner_id)
      ),
      'installation_completed',    (
        select count(*) from public.installations i
        join public.projects pr on pr.id = i.project_id
        where i.status = 'completed'
          and pr.archived_at is null
          and (p_from is null or i.scheduled_start::date >= p_from)
          and (p_to   is null or i.scheduled_start::date <= p_to)
          and (p_owner_id is null or pr.project_manager_id = p_owner_id)
      )
    ),

    -- ── Projects by status ───────────────────────────────────────────────────
    'projects_by_status', (
      select coalesce(jsonb_agg(row order by row.count desc), '[]'::jsonb)
      from (
        select status::text, count(*) as count
        from public.projects
        where archived_at is null
          and (p_project_status is null or status::text = p_project_status)
          and (p_owner_id is null or project_manager_id = p_owner_id)
          and (p_from is null or created_at::date >= p_from)
          and (p_to   is null or created_at::date <= p_to)
        group by status
        order by count desc
      ) row
    ),

    -- ── Delayed projects list (up to 20) ─────────────────────────────────────
    'delayed_projects_list', (
      select coalesce(jsonb_agg(row order by row.days_delayed desc), '[]'::jsonb)
      from (
        select pr.project_number,
               pr.name,
               pr.status::text,
               pr.target_completion_date,
               (current_date - pr.target_completion_date) as days_delayed,
               coalesce(c.display_name, '') as customer
        from public.projects pr
        left join public.customers c on c.id = pr.customer_id
        where pr.archived_at is null
          and pr.status = 'active'
          and pr.target_completion_date < current_date
          and pr.actual_completion_date is null
          and (p_owner_id is null or pr.project_manager_id = p_owner_id)
        order by days_delayed desc
        limit 20
      ) row
    ),

    -- ── Overdue milestones list (up to 20) ───────────────────────────────────
    'overdue_milestones_list', (
      select coalesce(jsonb_agg(row order by row.days_overdue desc), '[]'::jsonb)
      from (
        select pr.name as project_name,
               pr.project_number,
               pm.name as milestone_name,
               pm.due_date,
               (current_date - pm.due_date) as days_overdue,
               pm.status::text
        from public.project_milestones pm
        join public.projects pr on pr.id = pm.project_id
        where pm.due_date < current_date
          and pm.status in ('pending','in_progress','blocked')
          and pr.archived_at is null
          and (p_owner_id is null or pr.project_manager_id = p_owner_id)
        order by days_overdue desc
        limit 20
      ) row
    ),

    -- ── Upcoming installations (next 30 days) ────────────────────────────────
    'upcoming_installations', (
      select coalesce(jsonb_agg(row order by row.scheduled_start), '[]'::jsonb)
      from (
        select pr.name as project_name,
               pr.project_number,
               i.scheduled_start,
               i.scheduled_end,
               coalesce(i.assigned_team, '') as assigned_team,
               i.status
        from public.installations i
        join public.projects pr on pr.id = i.project_id
        where i.scheduled_start >= now()
          and i.scheduled_start <= now() + interval '30 days'
          and i.status in ('scheduled','in_progress')
          and pr.archived_at is null
          and (p_owner_id is null or pr.project_manager_id = p_owner_id)
        order by i.scheduled_start
        limit 50
      ) row
    )
  );
end;
$$;

grant execute on function get_operations_report(date,date,text,uuid) to authenticated;


-- ── get_finance_report ──────────────────────────────────────────────────────
-- Roles: admin, manager

create or replace function get_finance_report(
  p_from        date  default null,
  p_to          date  default null,
  p_customer_id uuid  default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text := public.get_my_role();
begin
  if v_role not in ('admin','manager') then
    raise exception 'permission denied' using errcode = 'insufficient_privilege';
  end if;

  return jsonb_build_object(

    -- ── Summary ──────────────────────────────────────────────────────────────
    'summary', jsonb_build_object(
      'quoted_value_minor',   (
        select coalesce(sum(qv.total_minor), 0)
        from public.quotes q
        join public.quote_versions qv on qv.id = q.current_version_id
        where q.archived_at is null
          and q.status in ('sent','viewed','accepted')
          and (p_customer_id is null or q.customer_id = p_customer_id)
          and (p_from is null or q.created_at::date >= p_from)
          and (p_to   is null or q.created_at::date <= p_to)
      ),
      'order_value_minor',    (
        select coalesce(sum(total_minor), 0)
        from public.orders
        where archived_at is null
          and status not in ('cancelled')
          and (p_customer_id is null or customer_id = p_customer_id)
          and (p_from is null or order_date >= p_from)
          and (p_to   is null or order_date <= p_to)
      ),
      'invoiced_minor',       (
        select coalesce(sum(total_minor), 0)
        from public.invoices
        where archived_at is null
          and status not in ('draft','void')
          and (p_customer_id is null or customer_id = p_customer_id)
          and (p_from is null or issue_date >= p_from)
          and (p_to   is null or issue_date <= p_to)
      ),
      'received_minor',       (
        select coalesce(sum(p.amount_minor), 0)
        from public.payments p
        join public.invoices inv on inv.id = p.invoice_id
        where p.status = 'cleared'
          and inv.archived_at is null
          and (p_customer_id is null or p.customer_id = p_customer_id)
          and (p_from is null or p.payment_date >= p_from)
          and (p_to   is null or p.payment_date <= p_to)
      ),
      'outstanding_minor',    (
        select coalesce(sum(balance_minor), 0)
        from public.invoices
        where archived_at is null
          and status in ('issued','partially_paid','overdue')
          and (p_customer_id is null or customer_id = p_customer_id)
      ),
      'overdue_minor',        (
        select coalesce(sum(balance_minor), 0)
        from public.invoices
        where archived_at is null
          and status = 'overdue'
          and (p_customer_id is null or customer_id = p_customer_id)
      )
    ),

    -- ── Monthly received payments ─────────────────────────────────────────────
    'monthly_received', (
      select coalesce(jsonb_agg(row order by row.month), '[]'::jsonb)
      from (
        select to_char(date_trunc('month', p.payment_date::timestamptz), 'YYYY-MM') as month,
               coalesce(sum(p.amount_minor), 0) as amount_minor
        from public.payments p
        join public.invoices inv on inv.id = p.invoice_id
        where p.status = 'cleared'
          and inv.archived_at is null
          and (p_customer_id is null or p.customer_id = p_customer_id)
          and (p_from is null or p.payment_date >= p_from)
          and (p_to   is null or p.payment_date <= p_to)
        group by date_trunc('month', p.payment_date::timestamptz)
        order by month
      ) row
    ),

    -- ── Ageing buckets ────────────────────────────────────────────────────────
    'ageing_buckets', (
      select coalesce(jsonb_agg(row), '[]'::jsonb)
      from (
        select
          bucket_label,
          count(*) as count,
          coalesce(sum(balance_minor), 0) as amount_minor
        from (
          select
            balance_minor,
            case
              when due_date >= current_date then 'current'
              when current_date - due_date <= 30 then '1–30 days'
              when current_date - due_date <= 60 then '31–60 days'
              when current_date - due_date <= 90 then '61–90 days'
              else '90+ days'
            end as bucket_label,
            case
              when due_date >= current_date then 1
              when current_date - due_date <= 30 then 2
              when current_date - due_date <= 60 then 3
              when current_date - due_date <= 90 then 4
              else 5
            end as bucket_order
          from public.invoices
          where archived_at is null
            and status in ('issued','partially_paid','overdue')
            and (p_customer_id is null or customer_id = p_customer_id)
        ) buckets
        group by bucket_label, bucket_order
        order by bucket_order
      ) row
    ),

    -- ── Top 10 customers by outstanding balance ───────────────────────────────
    'top_customers_outstanding', (
      select coalesce(jsonb_agg(row order by row.outstanding_minor desc), '[]'::jsonb)
      from (
        select c.display_name as customer,
               sum(inv.balance_minor) as outstanding_minor
        from public.invoices inv
        join public.customers c on c.id = inv.customer_id
        where inv.archived_at is null
          and inv.status in ('issued','partially_paid','overdue')
          and (p_customer_id is null or inv.customer_id = p_customer_id)
        group by c.id, c.display_name
        order by outstanding_minor desc
        limit 10
      ) row
    )
  );
end;
$$;

grant execute on function get_finance_report(date,date,uuid) to authenticated;

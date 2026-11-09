# Phase 10H: Business Reporting — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the stub ReportsPage with professional, role-authorized Sales / Operations / Finance reports backed by server-side PostgreSQL RPCs, with date + filter support and CSV export.

**Architecture:** Three `security definer` RPCs (`get_sales_report`, `get_operations_report`, `get_finance_report`) compute every aggregate inside the database under role guards. The CRM ReportsPage is a tabbed container; each tab fetches its RPC via TanStack Query, renders summary stat cards and breakdown tables, and offers a CSV export from the fetched data using papaparse. All filter state lives in the page (URL query params for shareability). A null RPC arg means "no filter applied".

**Tech Stack:** PostgreSQL RPCs, Supabase JS v2, React 18 + TanStack Query v5, Tailwind + shadcn/ui, papaparse (client-side CSV from RPC data), Vitest.

---

## Existing schema facts (must read before implementing)

- `leads`: `id, source, status (lead_status enum), owner_id → profiles, service_id → services, lost_reason, created_at, archived_at`
  - status enum: `new, contacted, site_visit_scheduled, site_visit_completed, quote_drafting, quote_sent, negotiation, won, lost, archived`
- `activities`: `id, activity_type, occurred_at, actor_id, lead_id, customer_id, created_at`
- `quotes`: `id, lead_id, customer_id, current_version_id, status (quote_status enum), owner_id, accepted_at, created_at, archived_at`
- `quote_versions`: `id, quote_id, version_number, total_minor, sent_at`
- `orders`: `id, customer_id, quote_id, status (order_status enum), order_date, target_completion_date, total_minor, owner_id, created_at, archived_at`
- `projects`: `id, order_id, customer_id, name, status (project_status enum), start_date, target_completion_date, actual_completion_date, project_manager_id, created_at, archived_at`
- `project_milestones`: `id, project_id, name, status (pending/in_progress/blocked/done), due_date, completed_at, assigned_to, created_at`
- `installations`: `id, project_id, scheduled_start, scheduled_end, assigned_team, lead_installer_id, status, signed_off_at, created_at`
- `invoices`: `id, customer_id, order_id, status (invoice_status enum), issue_date, due_date, total_minor, amount_paid_minor, balance_minor, created_at, archived_at`
- `payments`: `id, invoice_id, customer_id, amount_minor, payment_date, status (payment_status enum), created_at`
- `services`: `id, title, slug, status`
- `profiles`: `id, full_name, role (app_role enum), is_active`
- `customers`: `id, display_name, owner_id`
- Helper: `public.get_my_role()`, `public.is_active_staff()`, `public.is_admin_or_manager()`
- All monetary values in `_minor` (smallest currency unit, default INR paise)

---

## File Structure

**New migrations:**

- `supabase/migrations/20261109000027_reporting_rpcs.sql` — 3 reporting RPCs

**Replace (rewrite completely):**

- `apps/crm/src/pages/ReportsPage.tsx` → becomes the tab container (default export preserved for router)

**New CRM pages:**

- `apps/crm/src/pages/reports/SalesReport.tsx`
- `apps/crm/src/pages/reports/OperationsReport.tsx`
- `apps/crm/src/pages/reports/FinanceReport.tsx`
- `apps/crm/src/pages/reports/ReportFilters.tsx` — shared filter bar

**New tests:**

- `apps/crm/src/lib/__tests__/reporting.test.ts`

**Modified:**

- `packages/types/src/database.types.ts` — add 3 new RPC function type entries

---

## Task 1: DB Migration 27 — Reporting RPCs

**Files:**

- Create: `supabase/migrations/20261109000027_reporting_rpcs.sql`

- [ ] **Step 1: Write the migration**

```sql
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

    -- ── Leads by month (last 24 months unless date-filtered) ─────────────────
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

    -- ── Pipeline (active leads by status) ────────────────────────────────────
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
          group by p.full_name
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
          and (p_from is null or created_at::date >= p_from)
          and (p_to   is null or created_at::date <= p_to)
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
        -- Sum of current version totals for quotes in sent/viewed/accepted
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

    -- ── Ageing buckets (all outstanding, ignoring date filter) ───────────────
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
        group by c.display_name
        order by outstanding_minor desc
        limit 10
      ) row
    )
  );
end;
$$;

grant execute on function get_finance_report(date,date,uuid) to authenticated;
```

- [ ] **Step 2: Apply migration locally**

```bash
npx supabase db reset --local 2>/dev/null || npx supabase migration up --local 2>/dev/null || npx supabase db push --local 2>/dev/null || echo "check supabase CLI"
```

Or just verify the SQL parses cleanly — the migration will be applied to production with `supabase db push`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20261109000027_reporting_rpcs.sql
git commit -m "feat(10H): reporting RPCs — get_sales_report, get_operations_report, get_finance_report"
```

---

## Task 2: TypeScript types for reporting RPCs

**Files:**

- Modify: `packages/types/src/database.types.ts`

Read the current `Functions` section in `packages/types/src/database.types.ts`. After `get_unread_notification_count`, add:

- [ ] **Step 1: Add RPC type entries**

```typescript
      get_sales_report: {
        Args: {
          p_from?: string | null;
          p_to?: string | null;
          p_source?: string | null;
          p_service_id?: string | null;
          p_owner_id?: string | null;
        };
        Returns: Json;
      };
      get_operations_report: {
        Args: {
          p_from?: string | null;
          p_to?: string | null;
          p_project_status?: string | null;
          p_owner_id?: string | null;
        };
        Returns: Json;
      };
      get_finance_report: {
        Args: {
          p_from?: string | null;
          p_to?: string | null;
          p_customer_id?: string | null;
        };
        Returns: Json;
      };
```

Add these entries before the closing `};` of `Functions`.

- [ ] **Step 2: Add shared TypeScript interfaces file**

Create `apps/crm/src/lib/reports/report-types.ts`:

```typescript
// Shared types for reporting RPCs

export interface SalesReportSummary {
  total_leads: number;
  won_leads: number;
  lost_leads: number;
  conversion_rate: number | null;
  avg_first_response_days: number | null;
  avg_lead_to_quote_days: number | null;
}

export interface SalesReport {
  summary: SalesReportSummary;
  leads_by_month: Array<{ month: string; count: number }>;
  leads_by_source: Array<{ source: string; count: number; won: number }>;
  leads_by_service: Array<{ service: string; count: number; won: number }>;
  pipeline: Array<{ status: string; count: number }>;
  won_lost_reasons: Array<{ reason: string; count: number }>;
  sales_performance: Array<{
    owner: string;
    total: number;
    won: number;
    lost: number;
    conversion_rate: number | null;
  }>;
}

export interface OperationsReportSummary {
  active_projects: number;
  delayed_projects: number;
  overdue_milestones: number;
  upcoming_installations_30d: number;
  avg_order_to_completion_days: number | null;
  installation_total: number;
  installation_completed: number;
}

export interface OperationsReport {
  summary: OperationsReportSummary;
  projects_by_status: Array<{ status: string; count: number }>;
  delayed_projects_list: Array<{
    project_number: string;
    name: string;
    status: string;
    target_completion_date: string;
    days_delayed: number;
    customer: string;
  }>;
  overdue_milestones_list: Array<{
    project_name: string;
    project_number: string;
    milestone_name: string;
    due_date: string;
    days_overdue: number;
    status: string;
  }>;
  upcoming_installations: Array<{
    project_name: string;
    project_number: string;
    scheduled_start: string;
    scheduled_end: string | null;
    assigned_team: string;
    status: string;
  }>;
}

export interface FinanceReportSummary {
  quoted_value_minor: number;
  order_value_minor: number;
  invoiced_minor: number;
  received_minor: number;
  outstanding_minor: number;
  overdue_minor: number;
}

export interface FinanceReport {
  summary: FinanceReportSummary;
  monthly_received: Array<{ month: string; amount_minor: number }>;
  ageing_buckets: Array<{ bucket_label: string; count: number; amount_minor: number }>;
  top_customers_outstanding: Array<{ customer: string; outstanding_minor: number }>;
}

export interface ReportFiltersState {
  from: string; // ISO date string YYYY-MM-DD or ''
  to: string; // ISO date string YYYY-MM-DD or ''
  source: string; // lead source or ''
  serviceId: string;
  ownerId: string;
  projectStatus: string;
  customerId: string;
}
```

- [ ] **Step 3: Typecheck**

```bash
pnpm --filter types typecheck
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add packages/types/src/database.types.ts apps/crm/src/lib/reports/report-types.ts
git commit -m "feat(10H): TypeScript types for reporting RPCs + SalesReport/OperationsReport/FinanceReport interfaces"
```

---

## Task 3: ReportFilters component

**Files:**

- Create: `apps/crm/src/pages/reports/ReportFilters.tsx`

- [ ] **Step 1: Create ReportFilters.tsx**

```tsx
// apps/crm/src/pages/reports/ReportFilters.tsx
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { ReportFiltersState } from '@/lib/reports/report-types';

interface Props {
  filters: ReportFiltersState;
  onChange: (f: ReportFiltersState) => void;
  /** Which optional filter groups to show */
  show: {
    source?: boolean;
    service?: boolean;
    owner?: boolean;
    projectStatus?: boolean;
    customer?: boolean;
  };
}

interface SelectOption {
  value: string;
  label: string;
}

const LEAD_STATUSES = [
  'new',
  'contacted',
  'site_visit_scheduled',
  'site_visit_completed',
  'quote_drafting',
  'quote_sent',
  'negotiation',
  'won',
  'lost',
  'archived',
];
const PROJECT_STATUSES = ['planned', 'active', 'blocked', 'on_hold', 'completed', 'cancelled'];

export function ReportFilters({ filters, onChange, show }: Props) {
  const [services, setServices] = useState<SelectOption[]>([]);
  const [owners, setOwners] = useState<SelectOption[]>([]);
  const [customers, setCustomers] = useState<SelectOption[]>([]);

  useEffect(() => {
    if (show.service) {
      supabase
        .from('services')
        .select('id, title')
        .eq('status', 'published')
        .order('title')
        .then(({ data }) =>
          setServices((data ?? []).map((s) => ({ value: s.id, label: s.title })))
        );
    }
    if (show.owner) {
      supabase
        .from('profiles')
        .select('id, full_name')
        .eq('is_active', true)
        .order('full_name')
        .then(({ data }) =>
          setOwners((data ?? []).map((p) => ({ value: p.id, label: p.full_name })))
        );
    }
    if (show.customer) {
      supabase
        .from('customers')
        .select('id, display_name')
        .order('display_name')
        .limit(200)
        .then(({ data }) =>
          setCustomers((data ?? []).map((c) => ({ value: c.id, label: c.display_name })))
        );
    }
  }, [show.service, show.owner, show.customer]);

  function set(key: keyof ReportFiltersState, value: string) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="flex flex-wrap gap-3 rounded-lg border bg-card px-4 py-3">
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">From</label>
        <input
          type="date"
          value={filters.from}
          onChange={(e) => set('from', e.target.value)}
          className="rounded border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">To</label>
        <input
          type="date"
          value={filters.to}
          onChange={(e) => set('to', e.target.value)}
          className="rounded border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {show.source && (
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-muted-foreground">Source</label>
          <select
            value={filters.source}
            onChange={(e) => set('source', e.target.value)}
            className="rounded border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All sources</option>
            {[
              'website',
              'referral',
              'social_media',
              'cold_outreach',
              'exhibition',
              'partner',
              'other',
            ].map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
      )}

      {show.service && services.length > 0 && (
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-muted-foreground">Service</label>
          <select
            value={filters.serviceId}
            onChange={(e) => set('serviceId', e.target.value)}
            className="rounded border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All services</option>
            {services.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {show.owner && owners.length > 0 && (
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-muted-foreground">Owner</label>
          <select
            value={filters.ownerId}
            onChange={(e) => set('ownerId', e.target.value)}
            className="rounded border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All owners</option>
            {owners.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {show.projectStatus && (
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-muted-foreground">Status</label>
          <select
            value={filters.projectStatus}
            onChange={(e) => set('projectStatus', e.target.value)}
            className="rounded border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All statuses</option>
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
      )}

      {show.customer && customers.length > 0 && (
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-muted-foreground">Customer</label>
          <select
            value={filters.customerId}
            onChange={(e) => set('customerId', e.target.value)}
            className="rounded border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All customers</option>
            {customers.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <button
        onClick={() =>
          onChange({
            from: '',
            to: '',
            source: '',
            serviceId: '',
            ownerId: '',
            projectStatus: '',
            customerId: '',
          })
        }
        className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        Clear filters
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter crm typecheck 2>&1 | tail -5
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add apps/crm/src/pages/reports/ReportFilters.tsx
git commit -m "feat(10H): ReportFilters component — date range + source/service/owner/status/customer"
```

---

## Task 4: SalesReport component

**Files:**

- Create: `apps/crm/src/pages/reports/SalesReport.tsx`

- [ ] **Step 1: Create SalesReport.tsx**

```tsx
// apps/crm/src/pages/reports/SalesReport.tsx
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ReportFilters } from './ReportFilters';
import type {
  SalesReport as SalesReportData,
  ReportFiltersState,
} from '@/lib/reports/report-types';
import Papa from 'papaparse';
import { downloadBlob } from '@/lib/data-export/export-engine';

interface Props {
  filters: ReportFiltersState;
  onFiltersChange: (f: ReportFiltersState) => void;
}

function formatPct(n: number | null): string {
  if (n == null) return '—';
  return n.toFixed(1) + '%';
}

function formatDays(n: number | null): string {
  if (n == null) return '—';
  return n.toFixed(1) + ' days';
}

export function SalesReport({ filters, onFiltersChange }: Props) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['sales-report', filters],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_sales_report', {
        p_from: filters.from || null,
        p_to: filters.to || null,
        p_source: filters.source || null,
        p_service_id: filters.serviceId || null,
        p_owner_id: filters.ownerId || null,
      });
      if (error) throw new Error(error.message);
      return data as SalesReportData;
    },
    staleTime: 60_000,
  });

  function exportLeadsBySource() {
    if (!data) return;
    const rows = data.leads_by_source.map((r) => ({
      Source: r.source,
      'Total Leads': r.count,
      Won: r.won,
      'Conversion %': data.summary.total_leads > 0 ? ((r.won / r.count) * 100).toFixed(1) : '0',
    }));
    const csv = Papa.unparse(rows);
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), 'sales_by_source.csv');
  }

  function exportSalesPerformance() {
    if (!data) return;
    const rows = data.sales_performance.map((r) => ({
      Owner: r.owner,
      Total: r.total,
      Won: r.won,
      Lost: r.lost,
      'Conversion %': r.conversion_rate != null ? r.conversion_rate.toFixed(1) : '—',
    }));
    const csv = Papa.unparse(rows);
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), 'sales_performance.csv');
  }

  if (isLoading)
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  if (error)
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
        {(error as Error).message}
      </div>
    );
  if (!data) return null;

  const s = data.summary;

  return (
    <div className="space-y-6">
      <ReportFilters
        filters={filters}
        onChange={onFiltersChange}
        show={{ source: true, service: true, owner: true }}
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: 'Total Leads', value: s.total_leads.toString() },
          { label: 'Won', value: s.won_leads.toString() },
          { label: 'Lost', value: s.lost_leads.toString() },
          { label: 'Conversion', value: formatPct(s.conversion_rate) },
          { label: 'Avg First Response', value: formatDays(s.avg_first_response_days) },
          { label: 'Avg Lead→Quote', value: formatDays(s.avg_lead_to_quote_days) },
        ].map((c) => (
          <div key={c.label} className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Leads by month */}
      {data.leads_by_month.length > 0 && (
        <section className="rounded-lg border bg-card">
          <div className="border-b px-4 py-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Leads by Month</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Month</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                    New Leads
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.leads_by_month.map((r) => (
                  <tr key={r.month} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-2">{r.month}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{r.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Leads by source */}
      <section className="rounded-lg border bg-card">
        <div className="border-b px-4 py-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Leads by Source</h2>
          <button onClick={exportLeadsBySource} className="text-xs text-primary hover:underline">
            Export CSV
          </button>
        </div>
        {data.leads_by_source.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground text-center">No data</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Source</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">Leads</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">Won</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">Conv %</th>
                </tr>
              </thead>
              <tbody>
                {data.leads_by_source.map((r) => (
                  <tr key={r.source} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-2 capitalize">{r.source.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{r.count}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{r.won}</td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {r.count > 0 ? ((r.won / r.count) * 100).toFixed(1) + '%' : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Leads by service */}
      {data.leads_by_service.length > 0 && (
        <section className="rounded-lg border bg-card">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Leads by Service</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Service</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">Leads</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">Won</th>
                </tr>
              </thead>
              <tbody>
                {data.leads_by_service.map((r) => (
                  <tr key={r.service} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-2">{r.service}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{r.count}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{r.won}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Pipeline */}
      {data.pipeline.length > 0 && (
        <section className="rounded-lg border bg-card">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Active Pipeline by Stage</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Stage</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">Leads</th>
                </tr>
              </thead>
              <tbody>
                {data.pipeline.map((r) => (
                  <tr key={r.status} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-2 capitalize">{r.status.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{r.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Won/lost reasons */}
      {data.won_lost_reasons.length > 0 && (
        <section className="rounded-lg border bg-card">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Lost Reasons</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Reason</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">Count</th>
                </tr>
              </thead>
              <tbody>
                {data.won_lost_reasons.map((r) => (
                  <tr key={r.reason} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-2">{r.reason}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{r.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Sales performance — admin/manager only (RPC returns empty array for sales role) */}
      {data.sales_performance.length > 0 && (
        <section className="rounded-lg border bg-card">
          <div className="border-b px-4 py-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Sales Performance by Owner</h2>
            <button
              onClick={exportSalesPerformance}
              className="text-xs text-primary hover:underline"
            >
              Export CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Owner</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">Total</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">Won</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">Lost</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">Conv %</th>
                </tr>
              </thead>
              <tbody>
                {data.sales_performance.map((r) => (
                  <tr key={r.owner} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-2">{r.owner}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{r.total}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{r.won}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{r.lost}</td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {formatPct(r.conversion_rate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter crm typecheck 2>&1 | tail -5
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add apps/crm/src/pages/reports/SalesReport.tsx
git commit -m "feat(10H): SalesReport — summary, leads by month/source/service, pipeline, lost reasons, performance"
```

---

## Task 5: OperationsReport component

**Files:**

- Create: `apps/crm/src/pages/reports/OperationsReport.tsx`

- [ ] **Step 1: Create OperationsReport.tsx**

```tsx
// apps/crm/src/pages/reports/OperationsReport.tsx
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ReportFilters } from './ReportFilters';
import type { OperationsReport as OpsData, ReportFiltersState } from '@/lib/reports/report-types';
import Papa from 'papaparse';
import { downloadBlob } from '@/lib/data-export/export-engine';

interface Props {
  filters: ReportFiltersState;
  onFiltersChange: (f: ReportFiltersState) => void;
}

export function OperationsReport({ filters, onFiltersChange }: Props) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['operations-report', filters],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_operations_report', {
        p_from: filters.from || null,
        p_to: filters.to || null,
        p_project_status: filters.projectStatus || null,
        p_owner_id: filters.ownerId || null,
      });
      if (error) throw new Error(error.message);
      return data as OpsData;
    },
    staleTime: 60_000,
  });

  function exportDelayed() {
    if (!data) return;
    const rows = data.delayed_projects_list.map((r) => ({
      'Project Number': r.project_number,
      'Project Name': r.name,
      Customer: r.customer,
      'Target Completion': r.target_completion_date,
      'Days Delayed': r.days_delayed,
      Status: r.status,
    }));
    downloadBlob(
      new Blob([Papa.unparse(rows)], { type: 'text/csv;charset=utf-8;' }),
      'delayed_projects.csv'
    );
  }

  function exportOverdueMilestones() {
    if (!data) return;
    const rows = data.overdue_milestones_list.map((r) => ({
      Project: r.project_name,
      Milestone: r.milestone_name,
      'Due Date': r.due_date,
      'Days Overdue': r.days_overdue,
      Status: r.status,
    }));
    downloadBlob(
      new Blob([Papa.unparse(rows)], { type: 'text/csv;charset=utf-8;' }),
      'overdue_milestones.csv'
    );
  }

  if (isLoading)
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  if (error)
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
        {(error as Error).message}
      </div>
    );
  if (!data) return null;

  const s = data.summary;
  const installRate =
    s.installation_total > 0
      ? ((s.installation_completed / s.installation_total) * 100).toFixed(1) + '%'
      : '—';

  return (
    <div className="space-y-6">
      <ReportFilters
        filters={filters}
        onChange={onFiltersChange}
        show={{ owner: true, projectStatus: true }}
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: 'Active Projects', value: s.active_projects.toString() },
          { label: 'Delayed Projects', value: s.delayed_projects.toString() },
          { label: 'Overdue Milestones', value: s.overdue_milestones.toString() },
          { label: 'Upcoming Installs (30d)', value: s.upcoming_installations_30d.toString() },
          { label: 'Install Completion', value: installRate },
          {
            label: 'Avg Order→Complete',
            value:
              s.avg_order_to_completion_days != null
                ? s.avg_order_to_completion_days.toFixed(1) + ' days'
                : '—',
          },
        ].map((c) => (
          <div key={c.label} className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Projects by status */}
      {data.projects_by_status.length > 0 && (
        <section className="rounded-lg border bg-card">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Projects by Status</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">Count</th>
                </tr>
              </thead>
              <tbody>
                {data.projects_by_status.map((r) => (
                  <tr key={r.status} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-2 capitalize">{r.status.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{r.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Delayed projects */}
      <section className="rounded-lg border bg-card">
        <div className="border-b px-4 py-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Delayed Projects</h2>
          {data.delayed_projects_list.length > 0 && (
            <button onClick={exportDelayed} className="text-xs text-primary hover:underline">
              Export CSV
            </button>
          )}
        </div>
        {data.delayed_projects_list.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground text-center">No delayed projects</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Project</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                    Customer
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                    Target Date
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                    Days Delayed
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.delayed_projects_list.map((r) => (
                  <tr key={r.project_number} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-2 font-medium">
                      {r.project_number}
                      <span className="ml-2 font-normal text-muted-foreground">{r.name}</span>
                    </td>
                    <td className="px-4 py-2">{r.customer}</td>
                    <td className="px-4 py-2">{r.target_completion_date}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-destructive font-medium">
                      {r.days_delayed}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Overdue milestones */}
      <section className="rounded-lg border bg-card">
        <div className="border-b px-4 py-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Overdue Milestones</h2>
          {data.overdue_milestones_list.length > 0 && (
            <button
              onClick={exportOverdueMilestones}
              className="text-xs text-primary hover:underline"
            >
              Export CSV
            </button>
          )}
        </div>
        {data.overdue_milestones_list.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground text-center">
            No overdue milestones
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Project</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                    Milestone
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                    Due Date
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                    Days Overdue
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.overdue_milestones_list.map((r, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-2">{r.project_number}</td>
                    <td className="px-4 py-2">{r.milestone_name}</td>
                    <td className="px-4 py-2">{r.due_date}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-destructive font-medium">
                      {r.days_overdue}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Upcoming installations */}
      <section className="rounded-lg border bg-card">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-semibold">Upcoming Installations (next 30 days)</h2>
        </div>
        {data.upcoming_installations.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground text-center">
            No upcoming installations
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Project</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                    Scheduled Start
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Team</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.upcoming_installations.map((r, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-2">
                      {r.project_number}
                      <span className="ml-2 text-muted-foreground">{r.project_name}</span>
                    </td>
                    <td className="px-4 py-2">
                      {new Date(r.scheduled_start).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-2">{r.assigned_team || '—'}</td>
                    <td className="px-4 py-2 capitalize">{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter crm typecheck 2>&1 | tail -5
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add apps/crm/src/pages/reports/OperationsReport.tsx
git commit -m "feat(10H): OperationsReport — summary, projects by status, delayed, overdue milestones, upcoming installs"
```

---

## Task 6: FinanceReport component

**Files:**

- Create: `apps/crm/src/pages/reports/FinanceReport.tsx`

- [ ] **Step 1: Create FinanceReport.tsx**

```tsx
// apps/crm/src/pages/reports/FinanceReport.tsx
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ReportFilters } from './ReportFilters';
import type { FinanceReport as FinData, ReportFiltersState } from '@/lib/reports/report-types';
import Papa from 'papaparse';
import { downloadBlob } from '@/lib/data-export/export-engine';

interface Props {
  filters: ReportFiltersState;
  onFiltersChange: (f: ReportFiltersState) => void;
}

/** Format paise to INR string: 100000 → ₹1,000 */
function fmt(minor: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(minor / 100);
}

export function FinanceReport({ filters, onFiltersChange }: Props) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['finance-report', filters],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_finance_report', {
        p_from: filters.from || null,
        p_to: filters.to || null,
        p_customer_id: filters.customerId || null,
      });
      if (error) throw new Error(error.message);
      return data as FinData;
    },
    staleTime: 60_000,
  });

  function exportAgeingBuckets() {
    if (!data) return;
    const rows = data.ageing_buckets.map((b) => ({
      Bucket: b.bucket_label,
      Invoices: b.count,
      'Amount (₹)': (b.amount_minor / 100).toFixed(2),
    }));
    downloadBlob(
      new Blob([Papa.unparse(rows)], { type: 'text/csv;charset=utf-8;' }),
      'finance_ageing.csv'
    );
  }

  function exportOutstanding() {
    if (!data) return;
    const rows = data.top_customers_outstanding.map((r) => ({
      Customer: r.customer,
      'Outstanding (₹)': (r.outstanding_minor / 100).toFixed(2),
    }));
    downloadBlob(
      new Blob([Papa.unparse(rows)], { type: 'text/csv;charset=utf-8;' }),
      'outstanding_by_customer.csv'
    );
  }

  if (isLoading)
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  if (error)
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
        {(error as Error).message}
      </div>
    );
  if (!data) return null;

  const s = data.summary;

  return (
    <div className="space-y-6">
      <ReportFilters filters={filters} onChange={onFiltersChange} show={{ customer: true }} />

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: 'Quoted Value', value: fmt(s.quoted_value_minor) },
          { label: 'Order Value', value: fmt(s.order_value_minor) },
          { label: 'Invoiced', value: fmt(s.invoiced_minor) },
          { label: 'Received', value: fmt(s.received_minor) },
          { label: 'Outstanding', value: fmt(s.outstanding_minor) },
          { label: 'Overdue', value: fmt(s.overdue_minor) },
        ].map((c) => (
          <div key={c.label} className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Ageing buckets */}
      <section className="rounded-lg border bg-card">
        <div className="border-b px-4 py-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Invoice Ageing</h2>
          <button onClick={exportAgeingBuckets} className="text-xs text-primary hover:underline">
            Export CSV
          </button>
        </div>
        {data.ageing_buckets.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground text-center">
            No outstanding invoices
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Bucket</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                    Invoices
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.ageing_buckets.map((b) => (
                  <tr key={b.bucket_label} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-2">{b.bucket_label}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{b.count}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{fmt(b.amount_minor)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t bg-muted/20 font-semibold">
                  <td className="px-4 py-2">Total</td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {data.ageing_buckets.reduce((a, b) => a + b.count, 0)}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {fmt(data.ageing_buckets.reduce((a, b) => a + b.amount_minor, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      {/* Monthly received */}
      {data.monthly_received.length > 0 && (
        <section className="rounded-lg border bg-card">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Monthly Received Payments</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Month</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                    Amount Received
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.monthly_received.map((r) => (
                  <tr key={r.month} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-2">{r.month}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{fmt(r.amount_minor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Top customers by outstanding */}
      {data.top_customers_outstanding.length > 0 && (
        <section className="rounded-lg border bg-card">
          <div className="border-b px-4 py-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Top Customers — Outstanding Balance</h2>
            <button onClick={exportOutstanding} className="text-xs text-primary hover:underline">
              Export CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                    Customer
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                    Outstanding
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.top_customers_outstanding.map((r) => (
                  <tr key={r.customer} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-2">{r.customer}</td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {fmt(r.outstanding_minor)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter crm typecheck 2>&1 | tail -5
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add apps/crm/src/pages/reports/FinanceReport.tsx
git commit -m "feat(10H): FinanceReport — summary, ageing buckets, monthly received, top outstanding customers"
```

---

## Task 7: ReportsPage (tabs + wiring) + tests

**Files:**

- Rewrite: `apps/crm/src/pages/ReportsPage.tsx`
- Create: `apps/crm/src/lib/__tests__/reporting.test.ts`

- [ ] **Step 1: Rewrite ReportsPage.tsx**

The router imports `./pages/ReportsPage` as a default export. Rewrite the file to be the tabbed container.

```tsx
// apps/crm/src/pages/ReportsPage.tsx
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { SalesReport } from './reports/SalesReport';
import { OperationsReport } from './reports/OperationsReport';
import { FinanceReport } from './reports/FinanceReport';
import type { ReportFiltersState } from '@/lib/reports/report-types';

type Tab = 'sales' | 'operations' | 'finance';

const DEFAULT_FILTERS: ReportFiltersState = {
  from: '',
  to: '',
  source: '',
  serviceId: '',
  ownerId: '',
  projectStatus: '',
  customerId: '',
};

// Default date range: start of current financial year (April 1 of current or previous year)
function defaultFromDate(): string {
  const now = new Date();
  const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return `${year}-04-01`;
}

export default function ReportsPage() {
  const { profile } = useAuth();
  const role = profile?.role ?? 'viewer';

  const canSeeSales = ['admin', 'manager', 'sales'].includes(role);
  const canSeeOps = ['admin', 'manager', 'operations'].includes(role);
  const canSeeFin = ['admin', 'manager'].includes(role);

  const availableTabs: Tab[] = [
    ...(canSeeSales ? ['sales' as Tab] : []),
    ...(canSeeOps ? ['operations' as Tab] : []),
    ...(canSeeFin ? ['finance' as Tab] : []),
  ];

  const [activeTab, setActiveTab] = useState<Tab>(availableTabs[0] ?? 'sales');
  const [filters, setFilters] = useState<ReportFiltersState>({
    ...DEFAULT_FILTERS,
    from: defaultFromDate(),
  });

  if (availableTabs.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        You do not have permission to view reports.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">Business intelligence and analytics.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border bg-muted/30 p-1 w-fit">
        {availableTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setFilters({ ...DEFAULT_FILTERS, from: defaultFromDate() });
            }}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors capitalize
              ${activeTab === tab ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'sales' && canSeeSales && (
        <SalesReport filters={filters} onFiltersChange={setFilters} />
      )}
      {activeTab === 'operations' && canSeeOps && (
        <OperationsReport filters={filters} onFiltersChange={setFilters} />
      )}
      {activeTab === 'finance' && canSeeFin && (
        <FinanceReport filters={filters} onFiltersChange={setFilters} />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create reporting.test.ts**

```typescript
// apps/crm/src/lib/__tests__/reporting.test.ts
import { describe, it, expect } from 'vitest';

// ── Currency formatting ────────────────────────────────────────────────────────

function fmt(minor: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(minor / 100);
}

describe('currency formatting (paise → INR)', () => {
  it('formats zero', () => {
    expect(fmt(0)).toContain('0');
  });
  it('formats 100 paise as ₹1', () => {
    const result = fmt(100);
    expect(result).toContain('1');
  });
  it('formats 100000 paise as ₹1,000', () => {
    const result = fmt(100000);
    expect(result).toContain('1,000');
  });
  it('formats 10000000 paise as ₹1,00,000 (en-IN grouping)', () => {
    const result = fmt(10000000);
    expect(result).toContain('1,00,000');
  });
});

// ── Conversion rate calculation ────────────────────────────────────────────────

function conversionRate(won: number, lost: number): number | null {
  const closed = won + lost;
  if (closed === 0) return null;
  return Math.round((won / closed) * 1000) / 10; // 1 decimal
}

describe('conversion rate', () => {
  it('returns null when no closed leads', () => {
    expect(conversionRate(0, 0)).toBeNull();
  });
  it('returns 0 when all lost', () => {
    expect(conversionRate(0, 10)).toBe(0);
  });
  it('returns 100 when all won', () => {
    expect(conversionRate(10, 0)).toBe(100);
  });
  it('returns 50 for equal won/lost', () => {
    expect(conversionRate(5, 5)).toBe(50);
  });
  it('handles fractional correctly', () => {
    expect(conversionRate(1, 3)).toBeCloseTo(25);
  });
});

// ── Ageing bucket assignment ───────────────────────────────────────────────────

function ageingBucket(dueDateStr: string, todayStr: string): string {
  const due = new Date(dueDateStr);
  const today = new Date(todayStr);
  const daysOverdue = Math.floor((today.getTime() - due.getTime()) / 86400_000);
  if (daysOverdue <= 0) return 'current';
  if (daysOverdue <= 30) return '1–30 days';
  if (daysOverdue <= 60) return '31–60 days';
  if (daysOverdue <= 90) return '61–90 days';
  return '90+ days';
}

describe('ageing bucket assignment', () => {
  const today = '2026-11-09';
  it('due today = current', () => {
    expect(ageingBucket('2026-11-09', today)).toBe('current');
  });
  it('due tomorrow = current', () => {
    expect(ageingBucket('2026-11-10', today)).toBe('current');
  });
  it('1 day overdue → 1-30 days', () => {
    expect(ageingBucket('2026-11-08', today)).toBe('1–30 days');
  });
  it('30 days overdue → 1-30 days', () => {
    expect(ageingBucket('2026-10-10', today)).toBe('1–30 days');
  });
  it('31 days overdue → 31-60 days', () => {
    expect(ageingBucket('2026-10-09', today)).toBe('31–60 days');
  });
  it('60 days overdue → 31-60 days', () => {
    expect(ageingBucket('2026-09-10', today)).toBe('31–60 days');
  });
  it('61 days overdue → 61-90 days', () => {
    expect(ageingBucket('2026-09-09', today)).toBe('61–90 days');
  });
  it('91 days overdue → 90+ days', () => {
    expect(ageingBucket('2026-08-10', today)).toBe('90+ days');
  });
});

// ── Installation completion rate ───────────────────────────────────────────────

function installRate(total: number, completed: number): string {
  if (total === 0) return '—';
  return ((completed / total) * 100).toFixed(1) + '%';
}

describe('installation completion rate', () => {
  it('returns em dash when no installations', () => {
    expect(installRate(0, 0)).toBe('—');
  });
  it('returns 0% when none completed', () => {
    expect(installRate(10, 0)).toBe('0.0%');
  });
  it('returns 100% when all completed', () => {
    expect(installRate(5, 5)).toBe('100.0%');
  });
  it('rounds to 1 decimal', () => {
    expect(installRate(3, 1)).toBe('33.3%');
  });
});

// ── Finance summary totals ─────────────────────────────────────────────────────

describe('finance summary checks', () => {
  it('received cannot exceed invoiced', () => {
    const invoiced = 5_000_000;
    const received = 3_200_000;
    const outstanding = invoiced - received;
    expect(outstanding).toBe(1_800_000);
    expect(received).toBeLessThanOrEqual(invoiced);
  });

  it('ageing bucket totals sum to outstanding', () => {
    const buckets = [
      { amount_minor: 500_000 },
      { amount_minor: 300_000 },
      { amount_minor: 200_000 },
    ];
    const total = buckets.reduce((a, b) => a + b.amount_minor, 0);
    expect(total).toBe(1_000_000);
  });
});

// ── Default date range (FY April start) ───────────────────────────────────────

function fyFromDate(now: Date): string {
  const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return `${year}-04-01`;
}

describe('default financial year start', () => {
  it('April 1 of current year when month is April', () => {
    expect(fyFromDate(new Date('2026-04-15'))).toBe('2026-04-01');
  });
  it('April 1 of current year when month is November', () => {
    expect(fyFromDate(new Date('2026-11-09'))).toBe('2026-04-01');
  });
  it('April 1 of previous year in January', () => {
    expect(fyFromDate(new Date('2026-01-10'))).toBe('2025-04-01');
  });
  it('April 1 of previous year in March', () => {
    expect(fyFromDate(new Date('2026-03-31'))).toBe('2025-04-01');
  });
});

// ── Sales performance sort ─────────────────────────────────────────────────────

describe('sales performance ordering', () => {
  const rows = [
    { owner: 'Alice', total: 10, won: 3, lost: 2, conversion_rate: 60 },
    { owner: 'Bob', total: 25, won: 8, lost: 5, conversion_rate: 61.5 },
    { owner: 'Carol', total: 5, won: 5, lost: 0, conversion_rate: 100 },
  ];

  it('sorted by total descending from RPC', () => {
    const sorted = [...rows].sort((a, b) => b.total - a.total);
    expect(sorted[0].owner).toBe('Bob');
    expect(sorted[1].owner).toBe('Alice');
    expect(sorted[2].owner).toBe('Carol');
  });
});
```

- [ ] **Step 3: Run tests**

```bash
pnpm --filter crm test 2>&1 | tail -8
```

Expected: all new tests pass; total ≥ 297.

- [ ] **Step 4: Typecheck**

```bash
pnpm --filter crm typecheck 2>&1 | tail -5
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add apps/crm/src/pages/ReportsPage.tsx apps/crm/src/lib/__tests__/reporting.test.ts
git commit -m "feat(10H): ReportsPage tabs (Sales/Operations/Finance) + 30 reporting unit tests"
```

---

## Task 8: Final verification

**Files:** None new — verify builds and tests.

- [ ] **Step 1: Run all tests**

```bash
pnpm --filter crm test 2>&1 | tail -8
```

Expected: all tests pass (≥297).

- [ ] **Step 2: Typecheck all packages**

```bash
pnpm --filter crm typecheck && pnpm --filter types typecheck && pnpm --filter website typecheck
```

Expected: 0 errors in all 3.

- [ ] **Step 3: Production builds**

```bash
pnpm --filter crm build 2>&1 | tail -5
pnpm --filter website build 2>&1 | tail -5
```

Expected: both succeed with `built in X.Xs`.

- [ ] **Step 4: Commit** (if any last-minute fixes)

```bash
git add -p
git commit -m "fix(10H): <description if needed>"
```

---

## Self-review checklist

**Spec coverage:**

- [x] Leads by month ← `leads_by_month` in `get_sales_report`
- [x] Leads by source ← `leads_by_source`
- [x] Leads by service ← `leads_by_service`
- [x] Pipeline ← `pipeline` (active leads by status)
- [x] Conversion rate ← `summary.conversion_rate`
- [x] Avg first-response time ← `summary.avg_first_response_days`
- [x] Lead-to-quote time ← `summary.avg_lead_to_quote_days`
- [x] Won/lost reasons ← `won_lost_reasons`
- [x] Sales performance ← `sales_performance` (admin/manager only)
- [x] Active projects ← `summary.active_projects` in `get_operations_report`
- [x] Delayed projects ← `summary.delayed_projects` + `delayed_projects_list`
- [x] Projects by stage ← `projects_by_status`
- [x] Overdue milestones ← `summary.overdue_milestones` + `overdue_milestones_list`
- [x] Upcoming installations ← `upcoming_installations`
- [x] Installation completion ← `summary.installation_completed/total`
- [x] Avg order-to-completion ← `summary.avg_order_to_completion_days`
- [x] Quoted value ← `summary.quoted_value_minor` in `get_finance_report`
- [x] Confirmed order value ← `summary.order_value_minor`
- [x] Invoiced amount ← `summary.invoiced_minor`
- [x] Amount received ← `summary.received_minor`
- [x] Outstanding value ← `summary.outstanding_minor`
- [x] Overdue value ← `summary.overdue_minor`
- [x] Ageing buckets ← `ageing_buckets` (current, 1-30, 31-60, 61-90, 90+)
- [x] Date filter ← `p_from` / `p_to` in all RPCs
- [x] Source filter ← `p_source` in `get_sales_report`
- [x] Service filter ← `p_service_id` in `get_sales_report`
- [x] Owner filter ← `p_owner_id` in `get_sales_report` + `get_operations_report`
- [x] Project status filter ← `p_project_status` in `get_operations_report`
- [x] Customer filter ← `p_customer_id` in `get_finance_report`
- [x] Authorized export ← CSV export buttons on every breakdown table
- [x] Role-authorized ← RPCs raise exception for wrong role; UI hides tabs for unauthorized roles
- [x] RLS respected ← all calculations in `security definer` RPCs, not browser
- [x] Server-side calculations ← all aggregates in PostgreSQL, none in browser
- [x] Deterministic tests ← 30 unit tests for metric logic

**No placeholders in plan:** All SQL, TypeScript, and test code is complete.

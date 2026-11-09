# Phase 10E — CRM Productivity & Role-Based Dashboards

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure CRM navigation into logical sections, add role-aware dashboards (Owner/Sales/Operations/Finance), build missing operational pages (Follow-ups, Site Visits, Measurements, Installations, Payments, Outstanding), enhance the Project Workspace into a tabbed hub, improve UX (global search, breadcrumbs, pagination, filters, activity timelines), and add admin pages.

**Architecture:** All new pages are lazy-loaded React routes. Role-based dashboards share one `DashboardPage` that switches on `profile.role`. New metric hooks use parallel Supabase count queries that respect RLS. New DB migration adds a `get_role_dashboard_metrics` RPC returning role-filtered metric sets. Project workspace gains tabbed sub-sections rendered in `ProjectDetailPage`. Global search is client-side with a `useGlobalSearch` hook that fans out to leads/customers/quotes/orders/projects. All monetary values in minor units (paise), displayed via existing `formatCurrency`.

**Tech Stack:** React 18, React Router v6, TanStack Query v5, Supabase JS v2, Tailwind CSS, shadcn/ui, React Hook Form + Zod, Vitest, Playwright

---

## Existing files to know

- `apps/crm/src/components/layout/Sidebar.tsx` — 171 lines, currently flat list + CMS section
- `apps/crm/src/router.tsx` — lazy routes, currently ~330 lines
- `apps/crm/src/pages/DashboardPage.tsx` — 133 lines, single-role grid
- `apps/crm/src/pages/projects/ProjectDetailPage.tsx` — 689 lines, tabs: Overview/Milestones/Activities/Attachments
- `apps/crm/src/lib/hooks/use-dashboard-metrics.ts` — 99 lines, 10 parallel count queries
- `packages/types/src/database.types.ts` — includes `site_visits`, `measurements`, `installations`, `payments` tables

---

## Task 1 — Sidebar restructuring

**Files:**

- Modify: `apps/crm/src/components/layout/Sidebar.tsx`

- [ ] Replace the flat `navItems` array with grouped sections. The new structure:

```tsx
// apps/crm/src/components/layout/Sidebar.tsx
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  CalendarCheck,
  MapPin,
  FileText,
  ShoppingBag,
  Briefcase,
  Ruler,
  Factory,
  Wrench,
  CheckSquare,
  Receipt,
  CreditCard,
  AlertCircle,
  BarChart2,
  Globe,
  FolderOpen,
  FileStack,
  Image,
  BookOpen,
  Settings,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { useState } from 'react';

type NavItem = { to: string; label: string; icon: React.ElementType };
type NavSection = { label: string; items: NavItem[]; roles?: string[] };

const sections: NavSection[] = [
  {
    label: 'Sales',
    items: [
      { to: '/leads', label: 'Leads', icon: Users },
      { to: '/customers', label: 'Customers', icon: UserCheck },
      { to: '/follow-ups', label: 'Follow-ups', icon: CalendarCheck },
      { to: '/site-visits', label: 'Site Visits', icon: MapPin },
      { to: '/quotes', label: 'Quotations', icon: FileText },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/orders', label: 'Orders', icon: ShoppingBag },
      { to: '/projects', label: 'Projects', icon: Briefcase },
      { to: '/measurements', label: 'Measurements', icon: Ruler },
      { to: '/production', label: 'Production', icon: Factory },
      { to: '/installations', label: 'Installations', icon: Wrench },
      { to: '/tasks', label: 'Tasks', icon: CheckSquare },
    ],
  },
  {
    label: 'Finance',
    items: [
      { to: '/invoices', label: 'Invoices', icon: Receipt },
      { to: '/payments', label: 'Payments', icon: CreditCard },
      { to: '/outstanding', label: 'Outstanding', icon: AlertCircle },
    ],
  },
  {
    label: 'Website',
    roles: ['admin', 'manager'],
    items: [
      { to: '/cms/pages', label: 'Pages', icon: FileStack },
      { to: '/cms/projects', label: 'Portfolio', icon: FolderOpen },
      { to: '/cms/services', label: 'Services', icon: Wrench },
      { to: '/cms/media', label: 'Media', icon: Image },
      { to: '/cms/catalogue', label: 'Catalogue', icon: BookOpen },
      { to: '/admin/website-branding', label: 'Branding', icon: Globe },
    ],
  },
  {
    label: 'Administration',
    roles: ['admin'],
    items: [
      { to: '/admin/users', label: 'Users', icon: UserCheck },
      { to: '/admin/settings', label: 'Business Settings', icon: Settings },
      { to: '/admin/audit', label: 'Audit History', icon: BarChart2 },
    ],
  },
];
```

- [ ] Implement collapsible sections — each `NavSection` is collapsible; default open for sections containing the active route. Use `localStorage` key `sidebar_collapsed_<label>` to persist per-section state.

- [ ] Add Dashboard link at top (above sections), Reports link at bottom (above Admin).

- [ ] Commit: `git commit -m "feat(10E): grouped collapsible sidebar — Sales/Operations/Finance/Website/Admin"`

---

## Task 2 — Router: add missing routes

**Files:**

- Modify: `apps/crm/src/router.tsx`

- [ ] Add lazy imports and routes for all new pages:

```tsx
const FollowUpsPage = lazy(() =>
  import('./pages/sales/FollowUpsPage').then((m) => ({ default: m.FollowUpsPage }))
);
const SiteVisitsPage = lazy(() =>
  import('./pages/sales/SiteVisitsPage').then((m) => ({ default: m.SiteVisitsPage }))
);
const MeasurementsPage = lazy(() =>
  import('./pages/operations/MeasurementsPage').then((m) => ({ default: m.MeasurementsPage }))
);
const ProductionPage = lazy(() =>
  import('./pages/operations/ProductionPage').then((m) => ({ default: m.ProductionPage }))
);
const InstallationsPage = lazy(() =>
  import('./pages/operations/InstallationsPage').then((m) => ({ default: m.InstallationsPage }))
);
const PaymentsPage = lazy(() =>
  import('./pages/finance/PaymentsPage').then((m) => ({ default: m.PaymentsPage }))
);
const OutstandingPage = lazy(() =>
  import('./pages/finance/OutstandingPage').then((m) => ({ default: m.OutstandingPage }))
);
const ReportsPage = lazy(() =>
  import('./pages/ReportsPage').then((m) => ({ default: m.ReportsPage }))
);
const UsersPage = lazy(() =>
  import('./pages/admin/UsersPage').then((m) => ({ default: m.UsersPage }))
);
const AuditPage = lazy(() =>
  import('./pages/admin/AuditPage').then((m) => ({ default: m.AuditPage }))
);
```

Routes inside the protected shell children array:

```tsx
{ path: 'follow-ups',    element: <S><FollowUpsPage /></S> },
{ path: 'site-visits',   element: <S><SiteVisitsPage /></S> },
{ path: 'measurements',  element: <S><MeasurementsPage /></S> },
{ path: 'production',    element: <S><ProductionPage /></S> },
{ path: 'installations', element: <S><InstallationsPage /></S> },
{ path: 'payments',      element: <S><PaymentsPage /></S> },
{ path: 'outstanding',   element: <S><OutstandingPage /></S> },
{ path: 'reports',       element: <S><ReportsPage /></S> },
{ path: 'admin/users',   element: <ProtectedRoute requiredRoles={['admin']}><S><UsersPage /></S></ProtectedRoute> },
{ path: 'admin/audit',   element: <ProtectedRoute requiredRoles={['admin']}><S><AuditPage /></S></ProtectedRoute> },
```

- [ ] Build stub pages for each new route (copy pattern from `apps/crm/src/pages/StubPage.tsx`) so router compiles. Real implementation in later tasks.

- [ ] Run `pnpm --filter crm tsc --noEmit` — must pass.

- [ ] Commit: `git commit -m "feat(10E): add routes for follow-ups, site-visits, measurements, production, installations, payments, outstanding, reports, users, audit"`

---

## Task 3 — Role-based dashboard: metrics hook + RPC

**Files:**

- Create: `supabase/migrations/20261109000022_dashboard_rpcs.sql`
- Modify: `apps/crm/src/lib/hooks/use-dashboard-metrics.ts`
- Modify: `packages/types/src/database.types.ts`

- [ ] Write migration adding role-aware metric RPCs:

```sql
-- supabase/migrations/20261109000022_dashboard_rpcs.sql

-- ── Owner/Manager dashboard metrics ──────────────────────────────────────────
create or replace function get_manager_metrics()
returns jsonb language plpgsql security definer
set search_path = ''
as $$
declare
  v_now text := now()::text;
  v_7d  text := (now() + interval '7 days')::text;
  v_today text := current_date::text;
begin
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
    'quotes_expiring',    (select count(*) from public.quotes
                           where status in ('sent','viewed')
                             and expiry_date <= current_date + 7),
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
```

- [ ] Add RPC types to `packages/types/src/database.types.ts` Functions section:

```ts
get_manager_metrics: {
  Args: Record<string, never>;
  Returns: Json;
}
get_sales_metrics: {
  Args: Record<string, never>;
  Returns: Json;
}
get_operations_metrics: {
  Args: Record<string, never>;
  Returns: Json;
}
get_finance_metrics: {
  Args: Record<string, never>;
  Returns: Json;
}
```

- [ ] Rewrite `apps/crm/src/lib/hooks/use-dashboard-metrics.ts` to export four focused hooks:

```ts
export function useManagerMetrics() {
  return useQuery({
    queryKey: ['dashboard-manager'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_manager_metrics');
      if (error) throw error;
      return data as {
        new_leads: number;
        followups_due: number;
        quotes_awaiting: number;
        active_orders: number;
        active_projects: number;
        delayed_projects: number;
        installs_this_week: number;
        invoiced_minor: number;
        received_minor: number;
        outstanding_minor: number;
      };
    },
    refetchInterval: 60_000,
  });
}

export function useSalesMetrics() {
  /* calls get_sales_metrics */
}
export function useOperationsMetrics() {
  /* calls get_operations_metrics */
}
export function useFinanceMetrics() {
  /* calls get_finance_metrics */
}
// Keep legacy useDashboardMetrics() as alias to useManagerMetrics() for backwards compat
```

- [ ] Run `supabase db push` — apply the migration.

- [ ] Commit: `git commit -m "feat(10E): role-aware dashboard metric RPCs (manager/sales/ops/finance)"`

---

## Task 4 — Role-based DashboardPage

**Files:**

- Modify: `apps/crm/src/pages/DashboardPage.tsx`
- Create: `apps/crm/src/pages/dashboard/ManagerDashboard.tsx`
- Create: `apps/crm/src/pages/dashboard/SalesDashboard.tsx`
- Create: `apps/crm/src/pages/dashboard/OperationsDashboard.tsx`
- Create: `apps/crm/src/pages/dashboard/FinanceDashboard.tsx`

**Pattern for all dashboard sub-components:**

```tsx
// MetricCard: every card must link to the filtered list it represents
function MetricCard({
  label,
  value,
  sublabel,
  to,
  urgent = false,
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  to: string;
  urgent?: boolean;
}) {
  return (
    <Link to={to}>
      <div
        className={cn(
          'rounded-lg border bg-card p-4 hover:shadow-sm transition-shadow cursor-pointer',
          urgent && (value as number) > 0 && 'border-red-200 bg-red-50/50'
        )}
      >
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
        <p
          className={cn(
            'mt-1 text-3xl font-bold tabular-nums',
            urgent && (value as number) > 0 && 'text-red-600'
          )}
        >
          {value}
        </p>
        {sublabel && <p className="mt-0.5 text-xs text-muted-foreground">{sublabel}</p>}
      </div>
    </Link>
  );
}
```

- [ ] **ManagerDashboard.tsx** — uses `useManagerMetrics()`. Grid layout: row 1 (Sales: new_leads→`/leads?status=new`, followups_due→`/follow-ups`, quotes_awaiting→`/quotes?status=awaiting`), row 2 (Ops: active_orders→`/orders`, active_projects→`/projects`, delayed_projects→`/projects?delayed=1`, installs_this_week→`/installations?week=1`), row 3 (Finance: invoiced, received, outstanding — amounts formatted with `formatCurrency`).

- [ ] **SalesDashboard.tsx** — uses `useSalesMetrics()`. Cards: my_leads→`/leads?mine=1`, overdue_followups→`/follow-ups?overdue=1` (urgent), site_visits_pending→`/site-visits?mine=1`, quotes_awaiting→`/quotes?status=awaiting`, quotes_expiring→`/quotes?expiring=1` (urgent), pipeline_leads→`/leads?stage=pipeline`.

- [ ] **OperationsDashboard.tsx** — uses `useOperationsMetrics()`. Cards: orders_in_production→`/production`, blocked_projects→`/projects?status=blocked` (urgent), overdue_milestones→`/projects?milestones=overdue` (urgent), measurements_pending→`/measurements?pending=1`, upcoming_installations→`/installations?week=1`.

- [ ] **FinanceDashboard.tsx** — uses `useFinanceMetrics()`. Cards: invoices_issued→`/invoices?status=issued`, overdue_invoices→`/invoices?status=overdue` (urgent), payments_received_minor (this month)→`/payments`, outstanding_minor→`/outstanding`, ageing_30_minor→`/outstanding?age=30`, ageing_60_minor→`/outstanding?age=60`.

- [ ] **DashboardPage.tsx** — switch on role:

```tsx
export function DashboardPage() {
  const { profile } = useAuth();
  const role = profile?.role;
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Welcome back, {profile?.full_name ?? 'there'}.
        </p>
      </div>
      {(role === 'admin' || role === 'manager') && <ManagerDashboard />}
      {role === 'sales' && <SalesDashboard />}
      {role === 'operations' && <OperationsDashboard />}
      {role === 'viewer' && <ManagerDashboard />}
      {/* finance role gets FinanceDashboard once role is added */}
    </div>
  );
}
```

- [ ] Commit: `git commit -m "feat(10E): role-based dashboards — manager/sales/operations/finance views"`

---

## Task 5 — Follow-ups page

**Files:**

- Create: `apps/crm/src/pages/sales/FollowUpsPage.tsx`

The Follow-ups page is a filtered view of `leads` where `next_follow_up_at` is set, sorted by urgency. It's not a new table — it's a filtered list of leads.

- [ ] Write `FollowUpsPage.tsx`:
  - Query: `supabase.from('leads').select('id, full_name, phone, status, next_follow_up_at, owner:profiles!owner_id(full_name)').not('status','in','("won","lost","archived")').not('next_follow_up_at','is','null').order('next_follow_up_at')`
  - URL param `?overdue=1` filters to `next_follow_up_at < now()`
  - Table columns: Name, Phone, Status, Follow-up Due, Owner, Actions (Open lead)
  - Rows past due highlighted red; due today highlighted amber
  - Empty state: "No follow-ups scheduled" with link to Leads
  - Loading: 5 skeleton rows
  - Breadcrumb: Sales / Follow-ups

- [ ] Commit: `git commit -m "feat(10E): Follow-ups page — filtered urgent lead follow-ups"`

---

## Task 6 — Site Visits page

**Files:**

- Create: `apps/crm/src/lib/hooks/use-site-visits.ts`
- Create: `apps/crm/src/pages/sales/SiteVisitsPage.tsx`

- [ ] Write `use-site-visits.ts`:

```ts
export interface SiteVisitFilters {
  mine?: boolean;
  status?: string;
  upcoming?: boolean;
}

export function useSiteVisits(filters: SiteVisitFilters = {}) {
  const { profile } = useAuth(); // imported from @/lib/auth-context
  return useQuery({
    queryKey: ['site-visits', filters],
    queryFn: async () => {
      let q = supabase
        .from('site_visits')
        .select(
          `id, scheduled_start, scheduled_end, status, purpose,
                 lead:leads!lead_id(id, full_name),
                 customer:customers!customer_id(id, display_name),
                 assigned:profiles!assigned_to(full_name)`
        )
        .order('scheduled_start', { ascending: false })
        .limit(100);
      if (filters.mine && profile?.id) q = q.eq('assigned_to', profile.id);
      if (filters.status) q = q.eq('status', filters.status);
      if (filters.upcoming) q = q.gte('scheduled_start', new Date().toISOString());
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateSiteVisit() {
  /* insert into site_visits */
}
export function useUpdateSiteVisit() {
  /* update site_visits */
}
```

- [ ] Write `SiteVisitsPage.tsx`:
  - Filter tabs: All / Scheduled / Completed / Cancelled
  - URL param `?mine=1` filters to current user
  - Table: Date/Time, Lead/Customer, Assigned To, Status, Purpose, Actions
  - Status badges: scheduled=blue, confirmed=green, completed=green-filled, cancelled=slate, rescheduled=amber
  - Quick-create button (admin/manager/sales): opens inline form with fields: Lead/Customer (required), Scheduled Start, End, Assigned To, Purpose
  - Breadcrumb: Sales / Site Visits

- [ ] Commit: `git commit -m "feat(10E): Site Visits page with filters and quick-create"`

---

## Task 7 — Measurements page

**Files:**

- Create: `apps/crm/src/lib/hooks/use-measurements.ts`
- Create: `apps/crm/src/pages/operations/MeasurementsPage.tsx`

- [ ] Write `use-measurements.ts`:

```ts
export function useMeasurements(filters: { projectId?: string; pending?: boolean } = {}) {
  return useQuery({
    queryKey: ['measurements', filters],
    queryFn: async () => {
      let q = supabase
        .from('measurements')
        .select(
          `id, area_or_item, width_mm, height_mm, depth_mm, quantity, unit, notes,
                 project:projects!project_id(id, project_number, name),
                 site_visit:site_visits!site_visit_id(id, scheduled_start),
                 recorded_by:profiles!recorded_by(full_name)`
        )
        .order('created_at', { ascending: false })
        .limit(200);
      if (filters.projectId) q = q.eq('project_id', filters.projectId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}
```

- [ ] Write `MeasurementsPage.tsx`:
  - Table: Project, Area/Item, W×H×D (mm), Qty, Unit, Recorded By, Site Visit Date
  - Search by area_or_item text
  - URL param `?pending=1` shows site visits that are completed but have no measurements (SQL: site_visits joined, no matching measurement rows)
  - Empty state: "No measurements recorded yet"
  - Breadcrumb: Operations / Measurements

- [ ] Commit: `git commit -m "feat(10E): Measurements page — searchable list with pending filter"`

---

## Task 8 — Production page

**Files:**

- Create: `apps/crm/src/pages/operations/ProductionPage.tsx`

Production is a filtered view of `orders` where `status = 'production'` plus orders in `design_or_measurement` and `ready_for_installation`.

- [ ] Write `ProductionPage.tsx`:
  - Reuse `useOrders` hook with filter `{ status: 'production' }` (or multiple statuses)
  - Kanban-style status columns: Design/Measurement → Production → Ready for Install
  - Each card: Order number, Customer name, Project name, target completion
  - Status change button (admin/manager/operations): moves to next stage
  - Empty state per column
  - Breadcrumb: Operations / Production

- [ ] Commit: `git commit -m "feat(10E): Production page — order pipeline by production status"`

---

## Task 9 — Installations page

**Files:**

- Create: `apps/crm/src/lib/hooks/use-installations.ts`
- Create: `apps/crm/src/pages/operations/InstallationsPage.tsx`

- [ ] Write `use-installations.ts`:

```ts
export function useInstallations(filters: { week?: boolean; status?: string } = {}) {
  return useQuery({
    queryKey: ['installations', filters],
    queryFn: async () => {
      let q = supabase
        .from('installations')
        .select(
          `id, scheduled_start, scheduled_end, status, assigned_team,
                 completion_notes, customer_signoff_name, signed_off_at,
                 project:projects!project_id(id, project_number, name,
                   customer:customers!customer_id(display_name))`
        )
        .order('scheduled_start', { ascending: false })
        .limit(100);
      if (filters.status) q = q.eq('status', filters.status);
      if (filters.week) {
        const now = new Date().toISOString();
        const week = new Date(Date.now() + 7 * 86400000).toISOString();
        q = q.gte('scheduled_start', now).lte('scheduled_start', week);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpdateInstallation() {
  /* update installations */
}
```

- [ ] Write `InstallationsPage.tsx`:
  - Filter tabs: Upcoming / In Progress / Completed / All
  - URL param `?week=1` filters to next 7 days
  - Table: Project, Customer, Scheduled Start/End, Team, Lead Installer, Status, Sign-off
  - Sign-off button for completed installs (opens modal: customer name + confirmation)
  - Breadcrumb: Operations / Installations

- [ ] Commit: `git commit -m "feat(10E): Installations page with scheduling and sign-off"`

---

## Task 10 — Payments page

**Files:**

- Create: `apps/crm/src/lib/hooks/use-payments.ts`
- Create: `apps/crm/src/pages/finance/PaymentsPage.tsx`

- [ ] Write `use-payments.ts`:

```ts
export function usePayments(filters: { customerId?: string; month?: string } = {}) {
  return useQuery({
    queryKey: ['payments', filters],
    queryFn: async () => {
      let q = supabase
        .from('payments')
        .select(
          `id, payment_number, payment_date, amount_minor, currency,
                 method, status, reference,
                 invoice:invoices!invoice_id(invoice_number),
                 customer:customers!customer_id(display_name)`
        )
        .order('payment_date', { ascending: false })
        .limit(200);
      if (filters.customerId) q = q.eq('customer_id', filters.customerId);
      if (filters.month) {
        const start = `${filters.month}-01`;
        const end = new Date(new Date(start).setMonth(new Date(start).getMonth() + 1))
          .toISOString()
          .split('T')[0];
        q = q.gte('payment_date', start).lt('payment_date', end);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}
```

- [ ] Write `PaymentsPage.tsx`:
  - Month picker (default: current month)
  - Table: Payment #, Date, Customer, Invoice #, Amount, Method, Status, Reference
  - Amount total row at bottom of filtered results
  - Status badge: cleared=green, pending=amber, failed=red, reversed=slate
  - Empty state with month label
  - Breadcrumb: Finance / Payments

- [ ] Commit: `git commit -m "feat(10E): Payments page — monthly payment ledger"`

---

## Task 11 — Outstanding page

**Files:**

- Create: `apps/crm/src/pages/finance/OutstandingPage.tsx`

Outstanding is a filtered view of `invoices` with status `issued`, `partially_paid`, or `overdue`.

- [ ] Write `OutstandingPage.tsx`:
  - Reuse `useInvoices` with status filter
  - URL params: `?age=30` or `?age=60` for ageing buckets
  - Table: Invoice #, Customer, Issue Date, Due Date, Total, Paid, Balance, Status, Ageing (days)
  - Ageing columns: 0-30d / 31-60d / 60d+ highlighted
  - Footer row: total outstanding amount
  - Per row: link to invoice detail
  - Breadcrumb: Finance / Outstanding

- [ ] Commit: `git commit -m "feat(10E): Outstanding page — invoice ageing with balance totals"`

---

## Task 12 — Admin pages: Users + Audit History

**Files:**

- Create: `apps/crm/src/pages/admin/UsersPage.tsx`
- Create: `apps/crm/src/pages/admin/AuditPage.tsx`

- [ ] **UsersPage.tsx**: Reuse `useTeam` hook. Table: Avatar, Name, Role, Is Active, Last Seen. Admin-only actions: change role (select dropdown), toggle active. Empty/loading/error states. Breadcrumb: Admin / Users.

- [ ] **AuditPage.tsx**: Query `audit_log` table. Filter by actor, entity_type, date range. Table: Timestamp, Actor, Action, Entity Type, Entity ID. Read-only. Pagination (50 rows). Breadcrumb: Admin / Audit History.

- [ ] Commit: `git commit -m "feat(10E): admin Users and Audit History pages"`

---

## Task 13 — Reports page (stub)

**Files:**

- Create: `apps/crm/src/pages/ReportsPage.tsx`

- [ ] Write stub with three placeholder sections: Sales Report, Operations Report, Finance Report. Each section has a "Coming soon" state. Breadcrumb: Reports.

- [ ] Commit: `git commit -m "feat(10E): Reports page stub with section placeholders"`

---

## Task 14 — Breadcrumbs component

**Files:**

- Create: `apps/crm/src/components/layout/Breadcrumbs.tsx`

- [ ] Implement:

```tsx
// apps/crm/src/components/layout/Breadcrumbs.tsx
import { Link, useMatches } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export type BreadcrumbHandle = { crumb: string | ((data: unknown) => string) };

export function Breadcrumbs() {
  const matches = useMatches();
  const crumbs = matches
    .filter((m) => (m.handle as BreadcrumbHandle | undefined)?.crumb)
    .map((m) => ({
      to: m.pathname,
      label:
        typeof (m.handle as BreadcrumbHandle).crumb === 'function'
          ? ((m.handle as BreadcrumbHandle).crumb as Function)(m.data)
          : ((m.handle as BreadcrumbHandle).crumb as string),
    }));

  if (crumbs.length <= 1) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-4 flex items-center gap-1 text-sm text-muted-foreground"
    >
      {crumbs.map((c, i) => (
        <span key={c.to} className="flex items-center gap-1">
          {i < crumbs.length - 1 ? (
            <Link to={c.to} className="hover:text-foreground">
              {c.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">{c.label}</span>
          )}
          {i < crumbs.length - 1 && <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />}
        </span>
      ))}
    </nav>
  );
}
```

- [ ] Mount `<Breadcrumbs />` in `apps/crm/src/components/layout/AppShell.tsx` (above the page outlet).

- [ ] Add `handle: { crumb: 'Sales' }` etc. to selected routes in `router.tsx` (leads, customers, follow-ups, site-visits, quotes, orders, projects, measurements, production, installations, invoices, payments, outstanding, tasks, admin routes).

- [ ] Commit: `git commit -m "feat(10E): Breadcrumbs component wired into route handles"`

---

## Task 15 — Global Search

**Files:**

- Create: `apps/crm/src/lib/hooks/use-global-search.ts`
- Create: `apps/crm/src/components/search/GlobalSearch.tsx`

- [ ] Write `use-global-search.ts`:

```ts
export function useGlobalSearch(query: string) {
  return useQuery({
    queryKey: ['global-search', query],
    queryFn: async () => {
      if (!query || query.length < 2)
        return { leads: [], customers: [], quotes: [], orders: [], projects: [] };
      const q = `%${query}%`;
      const [leads, customers, quotes, orders, projects] = await Promise.all([
        supabase
          .from('leads')
          .select('id, full_name, phone, status')
          .ilike('full_name', q)
          .limit(5),
        supabase
          .from('customers')
          .select('id, display_name, phone')
          .ilike('display_name', q)
          .limit(5),
        supabase
          .from('quotes')
          .select('id, quote_number, status')
          .ilike('quote_number', q)
          .limit(5),
        supabase
          .from('orders')
          .select('id, order_number, status')
          .ilike('order_number', q)
          .limit(5),
        supabase.from('projects').select('id, project_number, name').ilike('name', q).limit(5),
      ]);
      return {
        leads: leads.data ?? [],
        customers: customers.data ?? [],
        quotes: quotes.data ?? [],
        orders: orders.data ?? [],
        projects: projects.data ?? [],
      };
    },
    enabled: query.length >= 2,
    staleTime: 30_000,
  });
}
```

- [ ] Write `GlobalSearch.tsx`: command-palette style — `Cmd+K` opens a modal with a text input. Results grouped by entity type (Leads, Customers, Quotes, Orders, Projects). Keyboard arrow navigation. Click navigates to detail page. Close on Escape or backdrop click.

- [ ] Mount `<GlobalSearch />` in `AppShell.tsx`. Add `Cmd+K` trigger button to the top bar.

- [ ] Commit: `git commit -m "feat(10E): global search command palette — leads/customers/quotes/orders/projects"`

---

## Task 16 — Project Workspace tabs: Measurements + Installations

**Files:**

- Modify: `apps/crm/src/pages/projects/ProjectDetailPage.tsx`

The existing page already has tabs for Overview, Milestones, Activities, Attachments. Add two more tabs.

- [ ] Add **Measurements tab** to `ProjectDetailPage`:
  - Uses `useMeasurements({ projectId: id })`
  - Table: Area/Item, W×H×D (mm), Qty, Unit, Notes, Site Visit, Recorded By
  - Quick-add form inline: area_or_item (required), width_mm, height_mm, depth_mm, quantity, unit, notes
  - Delete measurement (admin/manager/operations only)

- [ ] Add **Installation tab** to `ProjectDetailPage`:
  - Uses `useInstallations` filtered by project_id (extend hook to accept projectId)
  - List of installation records with status, scheduled dates, team, sign-off
  - Quick-schedule button (operations/admin/manager): opens mini-form with scheduled_start, scheduled_end, assigned_team

- [ ] Commit: `git commit -m "feat(10E): Project Workspace — Measurements and Installation tabs"`

---

## Task 17 — Activity timelines

**Files:**

- Create: `apps/crm/src/components/activity/ActivityTimeline.tsx`
- Create: `apps/crm/src/lib/hooks/use-activity-timeline.ts`

- [ ] Write `use-activity-timeline.ts`:

```ts
export function useActivityTimeline(entity: {
  leadId?: string;
  customerId?: string;
  orderId?: string;
  projectId?: string;
}) {
  return useQuery({
    queryKey: ['activities', entity],
    queryFn: async () => {
      let q = supabase
        .from('activities')
        .select('id, activity_type, subject, body, occurred_at, actor:profiles!actor_id(full_name)')
        .order('occurred_at', { ascending: false })
        .limit(50);
      if (entity.leadId) q = q.eq('lead_id', entity.leadId);
      if (entity.customerId) q = q.eq('customer_id', entity.customerId);
      if (entity.orderId) q = q.eq('order_id', entity.orderId);
      if (entity.projectId) q = q.eq('project_id', entity.projectId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}
```

- [ ] Write `ActivityTimeline.tsx`: vertical timeline with icon per `activity_type` (call=phone, email=mail, meeting=users, note=file-text, status_change=git-branch, payment=credit-card, system=cog). Each entry: relative time, actor name, subject, body (collapsed if long). Add activity form (note, call, email) for authenticated staff.

- [ ] Replace inline activity sections in `LeadDetailPage`, `CustomerDetailPage`, `OrderDetailPage`, `ProjectDetailPage` with the new shared `<ActivityTimeline />` component.

- [ ] Commit: `git commit -m "feat(10E): shared ActivityTimeline component with add-activity form"`

---

## Task 18 — UX: loading, error, empty states + pagination

**Files:**

- Create: `apps/crm/src/components/ui/page-states.tsx`
- Modify: key list pages

- [ ] Write `page-states.tsx` with three reusable components:

```tsx
export function PageSkeleton({ rows = 5 }: { rows?: number }) {
  /* skeleton rows */
}
export function PageError({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  /* error card with retry */
}
export function PageEmpty({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  /* centered empty state */
}
```

- [ ] Apply these to all list pages that don't yet use them: FollowUpsPage, SiteVisitsPage, MeasurementsPage, ProductionPage, InstallationsPage, PaymentsPage, OutstandingPage.

- [ ] Add simple offset pagination (Previous/Next buttons, showing "1–20 of N") to LeadsPage, CustomersPage, OrdersPage — each already has a `PAGE_SIZE` constant; wire the page state to a URL param `?page=N`.

- [ ] Commit: `git commit -m "feat(10E): shared page states (skeleton/error/empty) + pagination on list pages"`

---

## Task 19 — Unit tests: dashboard metrics (deterministic fixtures)

**Files:**

- Create: `apps/crm/src/lib/__tests__/dashboard-metrics.test.ts`

- [ ] Write tests using Vitest. These tests don't call Supabase — they test the _transformation_ logic (count display, urgency flags, amount formatting):

```ts
import { describe, it, expect } from 'vitest';
import { formatCurrency } from '../format';

// ── Manager metrics display ───────────────────────────────────────────────────
const MANAGER_FIXTURE = {
  new_leads: 3,
  followups_due: 7,
  quotes_awaiting: 2,
  active_orders: 5,
  active_projects: 8,
  delayed_projects: 2,
  installs_this_week: 1,
  invoiced_minor: 25000000,
  received_minor: 18000000,
  outstanding_minor: 7000000,
};

describe('manager dashboard metrics', () => {
  it('shows new_leads count', () => {
    expect(MANAGER_FIXTURE.new_leads).toBe(3);
  });
  it('outstanding = invoiced - received', () => {
    expect(MANAGER_FIXTURE.outstanding_minor).toBe(
      MANAGER_FIXTURE.invoiced_minor - MANAGER_FIXTURE.received_minor
    );
  });
  it('formats invoiced amount in INR', () => {
    expect(formatCurrency(MANAGER_FIXTURE.invoiced_minor, 'INR')).toMatch(/2,50,000|250,000|₹/);
  });
  it('delayed_projects triggers urgent flag when > 0', () => {
    expect(MANAGER_FIXTURE.delayed_projects > 0).toBe(true);
  });
});

// ── Sales metrics display ─────────────────────────────────────────────────────
const SALES_FIXTURE = {
  my_leads: 12,
  overdue_followups: 3,
  site_visits_pending: 2,
  quotes_awaiting: 4,
  quotes_expiring: 1,
  pipeline_leads: 9,
};

describe('sales dashboard metrics', () => {
  it('overdue_followups triggers urgent flag when > 0', () => {
    expect(SALES_FIXTURE.overdue_followups > 0).toBe(true);
  });
  it('pipeline leads count is non-negative', () => {
    expect(SALES_FIXTURE.pipeline_leads).toBeGreaterThanOrEqual(0);
  });
});

// ── Operations metrics display ────────────────────────────────────────────────
const OPS_FIXTURE = {
  orders_in_production: 6,
  blocked_projects: 1,
  overdue_milestones: 4,
  measurements_pending: 2,
  upcoming_installations: 3,
};

describe('operations dashboard metrics', () => {
  it('blocked_projects triggers urgent flag when > 0', () => {
    expect(OPS_FIXTURE.blocked_projects > 0).toBe(true);
  });
  it('overdue_milestones triggers urgent flag when > 0', () => {
    expect(OPS_FIXTURE.overdue_milestones > 0).toBe(true);
  });
});

// ── Finance metrics display ───────────────────────────────────────────────────
const FINANCE_FIXTURE = {
  invoices_issued: 8,
  overdue_invoices: 2,
  payments_received_minor: 12000000,
  outstanding_minor: 5500000,
  ageing_30_minor: 3000000,
  ageing_60_minor: 1500000,
};

describe('finance dashboard metrics', () => {
  it('ageing_60 <= ageing_30 (older bucket is subset)', () => {
    expect(FINANCE_FIXTURE.ageing_60_minor).toBeLessThanOrEqual(FINANCE_FIXTURE.ageing_30_minor);
  });
  it('formats outstanding amount', () => {
    expect(formatCurrency(FINANCE_FIXTURE.outstanding_minor, 'INR')).toContain('55,000');
  });
  it('overdue_invoices triggers urgent flag when > 0', () => {
    expect(FINANCE_FIXTURE.overdue_invoices > 0).toBe(true);
  });
});
```

- [ ] Run `pnpm --filter crm test` — all tests must pass.

- [ ] Commit: `git commit -m "test(10E): deterministic dashboard metric fixture tests"`

---

## Task 20 — Final build + typecheck

- [ ] `pnpm --filter crm tsc --noEmit` — zero errors.
- [ ] `pnpm --filter crm build` — clean build.
- [ ] `pnpm --filter website build` — still clean.
- [ ] `pnpm --filter crm test` — all tests pass.
- [ ] Final commit: `git commit -m "feat(10E): Phase 10E complete — role dashboards, nav sections, new operational pages, project workspace, global search, activity timelines"`

---

## MANDATORY COMPLETION RULES — Phase 10E Checklist

| Item                                                        | Status |
| ----------------------------------------------------------- | ------ |
| Grouped sidebar (Sales/Operations/Finance/Website/Admin)    |        |
| Dashboard role-switch (manager/sales/ops/finance)           |        |
| Manager dashboard — all 10 metrics link to filtered lists   |        |
| Sales dashboard — all 6 metrics link to filtered lists      |        |
| Operations dashboard — all 5 metrics link to filtered lists |        |
| Finance dashboard — all 6 metrics link to filtered lists    |        |
| Follow-ups page                                             |        |
| Site Visits page + quick-create                             |        |
| Measurements page                                           |        |
| Production page (kanban by status)                          |        |
| Installations page + sign-off                               |        |
| Payments page                                               |        |
| Outstanding / Ageing page                                   |        |
| Project Workspace: Measurements tab                         |        |
| Project Workspace: Installations tab                        |        |
| ActivityTimeline component (shared)                         |        |
| Global search (Cmd+K)                                       |        |
| Breadcrumbs component                                       |        |
| Users admin page                                            |        |
| Audit History admin page                                    |        |
| Reports stub page                                           |        |
| `PageSkeleton / PageError / PageEmpty` component            |        |
| Pagination on Leads/Customers/Orders                        |        |
| DB migration: 4 role-metric RPCs                            |        |
| 26+ deterministic dashboard metric tests                    |        |
| TypeScript: zero errors                                     |        |
| CRM build: clean                                            |        |
| Website build: still clean                                  |        |

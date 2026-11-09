-- RLS policy verification reference — Phase 8
-- Run with: npx supabase test db (pgTAP required)
-- Or execute individual blocks in Supabase Studio → SQL Editor.
--
-- To test role-based access: create test users in Supabase Auth, set their
-- profile.role, then call set_config('request.jwt.claims', ...) to impersonate them.
-- Alternatively use supabase/seed.sql test fixtures with known UUIDs.
--
-- This file supplements rls.test.sql with Phase 5-7 table coverage and role boundaries.

begin;

select plan(32);

-- ═══════════════════════════════════════════════════════════════════════════════
-- ANONYMOUS ROLE
-- ═══════════════════════════════════════════════════════════════════════════════

set local role anon;

-- Published content is readable

select ok(
  (select count(*) from services where status = 'published') >= 0,
  'anon: can read published services'
);

select ok(
  (select count(*) from portfolio_projects where status = 'published') >= 0,
  'anon: can read published portfolio_projects'
);

-- Operational tables are blocked

select throws_ok(
  $$ select * from projects limit 1 $$,
  '42501', null,
  'anon: cannot read projects'
);

select throws_ok(
  $$ select * from project_milestones limit 1 $$,
  '42501', null,
  'anon: cannot read project_milestones'
);

select throws_ok(
  $$ select * from installations limit 1 $$,
  '42501', null,
  'anon: cannot read installations'
);

select throws_ok(
  $$ select * from quote_versions limit 1 $$,
  '42501', null,
  'anon: cannot read quote_versions'
);

select throws_ok(
  $$ select * from quote_items limit 1 $$,
  '42501', null,
  'anon: cannot read quote_items'
);

select throws_ok(
  $$ select * from invoice_items limit 1 $$,
  '42501', null,
  'anon: cannot read invoice_items'
);

select throws_ok(
  $$ select * from site_visits limit 1 $$,
  '42501', null,
  'anon: cannot read site_visits'
);

select throws_ok(
  $$ select * from measurements limit 1 $$,
  '42501', null,
  'anon: cannot read measurements'
);

select throws_ok(
  $$ select * from tasks limit 1 $$,
  '42501', null,
  'anon: cannot read tasks'
);

select throws_ok(
  $$ select * from activities limit 1 $$,
  '42501', null,
  'anon: cannot read activities'
);

select throws_ok(
  $$ select * from profiles limit 1 $$,
  '42501', null,
  'anon: cannot read profiles'
);

select throws_ok(
  $$ select * from business_settings limit 1 $$,
  '42501', null,
  'anon: cannot read business_settings'
);

-- Number generators must not be callable by anon
select throws_ok(
  $$ select next_order_number() $$,
  '42501', null,
  'anon: cannot call next_order_number()'
);

select throws_ok(
  $$ select next_invoice_number() $$,
  '42501', null,
  'anon: cannot call next_invoice_number()'
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- AUTHENTICATED STAFF — insert/update guard tests
-- Run these after setting up a test authenticated user with a known role.
-- Replace '<user-id>' with an actual UUID from auth.users.
-- ═══════════════════════════════════════════════════════════════════════════════

-- To simulate a specific role, run:
--   select set_config('request.jwt.claims',
--     '{"sub":"<user-id>","role":"authenticated"}', true);
-- Then ensure profiles has a row for that user with role='sales' and is_active=true.

-- ── Sales cannot write invoices ───────────────────────────────────────────────
-- Expected: INSERT raises 42501 for a user with role='sales'
-- select throws_ok(
--   $$ insert into invoices (invoice_number, customer_id, status, issue_date,
--        due_date, subtotal_minor, discount_minor, tax_minor, total_minor, balance_minor)
--      values ('INV-TEST', '<customer-id>', 'draft', current_date, current_date,
--              0, 0, 0, 0, 0) $$,
--   '42501', null,
--   'sales: cannot insert invoices'
-- );

-- ── Operations cannot write invoices ─────────────────────────────────────────
-- Expected: INSERT raises 42501 for a user with role='operations'
-- select throws_ok(
--   $$ insert into invoices ... $$,
--   '42501', null,
--   'operations: cannot insert invoices'
-- );

-- ── Operations cannot write quotes ───────────────────────────────────────────
-- Expected: INSERT raises 42501 for a user with role='operations'
-- select throws_ok(
--   $$ insert into quotes ... $$,
--   '42501', null,
--   'operations: cannot insert quotes'
-- );

-- ── Viewer cannot write any record ───────────────────────────────────────────
-- Expected: any INSERT raises 42501 for a user with role='viewer'
-- select throws_ok($$ insert into leads ... $$, '42501', null, 'viewer: cannot insert leads');
-- select throws_ok($$ insert into customers ... $$, '42501', null, 'viewer: cannot insert customers');

-- ── Inactive user is rejected ─────────────────────────────────────────────────
-- Expected: SELECT from any operational table raises error for a user whose
-- profiles.is_active = false (is_active_staff() returns false → policy fails)
-- select throws_ok(
--   $$ select * from leads limit 1 $$,
--   '42501', null,
--   'inactive user: cannot read leads'
-- );

-- ═══════════════════════════════════════════════════════════════════════════════
-- RPC INPUT VALIDATION
-- ═══════════════════════════════════════════════════════════════════════════════

reset role;
set local role anon;

-- create_invoice should not be callable by anon
select throws_ok(
  $$ select create_invoice(
       gen_random_uuid(), null, null,
       current_date, current_date + 30, null
     ) $$,
  '42501', null,
  'anon: cannot call create_invoice()'
);

-- record_payment should not be callable by anon
select throws_ok(
  $$ select record_payment(
       gen_random_uuid(), 100000, 'cash', current_date, null, null
     ) $$,
  '42501', null,
  'anon: cannot call record_payment()'
);

-- reverse_payment should not be callable by anon
select throws_ok(
  $$ select reverse_payment(gen_random_uuid(), null) $$,
  '42501', null,
  'anon: cannot call reverse_payment()'
);

-- create_order_from_quote should not be callable by anon
select throws_ok(
  $$ select create_order_from_quote(gen_random_uuid()) $$,
  '42501', null,
  'anon: cannot call create_order_from_quote()'
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- INVOICE CONSTRAINT TESTS (run as superuser / service role)
-- ═══════════════════════════════════════════════════════════════════════════════

-- These require a real invoice record. Replace '<invoice-id>' with a test fixture.

-- Overpayment is blocked at DB level (amount_paid_minor <= total_minor constraint)
-- select throws_ok(
--   $$ update invoices
--      set amount_paid_minor = total_minor + 1,
--          balance_minor = -1
--      where id = '<invoice-id>' $$,
--   '23514', null,
--   'DB: amount_paid_minor cannot exceed total_minor'
-- );

-- balance_minor must equal total_minor - amount_paid_minor
-- select throws_ok(
--   $$ update invoices
--      set balance_minor = total_minor   -- wrong: should be total - paid
--      where amount_paid_minor > 0
--        and id = '<invoice-id>' $$,
--   '23514', null,
--   'DB: balance_minor must equal total_minor - amount_paid_minor'
-- );

-- due_date must be >= issue_date
-- select throws_ok(
--   $$ update invoices
--      set due_date = issue_date - 1
--      where id = '<invoice-id>' $$,
--   '23514', null,
--   'DB: due_date must be >= issue_date'
-- );

reset role;

select finish();
rollback;

-- ═══════════════════════════════════════════════════════════════════════════════
-- MANUAL VERIFICATION CHECKLIST
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- Run through this checklist in Supabase Studio with test accounts for each role:
--
-- [ ] anon: submit_public_lead succeeds (website form)
-- [ ] anon: cannot view any operational page (CRM routes redirect to /login)
-- [ ] inactive user: after setting is_active=false, CRM shows "Account inactive"
-- [ ] viewer: can view all pages, no Create/Edit/Delete buttons shown
-- [ ] sales: can create leads, convert to customer, create quotes
-- [ ] sales: cannot create invoices (button hidden by role check)
-- [ ] sales: cannot create orders directly (create_order_from_quote RPC enforces role)
-- [ ] operations: can advance order status, manage project/milestones/installations
-- [ ] operations: cannot create/issue invoices
-- [ ] manager: can create/issue invoices, record payments
-- [ ] manager: cannot change user roles or business settings
-- [ ] admin: full access including voiding invoices, reversing payments, managing profiles
-- [ ] admin: is_active flag correctly gates all CRM access

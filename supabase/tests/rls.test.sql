-- RLS tests — run with: npx supabase test db
-- These tests verify the access control matrix from the skill's database-schema.md.
-- They use the pgTAP test framework included with Supabase local.

begin;

select plan(14);

-- ─── Anonymous can read published content ─────────────────────────────────────

set local role anon;

select ok(
  (select count(*) from services where status = 'published') >= 0,
  'anon can select published services'
);

select ok(
  (select count(*) from portfolio_projects where status = 'published') >= 0,
  'anon can select published portfolio projects'
);

-- ─── Anonymous cannot read operational records ────────────────────────────────

select throws_ok(
  $$ select * from leads limit 1 $$,
  '42501',
  null,
  'anon cannot select leads'
);

select throws_ok(
  $$ select * from customers limit 1 $$,
  '42501',
  null,
  'anon cannot select customers'
);

select throws_ok(
  $$ select * from quotes limit 1 $$,
  '42501',
  null,
  'anon cannot select quotes'
);

select throws_ok(
  $$ select * from orders limit 1 $$,
  '42501',
  null,
  'anon cannot select orders'
);

select throws_ok(
  $$ select * from invoices limit 1 $$,
  '42501',
  null,
  'anon cannot select invoices'
);

select throws_ok(
  $$ select * from payments limit 1 $$,
  '42501',
  null,
  'anon cannot select payments'
);

-- ─── Anonymous cannot insert directly into leads ──────────────────────────────

select throws_ok(
  $$ insert into leads (full_name, phone, project_description)
     values ('Test', '1234567890', 'Test description') $$,
  '42501',
  null,
  'anon cannot directly insert into leads'
);

-- ─── submit_public_lead RPC rejects invalid input ─────────────────────────────

select throws_ok(
  $$ select submit_public_lead('', null, null, null) $$,
  'P0002',
  'full_name is required',
  'submit_public_lead rejects blank full_name'
);

select throws_ok(
  $$ select submit_public_lead('Test User', null, null, null) $$,
  'P0002',
  'At least one contact method is required',
  'submit_public_lead rejects missing contact method'
);

select throws_ok(
  $$ select submit_public_lead('Test User', 'test@example.com', null, null, null, null, null, null, null, '') $$,
  'P0002',
  'project_description is required',
  'submit_public_lead rejects blank project_description'
);

-- ─── Anonymous cannot read services that are not published ────────────────────

select is(
  (select count(*)::int from services where status = 'draft'),
  0,
  'anon cannot see draft services (RLS filters them)'
);

-- ─── Audit log is not accessible to anon ──────────────────────────────────────

select throws_ok(
  $$ select * from audit_log limit 1 $$,
  '42501',
  null,
  'anon cannot select audit_log'
);

select finish();
rollback;

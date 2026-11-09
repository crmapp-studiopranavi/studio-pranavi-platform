# Security and Operations

## Architecture security summary

- All frontend code uses the Supabase anonymous key only — never the service-role key
- Service-role keys are never in frontend code, `.env.example`, or version control
- Row Level Security (RLS) is enabled on every operational table
- All privileged operations go through `SECURITY DEFINER` RPCs that verify role internally
- All `SECURITY DEFINER` functions use `set search_path = ''` to prevent search-path injection
- Quote versions become immutable after being sent (`prevent_sent_version_mutation` trigger)
- Payment amounts are validated server-side (`apply_payment` RPC) to prevent overpayment
- No customer data, payment references, or contact details should be sent to analytics

## Roles and access

| Role       | Leads | Customers | Quotes | Orders | Projects | Invoices | Payments | Admin |
| ---------- | ----- | --------- | ------ | ------ | -------- | -------- | -------- | ----- |
| anonymous  | ✗     | ✗         | ✗      | ✗      | ✗        | ✗        | ✗        | ✗     |
| viewer     | R     | R         | R      | R      | R        | R        | R        | ✗     |
| sales      | CRUD  | CRUD      | CRUD   | R      | R        | R        | R        | ✗     |
| operations | R     | R         | R      | CRUD   | CRUD     | R        | R        | ✗     |
| manager    | CRUD  | CRUD      | CRUD   | CRUD   | CRUD     | CRUD     | CRUD     | ✗     |
| admin      | CRUD  | CRUD      | CRUD   | CRUD   | CRUD     | CRUD     | CRUD     | ✓     |

R = read-only, CRUD = create/read/update (delete is admin-only), ✗ = no access, ✓ = exclusive access

## RLS verification

Run the pgTAP tests against a local Supabase instance:

```bash
npx supabase test db
```

This runs `supabase/tests/rls.test.sql` (automated) and the manual checklist in
`supabase/tests/rls_policies.sql`.

## User deactivation

To immediately revoke a staff member's access:

1. In Supabase Auth dashboard: disable the user account
2. Set `is_active = false` in the `profiles` table
3. The `is_active_staff()` function used by all RLS policies will reject them on their next request

Both steps are recommended: Auth prevents new sessions, `is_active` blocks existing sessions.

## Quote and invoice immutability

- Quote versions are immutable after `sent_at` is set — the `prevent_sent_version_mutation`
  trigger blocks UPDATE on `quote_versions` and `prevent_sent_item_mutation` blocks UPDATE on
  `quote_items` for sent versions.
- Issued invoices cannot have items added or recalculated — `recalculate_invoice_totals`
  checks `status = 'draft'` before proceeding.
- Payments are never deleted — only reversed via `reverse_payment()` RPC, which creates an
  audit activity and recalculates the invoice balance atomically.

## Backup and recovery

Supabase provides daily automated backups on paid plans. Additional steps:

```bash
# Export full database (run from server or CI, not from frontend)
supabase db dump --db-url "$DATABASE_URL" > backup_$(date +%Y%m%d).sql

# Restore to a staging project for testing
psql "$STAGING_DATABASE_URL" < backup_YYYYMMDD.sql
```

Always test restoration on a staging project before any major migration.

## Data retention guidelines

| Table       | Retention policy                                        |
| ----------- | ------------------------------------------------------- |
| leads       | Archive (`archived_at`) after 2 years of inactivity     |
| customers   | Retain indefinitely; soft-delete only (`archived_at`)   |
| quotes      | Immutable versions retained; archive superseded quotes  |
| orders      | Retain indefinitely; archive completed orders           |
| invoices    | Retain indefinitely per business records requirements   |
| payments    | Never delete; only reverse via `reverse_payment()` RPC  |
| attachments | Clean up orphaned storage objects when records archived |
| activities  | Retain indefinitely (append-only audit trail)           |

## Incident response

1. **Suspected data breach**: immediately rotate Supabase project API keys in the dashboard
   (Settings → API → Regenerate). The service-role key regeneration invalidates all tokens.
2. **Compromised staff account**: disable in Supabase Auth + set `is_active = false` in profiles.
3. **Suspicious activity**: review the `audit_log` table and `activities` table for anomalies.
4. **Infrastructure incident**: contact Supabase support at https://supabase.com/support

## Production deployment checklist

Before going live:

- [ ] `VITE_SUPABASE_ANON_KEY` set in Cloudflare Pages env vars — NOT the service-role key
- [ ] `VITE_SUPABASE_URL` points to the production Supabase project
- [ ] All 17 migrations applied: `supabase db push --db-url $PRODUCTION_DB_URL`
- [ ] RLS enabled on all tables: verify in Supabase Dashboard → Authentication → Policies
- [ ] First admin user created in Supabase Auth; profile row inserted with `role = 'admin'`
- [ ] Supabase Auth → URL Configuration → Site URL and Redirect URLs set for production domain
- [ ] Cloudflare Pages SPA fallback rule configured (`/* → /index.html`, HTTP 200)
- [ ] Full smoke path tested on production before announcing launch
- [ ] No `.env.local` or secrets committed to git: `git grep -r "SUPABASE_SERVICE_ROLE"`

## Environment variables

See `.env.example` for the complete list. Never commit actual values.

Key variables:

- `VITE_SUPABASE_URL` — public, safe in browser builds
- `VITE_SUPABASE_ANON_KEY` — public, safe in browser builds (RLS enforces security)
- `SUPABASE_SERVICE_ROLE_KEY` — **server/CI only**, never in frontend apps or git

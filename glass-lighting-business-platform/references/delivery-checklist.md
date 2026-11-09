# Delivery Checklist

## Phase 1: Foundation

- Repository/workspace builds
- Shared design tokens and navigation shells
- Supabase local/remote configuration documented
- Auth and roles implemented
- Initial schema, RLS, and seed data

## Phase 2: Public experience

- Home, services, portfolio, about, contact, quote form
- Responsive images and metadata
- Quote request persists as a lead
- Upload, validation, spam mitigation, and consent handling

## Phase 3: CRM MVP

- Dashboard
- Leads and activities
- Customers
- Tasks/follow-ups
- Quotations and calculation tests
- Order/project conversion
- Basic invoice/payment tracking

## Phase 4: Operations

- Site visits and measurements
- Project milestones
- Installation scheduling
- Content administration
- Audit trail and exports if requested

## Phase 5: Production readiness

- Lint, type check, tests, production builds
- RLS negative tests
- Backup/recovery and data export considerations documented
- Error monitoring and analytics configured only with user-approved providers
- Cloudflare preview deployments tested
- Custom domains and redirects configured
- Smoke test on mobile and desktop

## Required smoke path

1. Open public website.
2. Browse a published service and portfolio project.
3. Submit a valid quote request with an optional image.
4. Sign in to CRM.
5. Confirm the lead and attachment are visible only to authorized staff.
6. Add activity and follow-up.
7. Convert to customer, create and send a quote version.
8. Mark quote won and create order/project once.
9. Record an invoice and partial payment; verify balance.
10. Confirm public users cannot read any operational record.

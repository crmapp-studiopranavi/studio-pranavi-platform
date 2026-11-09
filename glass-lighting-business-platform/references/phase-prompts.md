# Claude Code Phase Prompts

Run one phase at a time from the repository root. Review each phase's output and commit before proceeding. Replace bracketed values only when known.

## Master prompt: full platform orchestration

```text
/glass-lighting-business-platform

Act as the lead engineer for this repository. Build a production-oriented platform for a custom decorative glass and decorative lighting startup using the skill's requirements.

The platform has two independently deployable applications:
1. Public customer website for services, portfolio, contact, and quote requests.
2. Private CRM for leads, customers, follow-ups, quotations, orders, projects, site visits, installation, invoices, and payments.

Default architecture for a new repository:
- pnpm TypeScript monorepo
- React + Vite
- Tailwind CSS + shadcn/ui
- React Router, TanStack Query, React Hook Form, Zod
- Supabase PostgreSQL, Auth, Storage, and Edge Functions/RPCs where required
- Cloudflare Pages for the public website and CRM

First inspect the repository and preserve any sound existing architecture. Read all references in this skill, especially database-schema.md and delivery-checklist.md. Provide a concise gap assessment and phased plan, then implement only the requested phase. Do not invent business claims, customer data, testimonials, project images, contact details, or credentials. Use clearly labeled editable placeholders.

For every phase:
- implement complete vertical slices, not disconnected mock screens;
- use real persistence and authorization where the phase requires it;
- write timestamped migrations and regenerate database types;
- add loading, empty, error, success, responsive, and accessible states;
- test security boundaries and business calculations;
- run formatter, lint, typecheck, tests, and production builds that apply;
- fix failures introduced by your changes;
- finish with changed files, migrations, commands/results, remaining configuration, risks, and the exact next-phase prompt.

Never expose a Supabase service-role key in frontend code. Never claim deployment unless it succeeded and you have the returned URL.
```

## Phase 0: Discovery and implementation blueprint

```text
/glass-lighting-business-platform

Execute Phase 0 only: discovery and blueprint. Do not perform a broad rewrite.

1. Inspect README files, package manifests, application folders, routing, styling, database files, environment examples, tests, CI, and deployment configuration.
2. Identify what already works and what is missing for the two-app platform.
3. Compare the repository against the skill's product requirements, architecture, detailed database schema, security rules, and delivery checklist.
4. Decide whether to preserve the existing stack or use the default pnpm/React/Vite/Supabase/Cloudflare architecture. Explain any deviation with repository evidence.
5. Produce an implementation blueprint containing:
   - target repository tree;
   - application and package boundaries;
   - route map for website and CRM;
   - database migration sequence;
   - RLS and storage strategy;
   - testing strategy;
   - deployment topology for www.[domain] and crm.[domain];
   - risks, assumptions, and missing credentials/content.
6. Create or update only foundational documentation and .env.example if useful. Do not implement feature UI in this phase.
7. Run existing checks to establish a baseline and report failures without hiding them.

Stop after the Phase 0 blueprint and provide the exact Phase 1 prompt.
```

## Phase 1: Workspace, design foundation, database, and authentication

```text
/glass-lighting-business-platform

Execute Phase 1 only: establish the working foundation.

Read references/architecture.md, references/database-schema.md, references/data-model.md, references/design-system.md, and references/delivery-checklist.md before editing.

Requirements:
1. Preserve the existing structure when sound. Otherwise establish the pnpm monorepo with apps/website, apps/crm, packages/ui, packages/types, and supabase/migrations.
2. Configure TypeScript, linting, formatting, shared environment validation, path aliases, and development/build commands.
3. Implement shared design tokens and accessible application shells. The website should feel premium and handcrafted; the CRM should prioritize operational clarity.
4. Create timestamped Supabase migrations for:
   - extensions and enums;
   - profiles and business_settings;
   - services, portfolio_projects, portfolio_images, testimonials;
   - leads, customers, customer_contacts, addresses;
   - activities, tasks, site_visits, measurements;
   - quotes, quote_versions, quote_items;
   - orders, projects, project_milestones, installations;
   - invoices, invoice_items, payments;
   - attachments, notification_outbox, and audit_log;
   - updated_at triggers, constraints, indexes, storage buckets, and initial RLS.
5. Implement safe document-number generation and helper functions using sequences or locked counters, never max()+1.
6. Generate TypeScript database types.
7. Implement Supabase Auth in the CRM with sign-in, sign-out, session restoration, protected routes, inactive-user rejection, role-aware navigation, and an admin-safe profile bootstrap approach.
8. Add minimal clearly labeled development seed data. Never insert realistic personal data.
9. Add database/RLS tests for anonymous published-content access, CRM denial, inactive profiles, and role boundaries.
10. Document local Supabase setup and environment variables without placing secrets in the repository.

Acceptance criteria:
- both apps start and build;
- unauthenticated users cannot enter CRM routes;
- every exposed operational table has RLS enabled;
- anonymous users cannot read leads/customers/quotes/orders/invoices/payments;
- migrations apply cleanly from an empty database;
- lint, typecheck, tests, and builds pass or pre-existing failures are clearly separated.

Stop after Phase 1 and provide the exact Phase 2 prompt.
```

## Phase 2: Public website and managed portfolio

```text
/glass-lighting-business-platform

Execute Phase 2 only: build the production-quality public customer website on top of the Phase 1 foundation.

Requirements:
1. Implement routes for Home, Services, individual Service, Portfolio, individual Portfolio Project, About, Contact, Get a Quote, Privacy, and a useful 404.
2. Build a responsive header, mobile navigation, footer, click-to-call, configurable WhatsApp action, and repeated quote CTAs.
3. Home page sections: hero, service categories, featured portfolio, business process, trust section without invented claims, testimonial placeholders clearly marked until genuine content is supplied, and final CTA.
4. Load published services and portfolio projects from Supabase. Do not hard-code completed project claims.
5. Implement portfolio category filters, accessible gallery/lightbox behavior, responsive images, lazy loading, explicit dimensions where possible, alt text, and graceful empty states.
6. Add SEO titles/descriptions, canonical handling, Open Graph metadata, sitemap, robots.txt, semantic headings, and structured data only for verified business facts.
7. Implement Contact and initial Get a Quote UI with Zod validation, but leave final persistence/upload integration to Phase 3 unless it already exists cleanly.
8. Add content-management screens in the CRM for admins/managers to create, edit, publish, feature, order, archive, and upload media for services and portfolio projects.
9. Enforce public read of published records only. Draft and archived content must remain private.
10. Add responsive/accessibility tests and route smoke tests.

Acceptance criteria:
- public pages work at 360px, tablet, and desktop widths;
- portfolio/services come from the database;
- admins can manage content without editing source code;
- draft records never appear publicly;
- no stock or generated image is represented as completed company work;
- production website build passes.

Stop after Phase 2 and provide the exact Phase 3 prompt.
```

## Phase 3: Public quote requests, uploads, and lead CRM

```text
/glass-lighting-business-platform

Execute Phase 3 only: connect public enquiries to a secure, usable lead-management workflow.

Requirements:
1. Complete the public quote form with name, at least one contact method, location, service, budget range, project description, preferred contact method, consent, and optional images.
2. Implement submit_public_lead as a narrowly granted, security-definer RPC or protected server endpoint. Set a safe search_path, validate all input server-side, insert lead and initial activity atomically, and return only a non-sensitive receipt identifier.
3. Add anti-abuse controls appropriate to the current architecture: honeypot, server validation, file limits/type allowlist, and rate-limiting or Cloudflare Turnstile integration behind configuration.
4. Store lead uploads in the private lead-uploads bucket using generated paths. Never expose public list/read access. Authorized CRM users receive short-lived signed URLs.
5. Build CRM lead table and kanban views with pagination, search, filters, owner, priority, source, status, next follow-up, and overdue indicators.
6. Build lead detail with contact details, request summary, attachments, activity timeline, notes, status transitions, assignment, loss reason, and next-action scheduling.
7. Implement tasks/follow-ups connected to leads and dashboard widgets for new leads and overdue follow-ups.
8. Add optional notification_outbox entry on submission. Do not claim email or WhatsApp delivery unless a provider is actually configured.
9. Add tests for valid/invalid/duplicate or retried submissions, anonymous read denial, private files, CRM access, and mobile form behavior.

Acceptance criteria:
- a website enquiry creates one lead and one initial activity;
- the lead appears in the CRM without manual copying;
- public users cannot query the lead after submission;
- unauthorized users cannot download files;
- errors do not lose entered form data and success shows a receipt;
- lint, typecheck, tests, and both builds pass.

Stop after Phase 3 and provide the exact Phase 4 prompt.
```

## Phase 4: Customers, site visits, measurements, activities, and tasks

```text
/glass-lighting-business-platform

Execute Phase 4 only: implement lead qualification and customer operations.

Requirements:
1. Implement convert_lead_to_customer as an idempotent transaction. It must create or link the customer, contact, and address as appropriate, update the lead, and add activity records without producing duplicates on retry.
2. Build customer list/detail/edit experiences with contacts, addresses, source lead, owner, notes, related activities, tasks, quotes, orders, projects, invoices, and payments.
3. Build append-oriented activities for calls, email, WhatsApp, meetings, notes, and status changes. Restrict destructive edits and audit privileged correction.
4. Build tasks/follow-ups with assignee, due time, priority, status, related record, overdue state, filters, and dashboard visibility.
5. Build site-visit scheduling with start/end, address, assigned staff, purpose, status, notes, and completion.
6. Build structured measurements for area/item, dimensions in millimetres, quantity, notes, and attachment references.
7. Enforce role-aware access for sales and operations users according to the skill's RLS matrix.
8. Add validation for missing contact details, invalid schedules, negative measurements, archived customers, and unsafe deletion.
9. Add integration and RLS tests for conversion idempotency and role boundaries.

Acceptance criteria:
- lead conversion does not duplicate customers on retry;
- customer timeline and related work are navigable;
- site visits and measurements persist with validation;
- overdue tasks appear correctly;
- authorization is enforced in the database, not only the UI;
- all checks pass.

Stop after Phase 4 and provide the exact Phase 5 prompt.
```

## Phase 5: Quotations and customer-ready documents

```text
/glass-lighting-business-platform

Execute Phase 5 only: implement versioned quotations and trusted commercial calculations.

Requirements:
1. Build quotation list, create, detail, edit-draft, duplicate/revise, preview, send-state, accept/reject, expire, and archive flows.
2. Create quote identity separately from quote_versions. A sent version must be immutable; revisions create the next version.
3. Build line items for material, labour, installation, transport, and other charges with quantity, unit, unit price in minor currency units, discount, tax rate, and totals.
4. Recalculate subtotal, discount, tax, and total in trusted server/database code. Treat client totals as display only.
5. Store an issue-time snapshot of customer name, contact, and address so historical quotations do not change when customer data changes.
6. Provide a professional print/PDF-ready quotation layout with brand settings, quote number, dates, line items, totals, terms, and customer-facing notes. Never include internal notes.
7. Implement quote statuses and valid transitions. Require rejection/loss context when appropriate and write activities/audit entries.
8. Add unit tests with worked cases for rounding, multiple tax rates, discounts, zero tax, and revision immutability.
9. Add role/RLS tests so authorized sales/management can work with quotes and public users cannot access them.

Acceptance criteria:
- totals are deterministic and tested;
- sent quote versions cannot be mutated;
- revisions preserve prior versions;
- preview output is customer-ready and excludes internal notes;
- quote actions appear in customer and lead timelines;
- all checks pass.

Stop after Phase 5 and provide the exact Phase 6 prompt.
```

## Phase 6: Orders, projects, production, and installation

```text
/glass-lighting-business-platform

Execute Phase 6 only: convert accepted work into delivery operations.

Requirements:
1. Implement create_order_from_quote as an idempotent transaction requiring an accepted quote version. Copy the commercial snapshot and prevent duplicate orders for the same accepted quote.
2. Build order list/detail with status, customer, accepted quotation, total, owner, dates, notes, activities, attachments, and related project.
3. Build project creation and management with project manager, scope, location, start/target/actual completion dates, status, risks/blocks, and internal notes.
4. Build ordered project milestones with assignee, due date, status, completion, and dashboard visibility.
5. Integrate site visits and measurements into the project record without duplicating source data.
6. Build production and installation workflow using the skill's default statuses. Add installation schedule, assigned team/lead installer, completion notes, and customer sign-off metadata.
7. Add dashboard widgets for active orders, blocked projects, upcoming installations, and overdue milestones.
8. Enforce valid status transitions and audit commercial/fulfilment changes.
9. Add integration tests for quote-to-order idempotency, project date validation, milestone ordering, and authorization.

Acceptance criteria:
- one accepted quote creates at most one order;
- project progress and upcoming installation are visible;
- operations users can manage assigned delivery records without receiving admin privileges;
- cancelled/archived records are preserved for history;
- all checks pass.

Stop after Phase 6 and provide the exact Phase 7 prompt.
```

## Phase 7: Invoices, payments, balances, and operational reporting

```text
/glass-lighting-business-platform

Execute Phase 7 only: implement receivables tracking, not online payment processing.

Requirements:
1. Build invoices with version-safe customer snapshot, items, issue/due date, subtotal, discount, tax, total, amount paid, balance, and statuses.
2. Reuse trusted calculation patterns from quotations; never accept client-calculated totals as authoritative.
3. Build payment recording with amount in minor units, date, method, reference, status, notes, and recorder.
4. Apply or reverse a payment transactionally. Never hard-delete cleared payments. Reversal must create an audit/activity record and recalculate invoice status and balance.
5. Prevent accidental overpayment unless an explicit credit/advance workflow is implemented and documented.
6. Add customer/order/project links and dashboards for outstanding amount, overdue invoices, recent payments, and ageing buckets.
7. Use INR with en-IN display by default while keeping currency configurable. Do not claim GST compliance or generate tax filings unless explicitly scoped and verified.
8. Provide printable invoice output, clearly labeled as operational invoicing functionality rather than certified accounting software.
9. Add calculation, transaction, reversal, status, RLS, and reporting tests.

Acceptance criteria:
- partial payment produces the correct remaining balance and status;
- full payment marks the invoice paid;
- reversal restores the correct balance;
- public users cannot access billing data;
- reports reconcile to invoice/payment records;
- all checks pass.

Stop after Phase 7 and provide the exact Phase 8 prompt.
```

## Phase 8: Security hardening, testing, observability, and production readiness

```text
/glass-lighting-business-platform

Execute Phase 8 only: harden and verify the entire platform before deployment.

Requirements:
1. Review every table, view, function, storage bucket, edge function, and frontend route against the skill's RLS matrix and database schema.
2. Add negative authorization tests for anonymous, inactive, viewer, sales, operations, manager, and admin roles.
3. Review security-definer functions for fixed search_path, least privilege, input validation, and safe grants.
4. Verify no service-role key, token, local URL, customer fixture, or secret is present in git history under current control, frontend bundles, logs, or source maps.
5. Add end-to-end coverage for:
   public quote request -> CRM lead -> customer conversion -> site visit/measurement -> quote/version -> accepted quote -> order/project -> invoice -> partial/full payment.
6. Test error, loading, empty, offline/retry, validation, and duplicate-click/idempotency behavior.
7. Audit accessibility: keyboard navigation, focus, contrast, labels, errors, reduced motion, alt text, and mobile behavior at 360px.
8. Audit performance: responsive images, lazy loading, route splitting, pagination, query indexes, and avoid N+1 access.
9. Add safe error monitoring and analytics hooks only if providers are configured. Ensure customer descriptions, contact details, and payment references are not sent as analytics properties.
10. Document backup, restore, data export, retention, incident response, and user deactivation procedures appropriate to Supabase.
11. Run clean install, migration from empty database, seed, lint, typecheck, unit/integration/E2E tests, and production builds.

Acceptance criteria:
- the complete smoke path in delivery-checklist.md passes;
- RLS negative tests pass;
- clean migrations apply successfully;
- both production builds pass;
- critical accessibility and security findings are resolved or explicitly blocked with evidence;
- repository contains a precise deployment runbook.

Stop after Phase 8 and provide the exact Phase 9 prompt.
```

## Phase 9: Cloudflare and Supabase deployment

```text
/glass-lighting-business-platform

Execute Phase 9 only: prepare and, when credentials are available, perform production deployment.

Target topology:
- public website: www.[domain] on Cloudflare Pages
- CRM: crm.[domain] on a separate Cloudflare Pages project
- backend: Supabase production project
- source/CI: GitHub

Requirements:
1. Inspect existing deployment files and preserve working provider configuration unless migration was requested.
2. Create separate Cloudflare project configurations/build roots for website and CRM, including SPA fallback for CRM routes.
3. Document exact environment variables for both projects. Use Cloudflare/Supabase/GitHub secret stores; never commit values.
4. Apply production migrations through a controlled process. Do not run destructive reset commands against production.
5. Configure Supabase Auth site URL and allowed redirect URLs for production and approved previews.
6. Configure storage policies, CORS/allowed origins where applicable, and custom domains.
7. Add security headers, HTTPS redirects, cache rules for hashed assets, and safe no-store behavior for authenticated/private responses.
8. Deploy preview environments first and run the complete smoke path.
9. Promote/connect custom domains only after preview checks pass.
10. If credentials or domain access are unavailable, complete every repository-side setup and provide exact copy-paste commands and dashboard steps. Do not claim deployment.
11. If deployment succeeds, report actual URLs, deployment identifiers, migration status, smoke-test results, and rollback steps.

Acceptance criteria:
- website and CRM are independently deployable;
- production environment variables are configured outside source control;
- auth redirects and CRM deep links work;
- public quote submission reaches production CRM securely;
- only claim live status when verified through the returned deployment URLs.

Stop after Phase 9 with a production handover report.
```

## Optional Phase 10: Post-launch enhancements

```text
/glass-lighting-business-platform

Execute a scoped post-launch enhancement phase. First inspect product usage, support issues, and the current backlog. Do not add features merely because they are listed.

Evaluate and prioritize with explicit business value, effort, security, and operational impact:
- customer quotation approval portal;
- WhatsApp Business provider integration using approved templates;
- transactional email provider integration;
- online payment links through an India-appropriate provider;
- supplier and purchase-order tracking;
- inventory/material tracking;
- advanced lead-source and conversion reporting;
- calendar integration for site visits/installations;
- data export and accounting integration;
- AI-assisted lead summaries or follow-up drafts with human approval.

Select one coherent enhancement slice, write acceptance criteria, implement it end-to-end, and repeat all relevant security/testing/deployment checks. Do not turn the CRM into accounting, payroll, or tax-compliance software without a separate validated scope.
```

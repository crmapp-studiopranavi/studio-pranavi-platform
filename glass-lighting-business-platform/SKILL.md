---
name: glass-lighting-business-platform
description: build, extend, test, secure, and deploy a two-application platform for a custom decorative glass and lighting startup. Use when Claude Code is asked to create or modify the public portfolio and lead-generation website, the private CRM for leads, quotations, orders, projects, payments, site visits, and installations, the shared Supabase backend, or Cloudflare deployment. Also use for database migrations, role-based access, file uploads, responsive UI, seed data, quality checks, and production-readiness work for this business platform.
---

# Glass and Lighting Business Platform

Build a production-oriented business platform with two independently deployable apps sharing one secure backend:

- `apps/website`: public marketing, portfolio, services, contact, and quote-request experience.
- `apps/crm`: authenticated internal operations portal.
- `packages/ui`: shared visual tokens and reusable components.
- `packages/types`: shared domain and API types.
- `supabase`: SQL migrations, seed data, storage policies, and edge functions when needed.

Read the relevant reference before implementing:

- Product scope and user journeys: [references/product-requirements.md](references/product-requirements.md)
- Architecture and repository conventions: [references/architecture.md](references/architecture.md)
- Data model and security rules: [references/data-model.md](references/data-model.md)
- Detailed PostgreSQL/Supabase schema: [references/database-schema.md](references/database-schema.md)
- UI and content standards: [references/design-system.md](references/design-system.md)
- Delivery sequence and completion checks: [references/delivery-checklist.md](references/delivery-checklist.md)
- Copy-ready Claude Code prompts for every phase: [references/phase-prompts.md](references/phase-prompts.md)

## Operating rules

1. Inspect the repository before changing code. Preserve a working stack when it meets the requirements; do not rewrite a functioning app merely to match a preference.
2. If starting from scratch, use a TypeScript monorepo with `pnpm`, React, Vite, Tailwind CSS, shadcn/ui, React Router, TanStack Query, React Hook Form, Zod, and Supabase.
3. Keep the public website and CRM as separate deployable applications. Share types and visual primitives, not authorization assumptions.
4. Never expose service-role keys or privileged operations to browser code. Use public anonymous keys with Row Level Security, or protected server/edge functions for privileged operations.
5. Never use mock data silently. Seed/demo data must be clearly identified and removable.
6. Implement complete vertical slices. A feature is not complete until the UI, validation, persistence, authorization, loading/error/empty states, and tests work together.
7. Run the existing formatter, linter, type checker, tests, and production builds after meaningful changes. Fix introduced failures before stopping.
8. Do not claim deployment unless deployment actually succeeded and a public URL was returned. If credentials are unavailable, prepare deployment configuration and provide exact remaining commands.

## Default execution workflow

### 1. Discover

- Read `README`, package manifests, environment examples, migrations, and deployment files.
- Identify framework versions and available commands from the repository rather than guessing.
- Summarize detected architecture and state the smallest safe implementation plan.
- Ask only for information that blocks implementation, such as brand name, logo, or cloud credentials. Use editable placeholders for non-blocking content.

### 2. Establish the foundation

For a new repository, create this shape:

```text
apps/
  website/
  crm/
packages/
  ui/
  types/
supabase/
  migrations/
  seed.sql
.env.example
README.md
pnpm-workspace.yaml
```

Configure environment variables with safe placeholders:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_PUBLIC_SITE_URL=
VITE_CRM_URL=
```

Do not commit `.env`, `.env.local`, production secrets, access tokens, or customer data.

### 3. Build the public website

Prioritize visual credibility, mobile performance, trust, and lead conversion. Implement:

- Home page with polished hero, featured work, core services, process, trust signals, testimonials placeholder, and calls to action.
- Services pages for decorative glass, custom glass work, decorative lighting, custom lighting, installation, repair, and consultation where applicable.
- Filterable portfolio with project category, location, material, description, and optimized images.
- About and contact pages.
- Quote-request flow capturing name, phone, email, location, service, budget range, description, preferred contact method, and optional project images.
- Successful submission creates a `lead` with source `website`, an activity record, and uploaded attachments.
- Click-to-call and WhatsApp actions must be configurable, not hard-coded to fictitious values.
- SEO metadata, social preview metadata, sitemap, robots file, semantic headings, and accessible forms.

Do not make unverified marketing claims such as years in business, certifications, warranty length, project counts, or customer ratings. Mark unknown copy as editable content.

### 4. Build the CRM

Require authentication for all CRM routes. Implement the modules in this sequence:

1. Dashboard: new leads, follow-ups due, quotes awaiting response, active orders, outstanding payments, and pipeline summary.
2. Leads: table/kanban views, search, filters, owner, priority, source, next follow-up, notes, files, activity timeline, and conversion to customer/project.
3. Customers: contacts, addresses, communication history, related leads, quotes, orders, projects, invoices, and payments.
4. Quotations: line items, taxes/discounts, validity date, versioning, status, print-friendly view, and PDF-ready layout.
5. Orders and projects: status workflow, measurements, design references, production notes, milestones, target dates, installation scheduling, and attachments.
6. Payments: invoice total, received amount, balance, method, reference, due date, and status. Do not implement payment processing unless explicitly requested.
7. Tasks and follow-ups: assignee, due date, priority, status, and links to business records.
8. Administration: team members, roles, service catalogue, business settings, lead sources, and statuses.

Use this default pipeline unless the repository defines another:

```text
new -> contacted -> site_visit_scheduled -> site_visit_completed -> quote_drafting -> quote_sent -> negotiation -> won/lost
won -> order_confirmed -> design_or_measurement -> production -> ready_for_installation -> installation_scheduled -> installed -> completed
```

### 5. Secure the shared backend

- Use UUID primary keys and `created_at`/`updated_at` timestamps.
- Use foreign keys and database constraints for business integrity.
- Enable Row Level Security on every exposed table.
- Public anonymous access may read only published services and portfolio entries and may insert a tightly validated lead submission.
- Authenticated staff can access operational records according to role.
- Restrict staff administration and destructive actions to admins.
- Keep uploaded lead files private; serve them with short-lived signed URLs to authorized staff.
- Record important state changes in an append-only activity/audit table.
- Prefer soft deletion or archival for customers, quotes, orders, invoices, and payments.

Before changing schema or policies, read both [references/data-model.md](references/data-model.md) and [references/database-schema.md](references/database-schema.md).

### 6. Implement quality and UX states

For every data-driven view, include:

- Loading state or skeleton
- Empty state with a useful action
- Recoverable error state
- Success feedback
- Responsive mobile/tablet/desktop layout
- Keyboard navigation and visible focus
- Form labels, validation messages, and sensible tab order
- Confirmation for destructive actions

Store monetary amounts as integers in the smallest currency unit. Default display currency is INR and must use locale `en-IN`, but keep currency configurable.

### 7. Test and verify

At minimum:

- Unit-test domain calculations such as quote subtotal, discount, tax, total, received, and balance.
- Test form schemas and status transitions.
- Add integration coverage for quote submission and CRM authentication/authorization where the stack supports it.
- Add an end-to-end happy path: public quote request -> CRM lead -> qualification -> quote -> order/project.
- Run production builds for both apps.
- Check that no secret, service-role key, local URL, or test customer data is bundled into frontend assets.

### 8. Prepare deployment

Default target:

- Cloudflare Pages for `www.<domain>` and `crm.<domain>`.
- Supabase for PostgreSQL, Authentication, and Storage.
- GitHub for source control and CI/CD.

Create separate Cloudflare projects with distinct build roots and environment variables. Configure SPA route fallback for the CRM. Use custom domains only after preview deployments pass smoke tests.

If another provider is already configured, preserve it unless the user asks to migrate.

### 9. Report completion

End each implementation with:

- What changed
- Files and migrations added/modified
- Commands/tests run and their results
- Manual configuration still required
- Security or data assumptions
- Exact local run commands
- Deployment status and URLs only when actually available

## Definition of done

Do not mark the platform complete unless:

- Both applications build successfully.
- Public lead creation persists and appears in the CRM.
- CRM routes reject unauthenticated users.
- RLS prevents public reads of operational tables.
- Portfolio and services can be managed without code changes, or the limitation is explicitly documented for the current phase.
- Critical forms have validation and failure handling.
- Mobile navigation and key workflows work at 360px width.
- Environment setup and deployment steps are documented.

---
name: studio-pranavi-platform
description: "Build, enhance, test, secure, and deploy the complete Studio Pranavi digital platform: a premium customer-facing website inspired conceptually by sagarti.com and staydesigned.com, adapted to Studio Pranavi's actual lighting and glass work, plus a practical CRM for a 10–20 person team. Use for frontend redesign, CMS/media/branding, leads, customers, measurements, quotations, orders, projects, installations, invoices, payments, Excel/CSV import-export, reporting, automation, Supabase security, Cloudflare deployment, and custom-domain cutover."
---

# Studio Pranavi Platform

Build a production-quality platform with two independently deployable applications sharing one governed backend:

- `apps/website`: premium, design-led public website and quote-generation experience.
- `apps/crm`: secure operational CRM. Preserve the existing look and structure unless usability or accessibility requires targeted improvement.
- `supabase`: PostgreSQL, Auth, Storage, RLS, migrations, RPCs, audit and optional Edge Functions.

## Source of truth

Before changing code, read the reference appropriate to the requested phase:

- [references/product-and-source-material.md](references/product-and-source-material.md): business context, source-material rules and project references.
- [references/frontend-design-blueprint.md](references/frontend-design-blueprint.md): complete Studio Pranavi public-site design direction.
- [references/architecture-data-security.md](references/architecture-data-security.md): repository, data, security, storage and integration rules.
- [references/phase-prompts.md](references/phase-prompts.md): execution prompts from Phase 0 through Phase 10K.
- [references/test-and-release.md](references/test-and-release.md): automated verification and release gates.
- [references/deployment.md](references/deployment.md): preview, production, DNS and custom-domain requirements.

## Non-negotiable operating rules

1. Inspect the repository and existing application before editing. Preserve all working functionality.
2. Execute one requested phase only. Never start the next phase automatically.
3. The Studio Pranavi PPT/catalogue/project files are the content and brand source of truth. Do not invent projects, clients, statistics, testimonials, awards, certifications, addresses, contact details or capabilities.
4. Use `sagarti.com` and `www.staydesigned.com` only as conceptual references for editorial hierarchy, imagery, whitespace, storytelling and premium presentation. Do not copy code, text, layouts, branding, imagery or distinctive trade dress.
5. The public website should receive the major visual redesign. Keep CRM styling largely unchanged; improve only navigation, consistency, accessibility, responsive behavior and productivity.
6. Remove personal project contacts from all public content. Never publish personal phone numbers, email addresses or internal project notes found in source presentations.
7. Do not expose Supabase service-role keys in browser code. Enforce authorization with RLS, not only UI route guards.
8. Use PostgreSQL/Supabase as the system of record. Excel/CSV is controlled import/export, never the live database.
9. Implement complete vertical slices: UI, validation, persistence, authorization, loading, empty, error, success, responsive behavior and tests.
10. Do not claim a deployment, domain connection or test pass unless it actually succeeded.
11. Use synthetic `TEST` or `E2E` records only in automated tests.
12. At the end of every phase run all applicable checks, report PASS/FAIL/BLOCKED/SKIPPED/NOT TESTED, provide one valid single-line Git commit command, and stop.

## Default stack when starting new work

Preserve a coherent existing stack. Otherwise use:

- pnpm TypeScript monorepo
- React + Vite
- Tailwind CSS + shadcn/ui
- React Router, TanStack Query, React Hook Form, Zod
- Supabase PostgreSQL, Auth and Storage
- Vitest, React Testing Library, Playwright and Supabase SQL tests
- GitHub source control and CI/CD
- Cloudflare Pages for website and CRM

## Product north star

The platform must connect:

```text
Professional Website
→ Qualified Enquiry
→ Fast Follow-up
→ Site Visit and Measurements
→ Accurate Versioned Quotation
→ Controlled Order and Project
→ Planned Installation
→ Invoice and Payment Visibility
→ Better Business Decisions
```

## Completion response

Every implementation response must include:

1. What changed
2. Files and migrations changed
3. Tests and commands actually run
4. PASS / FAIL / BLOCKED / SKIPPED / NOT TESTED
5. Security and privacy notes
6. Manual configuration still required
7. Known limitations
8. Exact verification commands
9. One valid single-line Git commit command
10. Exact prompt for the next phase

Then stop and wait for approval.

# Phase Prompts

Run one phase at a time. At the end of every prompt apply the completion rules in `SKILL.md`.

## Phase 0: Discovery

```text
/studio-pranavi-platform
Execute Phase 0 only. Inspect repository, stack, routes, schema, auth, storage, tests, deployment and existing functionality. Compare against all skill references. Produce current-state architecture, gap assessment, target structure, route map, migration/RLS/storage/test/deployment plan and risks. Modify only assessment documentation and safe environment examples. Do not start Phase 1.
```

## Phase 1: Foundation, database and auth

```text
/studio-pranavi-platform
Execute Phase 1 only. Preserve working code. Establish workspace boundaries, environment validation, complete Supabase migrations, constraints, indexes, RLS, storage, generated types, profiles/roles, CRM auth and protected routes. Use safe synthetic seed data. Prove anonymous CRM denial and clean migrations. Do not start Phase 2.
```

## Phase 2: Public website foundation

```text
/studio-pranavi-platform
Execute Phase 2 only. Build/refine public routes, responsive navigation, services, projects, about, contact, quote UI, privacy, 404, SEO, sitemap and published-content loading. Use placeholders only when clearly labelled. Do not invent Studio Pranavi claims. Do not start Phase 3.
```

## Phase 3: Quote request and lead CRM

```text
/studio-pranavi-platform
Execute Phase 3 only. Implement validated public quote request, private uploads, anti-abuse, one lead and initial activity per submission, lead list/Kanban/detail, owner, status, follow-up, task, activity and dashboard indicators. Prove anonymous users cannot read leads/files. Do not start Phase 4.
```

## Phase 4: Customer operations

```text
/studio-pranavi-platform
Execute Phase 4 only. Implement idempotent lead-to-customer conversion, contacts, addresses, activities, tasks, site visits, measurements, attachments and role-aware customer timeline. Do not start Phase 5.
```

## Phase 5: Quotations

```text
/studio-pranavi-platform
Execute Phase 5 only. Implement quote identity, immutable sent versions, line items, trusted INR calculations, validity, terms, preview/PDF-ready output, accept/reject/expire/revise and audit. Add known-value and tampering tests. Do not start Phase 6.
```

## Phase 6: Orders, projects and installation

```text
/studio-pranavi-platform
Execute Phase 6 only. Implement idempotent accepted-quote to order conversion, project workspace, milestones, production status, measurements, installation schedule/team, completion and sign-off. Do not start Phase 7.
```

## Phase 7: Invoice and payment tracking

```text
/studio-pranavi-platform
Execute Phase 7 only. Implement invoices, trusted totals, issue/due dates, partial/full payments, reversal, balances, overdue and ageing. Store amounts in paise. Do not claim statutory accounting/GST compliance. Do not start Phase 8.
```

## Phase 8: Security and release readiness

```text
/studio-pranavi-platform
Execute Phase 8 only. Freeze features. Audit every table/function/bucket/route for authorization, secrets, validation, accessibility, performance and idempotency. Run the complete customer-to-payment E2E and clean migrations/builds. Do not deploy.
```

## Phase 9: Base preview and production deployment

```text
/studio-pranavi-platform
Execute Phase 9 only after Phase 8 passes. Configure separate website/CRM preview deployments, Supabase environment, environment variables, auth URLs, storage origins, HTTPS, headers and rollback. Test preview before production. Report actual URLs only when verified.
```

## Phase 10A: Studio Pranavi assessment

```text
/studio-pranavi-platform
Execute Phase 10A only. Do not edit product code. Inventory the repository and all Studio Pranavi PPTs, catalogues, logos, photos and videos. Analyze sagarti.com and www.staydesigned.com only as conceptual references. Produce a source-content matrix, public/privacy review, frontend scorecard, approved information architecture, page-by-page content map, visual direction, performance risks and exact 10B/10C acceptance criteria.
```

## Phase 10B: Design system and branding

```text
/studio-pranavi-platform
Execute Phase 10B only. Implement Studio Pranavi frontend tokens, typography, colors, spacing, image treatment, motion rules and configurable website branding with preview/publish. Keep CRM visual changes limited to logo/accent/theme consistency. No arbitrary CSS/JS. Do not start 10C.
```

## Phase 10C: Premium frontend redesign

```text
/studio-pranavi-platform
Execute Phase 10C only. Redesign the customer website according to frontend-design-blueprint.md and approved 10A content map. Use approved Studio Pranavi projects and media. Build editorial homepage, projects, project-story detail, expertise, studio/process, catalogue, contact and start-a-project experiences. Preserve quote integration and backend. Do not redesign CRM.
```

## Phase 10D: CMS and media

```text
/studio-pranavi-platform
Execute Phase 10D only. Implement pages, controlled sections, ordering, navigation, SEO, services, projects, collections, catalogue, draft/preview/publish, media library, responsive image variants, video metadata and usage tracking. Keep private CRM media isolated.
```

## Phase 10E: CRM UX and role dashboards

```text
/studio-pranavi-platform
Execute Phase 10E only. Preserve CRM visual identity. Improve navigation, search, filters, pagination, columns, safe bulk actions, project workspace and role-specific actionable dashboards. Every metric must open authorized filtered records and reconcile to fixtures.
```

## Phase 10F: Excel/CSV import and export

```text
/studio-pranavi-platform
Execute Phase 10F only. Add templates, CSV/XLSX upload, mapping, validation, duplicate review, preview, safe batch import, result/audit history and permission-aware filtered/selected/all-authorized exports. Protect against formula injection. Test 100 and 1,000 synthetic leads.
```

## Phase 10G: Notifications and automation

```text
/studio-pranavi-platform
Execute Phase 10G only. Implement notification center/preferences, new-lead assignment, overdue follow-up, quote expiry, order milestone and invoice-overdue automations using idempotent outbox/retry design. Keep customer messages human-approved unless an approved provider/template workflow exists.
```

## Phase 10H: Reporting

```text
/studio-pranavi-platform
Execute Phase 10H only. Add role-authorized sales, operations and finance reports with date/service/owner/status filters and verified metrics. Reports and exports must remain within RLS scope.
```

## Phase 10I: Full release candidate

```text
/studio-pranavi-platform
Execute Phase 10I only. Freeze features and run test-and-release.md completely: customer-to-payment journey, CMS publish, branding rollback, CSV/XLSX round trip, RLS/storage, accessibility, performance, clean migration and both builds. Zero unresolved Critical/High defects.
```

## Phase 10J: Preview internet deployment

```text
/studio-pranavi-platform
Execute Phase 10J only after 10I passes. Deploy website and CRM previews, configure test/preview Supabase, auth redirects, storage, HTTPS and SPA routing. Repeat critical tests against actual preview URLs. Do not connect final domain.
```

## Phase 10K: Production and domain

```text
/studio-pranavi-platform
Execute Phase 10K only after preview passes. Apply controlled production migrations, deploy website/CRM, configure www and crm custom domains, apex redirect, TLS, auth, storage, monitoring, backup and rollback. Run synthetic production smoke tests. Report only verified URLs and status.
```

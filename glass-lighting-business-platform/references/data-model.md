# Data Model and Security

## Core tables

- `profiles`: auth user metadata, display name, role, active flag.
- `business_settings`: brand and operating configuration.
- `services`: public service catalogue.
- `portfolio_projects`, `portfolio_images`: published work.
- `leads`: enquiry and qualification data.
- `customers`, `customer_contacts`, `addresses`: customer records.
- `activities`: append-only interactions and state changes.
- `tasks`: follow-ups and work items.
- `site_visits`, `measurements`: field-work records.
- `quotes`, `quote_versions`, `quote_items`: commercial proposals.
- `orders`, `projects`, `project_milestones`: fulfilment.
- `invoices`, `payments`: receivables tracking.
- `attachments`: metadata for private files.

## Important data rules

- Lead email may be nullable; phone or email must be present.
- Quote versions become immutable after being sent. Create a new version for revisions.
- Quote totals must be recalculated from line items in trusted code or SQL, not accepted from the browser.
- Payment amount must be positive and cannot silently exceed the invoice balance. If overpayment is allowed, model it explicitly.
- Convert lead to customer/order within a transaction or idempotent server operation.
- Status values should use constrained enums or lookup tables, not arbitrary free text.

## Suggested roles

- `admin`: all operational and configuration access, including team administration.
- `manager`: operational records, reporting, assignment, and approvals.
- `sales`: leads, customers, activities, tasks, quotes, and own/assigned pipeline.
- `operations`: orders, projects, site visits, installation, and related customer context.
- `viewer`: read-only access to permitted CRM data.

## RLS policy intent

Anonymous:

- Select published services and published portfolio records.
- Insert through a narrow lead-submission interface.
- No select access to leads after submission.
- No direct access to private attachment buckets.

Authenticated staff:

- Require an active profile.
- Apply role and assignment restrictions where appropriate.
- Admin-only profile/role changes.
- Audit privileged and destructive operations.

## Privacy

Collect only data needed to respond and fulfil work. Provide a clear consent statement on public forms. Avoid placing sensitive customer or payment details in logs, URLs, analytics events, or publicly readable storage.

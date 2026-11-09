# Architecture, Data and Security

## Deployment boundary

```text
www.<domain>  -> public website
crm.<domain>  -> authenticated CRM
                     |
               Supabase
         PostgreSQL / Auth / Storage / RLS
```

Keep website and CRM independently deployable. Share stable UI tokens and generated domain types, not privileged data assumptions.

## Core data domains

- Profiles, roles and business settings
- Services, pages, sections, navigation and SEO
- Portfolio projects and media
- Leads, customers, contacts and addresses
- Activities, tasks, site visits and measurements
- Quotes, versions and line items
- Orders, projects, milestones and installations
- Invoices, invoice items and payments
- Attachments, imports/exports, notifications and audit log

Use UUID keys, UTC timestamps, foreign keys, constraints, indexed filter columns and archive status. Store INR money as integer paise. Generate document numbers server-side without `max()+1`.

## Required trusted operations

- Narrow public lead submission returning only a receipt ID
- Idempotent lead-to-customer conversion
- Quote totals calculated from trusted line items
- Sent quote versions immutable
- Idempotent accepted-quote to order conversion
- Transactional payment apply/reverse
- Import validation and batch commit
- Permission-aware export generation

## RLS intent

Anonymous:

- Read only published website content
- Submit lead only through approved narrow interface
- Never read leads, customers, commercial data or private storage

Authenticated staff:

- Must have an active profile
- Access according to role and assignment/team scope
- Admin-only role management and sensitive settings
- Audit privileged and commercial changes

## Storage

- `public-content`: approved published website media
- `lead-uploads`: private
- `crm-documents`: private
- `avatars`: user-scoped
- optional temporary import bucket with short retention

Use generated object paths, size/type allowlists, signed URLs for private media and malware scanning when available.

## Import/export

Import:

```text
Select entity -> Upload -> Parse -> Map -> Validate -> Duplicate review -> Preview -> Commit -> Result
```

Initial supported imports: Leads, Customers, Orders, Projects and Tasks. Avoid direct financial imports until separately designed and tested.

Exports: filtered view, selected records or all authorized records in CSV/XLSX. Neutralize spreadsheet formula injection. Large exports should run server-side or in batches.

## Privacy

Do not expose personal project contacts, exact private addresses, internal notes, customer files, payment references or source-material metadata publicly. Keep analytics free of customer descriptions and contact information.

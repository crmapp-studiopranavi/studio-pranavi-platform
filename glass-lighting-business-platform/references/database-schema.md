# Detailed Database Schema

Use PostgreSQL through Supabase. Keep all production schema changes in timestamped SQL migrations. Generate TypeScript database types after each schema change.

## Extensions and conventions

Enable as needed:

```sql
create extension if not exists pgcrypto;
create extension if not exists citext;
```

Conventions:

- Primary keys: `uuid default gen_random_uuid()`.
- Timestamps: `timestamptz`, stored in UTC.
- Money: `bigint` in the smallest currency unit, such as paise for INR.
- Quantities: `numeric(12,3)`.
- Rates/percentages: `numeric(7,4)`.
- Human-readable document numbers: generated server-side and unique per business.
- Never use email or phone as a primary key.
- Use `archived_at` for operational records that should not be hard-deleted.
- Add `created_by` and `updated_by` where staff ownership or accountability matters.

## Enums

Create constrained PostgreSQL enums or equivalent lookup tables:

```text
app_role: admin, manager, sales, operations, viewer
lead_status: new, contacted, site_visit_scheduled, site_visit_completed,
             quote_drafting, quote_sent, negotiation, won, lost, archived
lead_priority: low, medium, high, urgent
contact_method: phone, email, whatsapp, sms, in_person, other
quote_status: draft, internal_review, sent, viewed, accepted, rejected,
              expired, superseded, cancelled
order_status: confirmed, design_or_measurement, production,
              ready_for_installation, installation_scheduled,
              installed, completed, cancelled, on_hold
project_status: planned, active, blocked, on_hold, completed, cancelled
invoice_status: draft, issued, partially_paid, paid, overdue, void
payment_method: cash, bank_transfer, upi, card, cheque, other
payment_status: pending, cleared, failed, reversed, refunded
activity_type: note, call, email, whatsapp, meeting, site_visit,
               status_change, quote_sent, payment, system
attachment_visibility: private, customer_shareable, public
content_status: draft, published, archived
```

## Identity and tenant configuration

### `profiles`

Extends `auth.users`.

| Column       | Type        | Rules                                     |
| ------------ | ----------- | ----------------------------------------- |
| id           | uuid        | PK, FK `auth.users(id)` on delete cascade |
| full_name    | text        | not null                                  |
| phone        | text        | nullable                                  |
| role         | app_role    | not null default `viewer`                 |
| is_active    | boolean     | not null default true                     |
| avatar_path  | text        | nullable                                  |
| last_seen_at | timestamptz | nullable                                  |
| created_at   | timestamptz | not null default now()                    |
| updated_at   | timestamptz | not null default now()                    |

Indexes: `(role, is_active)`.

### `business_settings`

Use one row for the initial single-business deployment.

| Column                  | Type         | Rules                                                      |
| ----------------------- | ------------ | ---------------------------------------------------------- |
| id                      | uuid         | PK                                                         |
| business_name           | text         | not null                                                   |
| legal_name              | text         | nullable                                                   |
| gstin                   | text         | nullable; validate format only if GST features are enabled |
| default_currency        | char(3)      | not null default `INR`                                     |
| timezone                | text         | not null default `Asia/Kolkata`                            |
| phone                   | text         | nullable                                                   |
| email                   | citext       | nullable                                                   |
| whatsapp_number         | text         | nullable                                                   |
| address                 | jsonb        | nullable                                                   |
| logo_path               | text         | nullable                                                   |
| quotation_prefix        | text         | not null default `QT`                                      |
| order_prefix            | text         | not null default `ORD`                                     |
| invoice_prefix          | text         | not null default `INV`                                     |
| default_tax_rate        | numeric(7,4) | not null default 0                                         |
| quote_validity_days     | integer      | not null default 15, check > 0                             |
| updated_by              | uuid         | FK profiles                                                |
| created_at / updated_at | timestamptz  | not null                                                   |

## Public content

### `services`

| Column                  | Type           | Rules                                  |
| ----------------------- | -------------- | -------------------------------------- |
| id                      | uuid           | PK                                     |
| slug                    | text           | unique, not null                       |
| title                   | text           | not null                               |
| short_description       | text           | not null                               |
| description             | text           | nullable                               |
| category                | text           | not null                               |
| hero_image_path         | text           | nullable                               |
| features                | jsonb          | not null default `[]`                  |
| faqs                    | jsonb          | not null default `[]`                  |
| status                  | content_status | not null default `draft`               |
| sort_order              | integer        | not null default 0                     |
| seo_title               | text           | nullable                               |
| seo_description         | text           | nullable                               |
| created_by / updated_by | uuid           | FK profiles, nullable for initial seed |
| created_at / updated_at | timestamptz    | not null                               |
| archived_at             | timestamptz    | nullable                               |

Indexes: unique `(slug)`; `(status, sort_order)`.

### `portfolio_projects`

| Column                      | Type           | Rules                                          |
| --------------------------- | -------------- | ---------------------------------------------- |
| id                          | uuid           | PK                                             |
| slug                        | text           | unique, not null                               |
| title                       | text           | not null                                       |
| category                    | text           | not null                                       |
| location_label              | text           | nullable; do not expose exact customer address |
| summary                     | text           | not null                                       |
| description                 | text           | nullable                                       |
| materials                   | text[]         | not null default `{}`                          |
| completed_on                | date           | nullable                                       |
| cover_image_path            | text           | nullable                                       |
| status                      | content_status | not null default `draft`                       |
| is_featured                 | boolean        | not null default false                         |
| sort_order                  | integer        | not null default 0                             |
| seo_title / seo_description | text           | nullable                                       |
| created_by / updated_by     | uuid           | FK profiles                                    |
| created_at / updated_at     | timestamptz    | not null                                       |
| archived_at                 | timestamptz    | nullable                                       |

Indexes: `(status, is_featured, sort_order)`, `(category, status)`.

### `portfolio_images`

| Column         | Type        | Rules                                   |
| -------------- | ----------- | --------------------------------------- |
| id             | uuid        | PK                                      |
| project_id     | uuid        | FK portfolio_projects on delete cascade |
| storage_path   | text        | not null                                |
| alt_text       | text        | not null                                |
| caption        | text        | nullable                                |
| width / height | integer     | nullable, check positive                |
| sort_order     | integer     | not null default 0                      |
| created_at     | timestamptz | not null default now()                  |

Unique `(project_id, storage_path)`; index `(project_id, sort_order)`.

### `testimonials`

Store only genuine, approved testimonials.

Columns: `id uuid PK`, `display_name text`, `project_type text`, `quote text not null`, `rating smallint nullable check 1..5`, `consent_recorded_at timestamptz`, `status content_status`, `sort_order integer`, timestamps.

## Lead and customer management

### `leads`

| Column                              | Type           | Rules                                                    |
| ----------------------------------- | -------------- | -------------------------------------------------------- |
| id                                  | uuid           | PK                                                       |
| lead_number                         | bigint         | generated sequence, unique                               |
| source                              | text           | not null default `website`                               |
| status                              | lead_status    | not null default `new`                                   |
| priority                            | lead_priority  | not null default `medium`                                |
| full_name                           | text           | not null                                                 |
| email                               | citext         | nullable                                                 |
| phone                               | text           | nullable                                                 |
| whatsapp_number                     | text           | nullable                                                 |
| preferred_contact_method            | contact_method | nullable                                                 |
| location_text                       | text           | nullable                                                 |
| service_id                          | uuid           | FK services, nullable                                    |
| service_interest                    | text           | nullable for free-text legacy/import cases               |
| budget_min_minor / budget_max_minor | bigint         | nullable, nonnegative                                    |
| project_description                 | text           | not null                                                 |
| owner_id                            | uuid           | FK profiles, nullable                                    |
| next_follow_up_at                   | timestamptz    | nullable                                                 |
| lost_reason                         | text           | nullable only when lost                                  |
| consent_text_version                | text           | nullable                                                 |
| consented_at                        | timestamptz    | nullable                                                 |
| converted_customer_id               | uuid           | FK customers, nullable, add after customers table exists |
| created_at / updated_at             | timestamptz    | not null                                                 |
| archived_at                         | timestamptz    | nullable                                                 |

Checks:

```text
email is not null OR phone is not null OR whatsapp_number is not null
budget_min_minor >= 0
budget_max_minor >= budget_min_minor when both exist
status = lost requires lost_reason
```

Indexes: `(status, owner_id, next_follow_up_at)`, `(created_at desc)`, `(phone)`, `(lower(email))`. Consider trigram search only when needed.

### `customers`

| Column                  | Type        | Rules                                  |
| ----------------------- | ----------- | -------------------------------------- |
| id                      | uuid        | PK                                     |
| customer_number         | bigint      | generated sequence, unique             |
| display_name            | text        | not null                               |
| customer_type           | text        | check `individual` or `business`       |
| primary_contact_id      | uuid        | nullable; set after contacts exist     |
| gstin                   | text        | nullable                               |
| owner_id                | uuid        | FK profiles                            |
| source_lead_id          | uuid        | unique FK leads, nullable              |
| notes                   | text        | nullable; avoid sensitive payment data |
| created_by / updated_by | uuid        | FK profiles                            |
| created_at / updated_at | timestamptz | not null                               |
| archived_at             | timestamptz | nullable                               |

### `customer_contacts`

Columns: `id uuid PK`, `customer_id uuid FK on delete cascade`, `full_name text not null`, `title text`, `email citext`, `phone text`, `whatsapp_number text`, `preferred_contact_method contact_method`, `is_primary boolean default false`, timestamps. Require at least one of email/phone/WhatsApp. Enforce at most one primary contact per customer with a partial unique index.

### `addresses`

Columns: `id uuid PK`, `customer_id uuid FK on delete cascade`, `address_type text`, `line1 text not null`, `line2 text`, `city text`, `state text`, `postal_code text`, `country_code char(2) default 'IN'`, `is_primary boolean`, timestamps. Create a partial unique index for one primary address per customer and type.

## Communication and work management

### `activities`

Append-only business timeline.

| Column        | Type          | Rules                                              |
| ------------- | ------------- | -------------------------------------------------- |
| id            | uuid          | PK                                                 |
| activity_type | activity_type | not null                                           |
| subject       | text          | nullable                                           |
| body          | text          | nullable                                           |
| occurred_at   | timestamptz   | not null default now()                             |
| actor_id      | uuid          | FK profiles, nullable for system/public submission |
| lead_id       | uuid          | FK leads                                           |
| customer_id   | uuid          | FK customers                                       |
| quote_id      | uuid          | FK quotes                                          |
| order_id      | uuid          | FK orders                                          |
| project_id    | uuid          | FK projects                                        |
| metadata      | jsonb         | not null default `{}`                              |
| created_at    | timestamptz   | not null default now()                             |

Require at least one related entity. Avoid updates/deletes except admin correction through audited procedures. Index each foreign key plus `(occurred_at desc)`.

### `tasks`

Columns: `id uuid PK`, `title text not null`, `description text`, `assigned_to uuid FK profiles`, `created_by uuid FK profiles`, `due_at timestamptz`, `completed_at timestamptz`, `priority lead_priority`, `status text check todo/in_progress/done/cancelled`, optional lead/customer/quote/order/project FKs, timestamps, `archived_at`. Index `(assigned_to, status, due_at)`.

### `site_visits`

Columns: `id uuid PK`, `lead_id uuid`, `customer_id uuid`, `project_id uuid`, `scheduled_start/end timestamptz`, `assigned_to uuid`, `address_id uuid`, `status text`, `purpose text`, `notes text`, `completed_at timestamptz`, timestamps. Require one parent business entity and ensure end > start.

### `measurements`

Columns: `id uuid PK`, `site_visit_id uuid FK`, `project_id uuid FK`, `area_or_item text not null`, `width_mm numeric(12,2)`, `height_mm numeric(12,2)`, `depth_mm numeric(12,2)`, `quantity numeric(12,3) default 1`, `unit text default 'mm'`, `notes text`, `recorded_by uuid`, timestamps. Dimensions and quantity must be positive when present.

## Quotations

### `quotes`

Represents the commercial proposal identity; versions hold immutable sent content.

| Column                    | Type         | Rules                                           |
| ------------------------- | ------------ | ----------------------------------------------- |
| id                        | uuid         | PK                                              |
| quote_number              | text         | unique, not null, generated server-side         |
| customer_id               | uuid         | FK customers, not null                          |
| lead_id                   | uuid         | FK leads, nullable                              |
| project_id                | uuid         | FK projects, nullable                           |
| status                    | quote_status | not null default `draft`                        |
| current_version_id        | uuid         | FK quote_versions, nullable; add after versions |
| owner_id                  | uuid         | FK profiles                                     |
| accepted_at / rejected_at | timestamptz  | nullable                                        |
| created_by / updated_by   | uuid         | FK profiles                                     |
| created_at / updated_at   | timestamptz  | not null                                        |
| archived_at               | timestamptz  | nullable                                        |

Indexes: `(customer_id, created_at desc)`, `(status, owner_id)`, `(lead_id)`.

### `quote_versions`

| Column            | Type        | Rules                                       |
| ----------------- | ----------- | ------------------------------------------- |
| id                | uuid        | PK                                          |
| quote_id          | uuid        | FK quotes on delete cascade                 |
| version_number    | integer     | not null, > 0                               |
| issue_date        | date        | not null                                    |
| valid_until       | date        | not null, >= issue_date                     |
| currency          | char(3)     | not null default `INR`                      |
| subtotal_minor    | bigint      | not null default 0                          |
| discount_minor    | bigint      | not null default 0                          |
| tax_minor         | bigint      | not null default 0                          |
| total_minor       | bigint      | not null default 0                          |
| terms             | text        | nullable                                    |
| customer_notes    | text        | nullable                                    |
| internal_notes    | text        | nullable, never render to customer document |
| sent_at           | timestamptz | nullable                                    |
| snapshot_customer | jsonb       | not null; customer/address at issue time    |
| created_by        | uuid        | FK profiles                                 |
| created_at        | timestamptz | not null default now()                      |

Unique `(quote_id, version_number)`. Checks: all money nonnegative; total = subtotal - discount + tax. Once `sent_at` is non-null, block updates/deletes except controlled supersession.

### `quote_items`

| Column              | Type          | Rules                                                      |
| ------------------- | ------------- | ---------------------------------------------------------- |
| id                  | uuid          | PK                                                         |
| quote_version_id    | uuid          | FK quote_versions on delete cascade                        |
| line_number         | integer       | not null                                                   |
| item_type           | text          | material, labour, installation, transport, discount, other |
| title               | text          | not null                                                   |
| description         | text          | nullable                                                   |
| quantity            | numeric(12,3) | not null, > 0                                              |
| unit                | text          | not null                                                   |
| unit_price_minor    | bigint        | not null, >= 0                                             |
| discount_rate       | numeric(7,4)  | not null default 0                                         |
| tax_rate            | numeric(7,4)  | not null default 0                                         |
| line_subtotal_minor | bigint        | not null                                                   |
| line_discount_minor | bigint        | not null                                                   |
| line_tax_minor      | bigint        | not null                                                   |
| line_total_minor    | bigint        | not null                                                   |
| sort_order          | integer       | not null default 0                                         |
| metadata            | jsonb         | not null default `{}`                                      |

Unique `(quote_version_id, line_number)`. Calculate and validate totals in trusted server/database code.

## Orders and project delivery

### `orders`

| Column                    | Type         | Rules                         |
| ------------------------- | ------------ | ----------------------------- |
| id                        | uuid         | PK                            |
| order_number              | text         | unique, generated server-side |
| customer_id               | uuid         | FK customers, not null        |
| quote_id                  | uuid         | unique FK quotes, nullable    |
| accepted_quote_version_id | uuid         | FK quote_versions, nullable   |
| status                    | order_status | not null default `confirmed`  |
| order_date                | date         | not null default current_date |
| target_completion_date    | date         | nullable                      |
| currency                  | char(3)      | not null default `INR`        |
| total_minor               | bigint       | not null, >= 0                |
| owner_id                  | uuid         | FK profiles                   |
| notes                     | text         | nullable                      |
| created_by / updated_by   | uuid         | FK profiles                   |
| created_at / updated_at   | timestamptz  | not null                      |
| archived_at               | timestamptz  | nullable                      |

Quote-to-order conversion must be idempotent. Index `(status, target_completion_date)`, `(customer_id, created_at desc)`.

### `projects`

Columns: `id uuid PK`, `project_number text unique`, `order_id uuid unique FK orders`, `customer_id uuid FK customers`, `name text not null`, `status project_status`, `location_address_id uuid`, `start_date date`, `target_completion_date date`, `actual_completion_date date`, `project_manager_id uuid`, `scope text`, `internal_notes text`, timestamps, `archived_at`. Ensure completion date is not before start date.

### `project_milestones`

Columns: `id uuid PK`, `project_id uuid FK on delete cascade`, `name text not null`, `description text`, `status text check pending/in_progress/completed/blocked/skipped`, `due_date date`, `completed_at timestamptz`, `sort_order integer`, `assigned_to uuid`, timestamps. Index `(project_id, sort_order)` and `(assigned_to, status, due_date)`.

### `installations`

Columns: `id uuid PK`, `project_id uuid FK`, `scheduled_start/end timestamptz`, `assigned_team text`, `lead_installer_id uuid FK profiles`, `status text check scheduled/in_progress/completed/rescheduled/cancelled`, `completion_notes text`, `customer_signoff_name text`, `signed_off_at timestamptz`, timestamps. Ensure end > start.

## Billing and payments

### `invoices`

| Column                  | Type           | Rules                            |
| ----------------------- | -------------- | -------------------------------- |
| id                      | uuid           | PK                               |
| invoice_number          | text           | unique, generated server-side    |
| customer_id             | uuid           | FK customers, not null           |
| order_id                | uuid           | FK orders, nullable              |
| project_id              | uuid           | FK projects, nullable            |
| status                  | invoice_status | not null default `draft`         |
| issue_date              | date           | not null                         |
| due_date                | date           | not null, >= issue_date          |
| currency                | char(3)        | not null default `INR`           |
| subtotal_minor          | bigint         | not null, >= 0                   |
| discount_minor          | bigint         | not null default 0               |
| tax_minor               | bigint         | not null default 0               |
| total_minor             | bigint         | not null, >= 0                   |
| amount_paid_minor       | bigint         | not null default 0               |
| balance_minor           | bigint         | generated or trusted calculation |
| notes                   | text           | nullable                         |
| issued_at               | timestamptz    | nullable                         |
| created_by / updated_by | uuid           | FK profiles                      |
| created_at / updated_at | timestamptz    | not null                         |
| archived_at             | timestamptz    | nullable                         |

Checks: `total = subtotal - discount + tax`; `0 <= amount_paid <= total` unless explicit credit handling exists. Index `(status, due_date)`, `(customer_id, issue_date desc)`.

### `invoice_items`

Same monetary approach as quote items. Columns: `id`, `invoice_id`, `line_number`, `title`, `description`, `quantity`, `unit`, `unit_price_minor`, discount/tax rates and computed components, totals, sort order. Unique `(invoice_id, line_number)`.

### `payments`

| Column                  | Type           | Rules                                                  |
| ----------------------- | -------------- | ------------------------------------------------------ |
| id                      | uuid           | PK                                                     |
| payment_number          | text           | unique, generated server-side                          |
| invoice_id              | uuid           | FK invoices, not null                                  |
| customer_id             | uuid           | FK customers, not null                                 |
| amount_minor            | bigint         | not null, > 0                                          |
| currency                | char(3)        | not null default `INR`                                 |
| payment_date            | date           | not null                                               |
| method                  | payment_method | not null                                               |
| status                  | payment_status | not null default `cleared`                             |
| reference               | text           | nullable                                               |
| notes                   | text           | nullable; never store card data or banking credentials |
| recorded_by             | uuid           | FK profiles                                            |
| created_at / updated_at | timestamptz    | not null                                               |
| reversed_at             | timestamptz    | nullable                                               |

Apply payment and update invoice balance in one transaction. Never delete cleared payments; reverse them with an audit entry.

## Files and notifications

### `attachments`

| Column                                         | Type                  | Rules                                        |
| ---------------------------------------------- | --------------------- | -------------------------------------------- |
| id                                             | uuid                  | PK                                           |
| bucket                                         | text                  | not null                                     |
| storage_path                                   | text                  | unique, not null                             |
| original_filename                              | text                  | not null                                     |
| content_type                                   | text                  | not null                                     |
| size_bytes                                     | bigint                | not null, > 0                                |
| visibility                                     | attachment_visibility | not null default `private`                   |
| uploaded_by                                    | uuid                  | FK profiles, nullable for public lead upload |
| lead/customer/quote/order/project/activity ids | uuid                  | nullable FKs                                 |
| checksum                                       | text                  | nullable                                     |
| created_at                                     | timestamptz           | not null default now()                       |
| archived_at                                    | timestamptz           | nullable                                     |

Require exactly one primary parent where practical. Public uploads must use generated paths, file-size/type allowlists, and malware scanning if available. Staff access uses signed URLs.

### `notification_outbox`

For reliable email/WhatsApp integrations.

Columns: `id uuid PK`, `channel text`, `template_key text`, `recipient text`, `payload jsonb`, `status text check pending/processing/sent/failed/cancelled`, `attempt_count integer`, `next_attempt_at timestamptz`, `last_error text`, `deduplication_key text unique`, `created_at`, `sent_at`. Never log secrets or full sensitive payloads.

### `audit_log`

Columns: `id bigint generated always as identity PK`, `actor_id uuid`, `action text not null`, `entity_type text not null`, `entity_id uuid`, `before_data jsonb`, `after_data jsonb`, `request_id text`, `created_at timestamptz default now()`. Restrict reads to admins/managers and prohibit client-side inserts.

## Database functions and triggers

Implement and test:

1. `set_updated_at()` trigger for mutable tables.
2. Server-side document number generation for quotes, orders, projects, invoices, and payments. Avoid `max()+1` race conditions; use sequences or locked counters.
3. `submit_public_lead(...)` security-definer RPC or protected API that validates input, inserts the lead/activity, and returns only a receipt ID. Set a safe `search_path` and grant execute narrowly.
4. `convert_lead_to_customer(...)` transactional, idempotent RPC.
5. `create_order_from_quote(...)` transactional, requires accepted quote version, and prevents duplicate orders.
6. Quote/invoice total recalculation from items.
7. Payment application/reversal that updates invoice status and balance atomically.
8. Audit triggers for role changes and key commercial status changes.

## Storage buckets

- `public-content`: published service and portfolio media; public read, admin/manager write.
- `lead-uploads`: private; controlled upload flow, authorized staff read through signed URLs.
- `crm-documents`: private; authenticated role-based access.
- `avatars`: authenticated upload to the user's own path; controlled read policy.

Do not make customer measurements, quotations, invoices, or lead attachments public.

## RLS policy matrix

| Resource                     | Anonymous               | Viewer              | Sales               | Operations                | Manager/Admin      |
| ---------------------------- | ----------------------- | ------------------- | ------------------- | ------------------------- | ------------------ |
| Published services/portfolio | read                    | read                | read                | read                      | full               |
| Leads                        | submit through RPC only | permitted read only | assigned/team scope | related project context   | full               |
| Customers                    | none                    | permitted read      | assigned/team scope | related operational scope | full               |
| Quotes/invoices/payments     | none                    | permitted read      | sales scope         | related operational read  | full               |
| Orders/projects              | none                    | permitted read      | related read        | assigned/team write       | full               |
| Profiles/roles               | none                    | own profile         | own profile         | own profile               | admin management   |
| Private files                | none                    | authorized only     | authorized only     | authorized only           | authorized/full    |
| Audit log                    | none                    | none                | none                | none                      | manager/admin read |

Translate this matrix into explicit policies. Do not rely on `auth.role() = 'authenticated'` alone. Resolve application role and active status from `profiles`, preferably through stable helper functions designed to avoid recursive RLS.

## Migration order

1. Extensions, enums, helper functions.
2. Profiles and business settings.
3. Public content.
4. Leads and customers.
5. Activities/tasks/site visits/measurements.
6. Quotes and quote items.
7. Orders/projects/installations.
8. Invoices/payments.
9. Attachments, outbox, audit.
10. Functions, triggers, storage policies, and RLS.
11. Seed data and database tests.

## Required database tests

- Anonymous can read only published content.
- Anonymous can submit a valid lead but cannot read it back.
- Invalid contact-less lead is rejected.
- Inactive staff cannot read CRM data.
- Sales and operations role boundaries work as designed.
- Sent quote versions are immutable.
- Quote totals equal sum of trusted item calculations.
- Duplicate lead-to-customer and quote-to-order conversion does not create duplicates.
- Payment and reversal update invoice balance/status correctly.
- Private attachment paths cannot be publicly listed or downloaded.
- Role changes and commercial status changes create audit records.

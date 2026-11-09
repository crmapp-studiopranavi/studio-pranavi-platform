-- ── Fix notification_outbox legacy NOT NULL columns ───────────────────────────
-- The original table was created with template_key and recipient as NOT NULL.
-- Migrations 24–26 moved to a new insert pattern (event_type + payload +
-- idempotency_key only) without dropping the old NOT NULL constraints.
-- Drop them so the new pattern works.

alter table public.notification_outbox
  alter column template_key drop not null,
  alter column recipient    drop not null;

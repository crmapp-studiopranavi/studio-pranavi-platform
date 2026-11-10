-- Seed a default business_settings row if none exists.
-- Both the Settings page (.single() query) and next_quote_number() require
-- at least one row to be present. Production starts empty, causing PGRST116
-- on the settings page and NULL quote numbers on quote creation.

insert into public.business_settings (
  business_name,
  legal_name,
  default_currency,
  timezone,
  quotation_prefix,
  order_prefix,
  invoice_prefix,
  default_tax_rate,
  quote_validity_days
)
select
  'Studio Pranavi',
  'Studio Pranavi',
  'INR',
  'Asia/Kolkata',
  'QT',
  'ORD',
  'INV',
  18,
  15
where not exists (select 1 from public.business_settings);

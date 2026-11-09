-- DEVELOPMENT SEED DATA ONLY
-- This data is labeled and must be removed before production deployment.
-- Run with: npx supabase db reset (resets + applies migrations + seeds)
-- DO NOT insert realistic customer data, real phone numbers, or real emails.

-- ─── Business settings (editable placeholder) ─────────────────────────────────

insert into business_settings (
  business_name, legal_name, default_currency, timezone,
  phone, email, whatsapp_number,
  quotation_prefix, order_prefix, invoice_prefix,
  default_tax_rate, quote_validity_days
) values (
  'Studio Pranavi',
  'Studio Pranavi',
  'INR',
  'Asia/Kolkata',
  '[PHONE NUMBER]',               -- Replace with actual phone
  'contact@[yourdomain].com',     -- Replace with actual email
  '[WHATSAPP NUMBER]',            -- Replace with actual WhatsApp
  'QT',
  'ORD',
  'INV',
  0.18,                           -- 18% GST placeholder — verify with accountant
  15
);

-- ─── Dev-only services (labeled as seed data) ────────────────────────────────

insert into services (slug, title, short_description, category, status, sort_order, features, faqs)
values
  (
    'decorative-glass',
    '[SEED] Decorative Glass',
    'Custom decorative glass panels for residential and commercial spaces.',
    'Glass',
    'published',
    1,
    '["Custom designs", "Multiple finishes", "Privacy options"]',
    '[]'
  ),
  (
    'decorative-lighting',
    '[SEED] Decorative Lighting',
    'Bespoke lighting fixtures crafted to complement your space.',
    'Lighting',
    'published',
    2,
    '["Custom fixtures", "LED options", "Installation included"]',
    '[]'
  ),
  (
    'installation-service',
    '[SEED] Installation',
    'Professional installation by our trained team.',
    'Service',
    'published',
    3,
    '["Licensed installers", "Warranty on workmanship"]',
    '[]'
  )
;

-- ─── Dev-only portfolio entries (labeled as seed data) ────────────────────────

insert into portfolio_projects (
  slug, title, category, location_label, summary,
  materials, status, is_featured, sort_order
) values
  (
    'seed-residential-glass-panels',
    '[SEED] Residential Glass Panels',
    'Residential',
    'Placeholder Location, India',
    '[SEED DATA] This is a placeholder portfolio entry. Replace with a genuine completed project.',
    array['Float Glass', 'Lacquered Glass'],
    'published',
    true,
    1
  ),
  (
    'seed-commercial-lighting',
    '[SEED] Commercial Pendant Lighting',
    'Commercial',
    'Placeholder Location, India',
    '[SEED DATA] This is a placeholder portfolio entry. Replace with a genuine completed project.',
    array['Brass', 'Hand-blown Glass'],
    'published',
    false,
    2
  )
;

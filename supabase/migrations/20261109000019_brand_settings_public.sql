-- Phase 10B: Brand settings columns + public read-only view
-- Adds website branding fields to business_settings and exposes safe public subset.

-- ── 1. Add branding columns ──────────────────────────────────────────────────

ALTER TABLE business_settings
  ADD COLUMN IF NOT EXISTS business_tagline        text,
  ADD COLUMN IF NOT EXISTS logo_light_path         text,
  ADD COLUMN IF NOT EXISTS logo_dark_path          text,
  ADD COLUMN IF NOT EXISTS logo_mobile_path        text,
  ADD COLUMN IF NOT EXISTS favicon_path            text,
  ADD COLUMN IF NOT EXISTS og_image_path           text,
  ADD COLUMN IF NOT EXISTS primary_color           text NOT NULL DEFAULT '#C8973A',
  ADD COLUMN IF NOT EXISTS secondary_color         text NOT NULL DEFAULT '#2C2C2C',
  ADD COLUMN IF NOT EXISTS accent_color            text NOT NULL DEFAULT '#C8973A',
  ADD COLUMN IF NOT EXISTS heading_font            text NOT NULL DEFAULT 'Playfair Display',
  ADD COLUMN IF NOT EXISTS body_font               text NOT NULL DEFAULT 'Inter',
  ADD COLUMN IF NOT EXISTS button_radius           text NOT NULL DEFAULT '6px',
  ADD COLUMN IF NOT EXISTS hero_image_path         text;

-- ── 2. Seed initial values where tagline is not yet set ─────────────────────

UPDATE business_settings
SET
  business_tagline  = 'We design the essence of light.',
  primary_color     = '#C8973A',
  secondary_color   = '#2C2C2C',
  accent_color      = '#C8973A',
  heading_font      = 'Playfair Display',
  body_font         = 'Inter',
  button_radius     = '6px'
WHERE business_tagline IS NULL;

-- ── 3. Public view — exposes only safe brand/display fields ─────────────────
-- Deliberately excludes: legal_name, gstin, phone, email, whatsapp_number,
-- address, prefixes, tax rates, and any other sensitive business data.

CREATE OR REPLACE VIEW public_brand_settings AS
SELECT
  business_name,
  business_tagline,
  logo_path,
  logo_light_path,
  logo_dark_path,
  logo_mobile_path,
  favicon_path,
  og_image_path,
  primary_color,
  secondary_color,
  accent_color,
  heading_font,
  body_font,
  button_radius,
  hero_image_path
FROM business_settings
LIMIT 1;

-- ── 4. Grant public read access to the view only ────────────────────────────
-- The underlying table retains its existing staff-only RLS.
-- Views are not tables — RLS does not apply; the GRANT controls access.

GRANT SELECT ON public_brand_settings TO anon;
GRANT SELECT ON public_brand_settings TO authenticated;

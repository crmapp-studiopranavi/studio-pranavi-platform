import { describe, it, expect } from 'vitest';
import { brandingSchema } from '../../pages/admin/WebsiteBrandingPage';

const validBranding = {
  business_name: 'Studio Pranavi',
  business_tagline: 'We design the essence of light.',
  logo_path: null,
  logo_light_path: null,
  logo_dark_path: null,
  logo_mobile_path: null,
  favicon_path: null,
  og_image_path: null,
  primary_color: '#C8973A',
  secondary_color: '#2C2C2C',
  accent_color: '#C8973A',
  heading_font: 'Playfair Display' as const,
  body_font: 'Inter' as const,
  button_radius: '6px',
  hero_image_path: null,
};

describe('brandingSchema', () => {
  it('accepts valid Studio Pranavi branding', () => {
    const result = brandingSchema.safeParse(validBranding);
    expect(result.success).toBe(true);
  });

  it('rejects empty business_name', () => {
    const result = brandingSchema.safeParse({ ...validBranding, business_name: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const names = result.error.issues.map((i) => i.path.join('.'));
      expect(names).toContain('business_name');
    }
  });

  it('rejects invalid hex for primary_color', () => {
    const result = brandingSchema.safeParse({ ...validBranding, primary_color: 'C8973A' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const names = result.error.issues.map((i) => i.path.join('.'));
      expect(names).toContain('primary_color');
    }
  });

  it('rejects shorthand hex for secondary_color', () => {
    const result = brandingSchema.safeParse({ ...validBranding, secondary_color: '#2C2' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid hex for accent_color', () => {
    const result = brandingSchema.safeParse({ ...validBranding, accent_color: '#GGGGGG' });
    expect(result.success).toBe(false);
  });

  it('rejects unapproved heading font', () => {
    const result = brandingSchema.safeParse({ ...validBranding, heading_font: 'Arial' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const names = result.error.issues.map((i) => i.path.join('.'));
      expect(names).toContain('heading_font');
    }
  });

  it('rejects unapproved body font', () => {
    const result = brandingSchema.safeParse({ ...validBranding, body_font: 'Comic Sans MS' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const names = result.error.issues.map((i) => i.path.join('.'));
      expect(names).toContain('body_font');
    }
  });

  it('accepts null logo_path (image not uploaded yet)', () => {
    const result = brandingSchema.safeParse({ ...validBranding, logo_path: null });
    expect(result.success).toBe(true);
  });

  it('accepts all approved heading fonts', () => {
    const fonts = ['Playfair Display', 'Cormorant Garamond', 'EB Garamond'] as const;
    fonts.forEach((f) => {
      const result = brandingSchema.safeParse({ ...validBranding, heading_font: f });
      expect(result.success).toBe(true);
    });
  });

  it('accepts all approved body fonts', () => {
    const fonts = ['Inter', 'DM Sans', 'Lato'] as const;
    fonts.forEach((f) => {
      const result = brandingSchema.safeParse({ ...validBranding, body_font: f });
      expect(result.success).toBe(true);
    });
  });
});

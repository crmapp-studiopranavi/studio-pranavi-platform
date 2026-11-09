import { describe, it, expect } from 'vitest';
import { resolveLogoUrl, BRAND_DEFAULTS } from '../hooks/use-brand-settings';
import type { BrandSettings } from '../hooks/use-brand-settings';

// ── resolveLogoUrl ────────────────────────────────────────────────────────────

describe('resolveLogoUrl', () => {
  const base: BrandSettings = {
    ...BRAND_DEFAULTS,
    logo_path: 'https://storage.example.com/logos/main.png',
    logo_light_path: 'https://storage.example.com/logos/light.png',
    logo_dark_path: null,
    logo_mobile_path: 'https://storage.example.com/logos/mobile.png',
  };

  it('returns null when settings are undefined', () => {
    expect(resolveLogoUrl(undefined)).toBeNull();
  });

  it('default variant returns logo_path', () => {
    expect(resolveLogoUrl(base, 'default')).toBe(base.logo_path);
  });

  it('light variant returns logo_light_path when set', () => {
    expect(resolveLogoUrl(base, 'light')).toBe(base.logo_light_path);
  });

  it('light variant falls back to logo_path when logo_light_path is null', () => {
    const s: BrandSettings = { ...base, logo_light_path: null };
    expect(resolveLogoUrl(s, 'light')).toBe(base.logo_path);
  });

  it('mobile variant returns logo_mobile_path when set', () => {
    expect(resolveLogoUrl(base, 'mobile')).toBe(base.logo_mobile_path);
  });

  it('mobile variant falls back to default when logo_mobile_path is null', () => {
    const s: BrandSettings = { ...base, logo_mobile_path: null };
    expect(resolveLogoUrl(s, 'mobile')).toBe(base.logo_path);
  });

  it('dark variant returns null when logo_dark_path is null', () => {
    expect(resolveLogoUrl(base, 'dark')).toBeNull();
  });

  it('dark variant returns logo_dark_path when set', () => {
    const s: BrandSettings = { ...base, logo_dark_path: 'https://example.com/dark.png' };
    expect(resolveLogoUrl(s, 'dark')).toBe('https://example.com/dark.png');
  });

  it('default variant returns null when both env and logo_path are absent', () => {
    const s: BrandSettings = { ...base, logo_path: null };
    expect(resolveLogoUrl(s, 'default')).toBeNull();
  });
});

// ── Hex color validation ──────────────────────────────────────────────────────

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

describe('hex color validation', () => {
  const valid = ['#2C2C2C', '#F9F5EF', '#EDE8DF', '#C8973A', '#9E7529', '#2D6A6A'];
  const invalid = ['2C2C2C', '#abc', '#GGGGGG', '', '#12345', '#1234567'];

  it.each(valid)('accepts valid hex %s', (hex) => {
    expect(HEX_RE.test(hex)).toBe(true);
  });

  it.each(invalid)('rejects invalid hex %s', (hex) => {
    expect(HEX_RE.test(hex)).toBe(false);
  });
});

// ── WCAG AA contrast ──────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function linearise(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * linearise(r) + 0.7152 * linearise(g) + 0.0722 * linearise(b);
}

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = luminance(hex1);
  const l2 = luminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('WCAG AA contrast ratios', () => {
  it('charcoal on ivory meets AA normal text (≥ 4.5:1)', () => {
    expect(contrastRatio('#2C2C2C', '#F9F5EF')).toBeGreaterThanOrEqual(4.5);
  });

  it('ivory on charcoal meets AA normal text (≥ 4.5:1)', () => {
    expect(contrastRatio('#F9F5EF', '#2C2C2C')).toBeGreaterThanOrEqual(4.5);
  });

  it('amber on charcoal meets AA large text (≥ 3:1)', () => {
    expect(contrastRatio('#C8973A', '#2C2C2C')).toBeGreaterThanOrEqual(3);
  });

  it('brass on ivory meets AA large text (≥ 3:1)', () => {
    expect(contrastRatio('#9E7529', '#F9F5EF')).toBeGreaterThanOrEqual(3);
  });
});

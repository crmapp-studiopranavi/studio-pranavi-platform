/**
 * Unit tests for CMS form schema validation and data integrity rules.
 * Tests run against pure Zod schemas — no Supabase/network calls.
 */
import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// ── Slug schema (shared across CMS entities) ───────────────────────────────────
const slugSchema = z
  .string()
  .min(1, 'Slug required')
  .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens');

describe('slug validation', () => {
  it('accepts lowercase slug', () => {
    expect(slugSchema.safeParse('bespoke-lighting').success).toBe(true);
    expect(slugSchema.safeParse('home').success).toBe(true);
    expect(slugSchema.safeParse('project-123').success).toBe(true);
  });

  it('rejects uppercase letters', () => {
    expect(slugSchema.safeParse('Bespoke-Lighting').success).toBe(false);
  });

  it('rejects spaces', () => {
    expect(slugSchema.safeParse('my project').success).toBe(false);
  });

  it('rejects special characters', () => {
    expect(slugSchema.safeParse('project_detail').success).toBe(false);
    expect(slugSchema.safeParse('project/detail').success).toBe(false);
  });

  it('rejects empty string', () => {
    expect(slugSchema.safeParse('').success).toBe(false);
  });
});

// ── Page section type enum ─────────────────────────────────────────────────────
const SECTION_TYPE_VALUES = [
  'hero',
  'selected_projects',
  'services',
  'collections',
  'gallery',
  'video',
  'about',
  'text_image',
  'craftsmanship',
  'materials',
  'process_timeline',
  'before_after',
  'testimonials',
  'faq',
  'cta',
  'contact',
  'map',
] as const;

const sectionTypeSchema = z.enum(SECTION_TYPE_VALUES);

describe('section type enum', () => {
  it('accepts all 17 valid section types', () => {
    for (const t of SECTION_TYPE_VALUES) {
      expect(sectionTypeSchema.safeParse(t).success).toBe(true);
    }
    expect(SECTION_TYPE_VALUES.length).toBe(17);
  });

  it('rejects unknown section type', () => {
    expect(sectionTypeSchema.safeParse('banner').success).toBe(false);
    expect(sectionTypeSchema.safeParse('').success).toBe(false);
  });
});

// ── Section theme enum ─────────────────────────────────────────────────────────
const sectionThemeSchema = z.enum(['light', 'dark', 'stone', 'amber']);

describe('section theme enum', () => {
  it('accepts all 4 themes', () => {
    expect(sectionThemeSchema.safeParse('light').success).toBe(true);
    expect(sectionThemeSchema.safeParse('dark').success).toBe(true);
    expect(sectionThemeSchema.safeParse('stone').success).toBe(true);
    expect(sectionThemeSchema.safeParse('amber').success).toBe(true);
  });

  it('rejects unknown theme', () => {
    expect(sectionThemeSchema.safeParse('red').success).toBe(false);
  });
});

// ── Content status enum ────────────────────────────────────────────────────────
const contentStatusSchema = z.enum(['draft', 'published', 'archived']);

describe('content status enum', () => {
  it('accepts valid statuses', () => {
    expect(contentStatusSchema.safeParse('draft').success).toBe(true);
    expect(contentStatusSchema.safeParse('published').success).toBe(true);
    expect(contentStatusSchema.safeParse('archived').success).toBe(true);
  });

  it('rejects invalid status', () => {
    expect(contentStatusSchema.safeParse('active').success).toBe(false);
    expect(contentStatusSchema.safeParse('').success).toBe(false);
  });
});

// ── SEO meta description length ────────────────────────────────────────────────
const metaDescriptionSchema = z.string().max(160, 'Max 160 characters');

describe('SEO meta description', () => {
  it('accepts description under 160 chars', () => {
    expect(metaDescriptionSchema.safeParse('A'.repeat(160)).success).toBe(true);
    expect(metaDescriptionSchema.safeParse('Short description').success).toBe(true);
  });

  it('rejects description over 160 chars', () => {
    expect(metaDescriptionSchema.safeParse('A'.repeat(161)).success).toBe(false);
  });

  it('accepts empty description', () => {
    expect(metaDescriptionSchema.safeParse('').success).toBe(true);
  });
});

// ── Focal point validation (0.000–1.000) ───────────────────────────────────────
const focalPointSchema = z.number().min(0).max(1);

describe('focal point value', () => {
  it('accepts 0.0 through 1.0', () => {
    expect(focalPointSchema.safeParse(0).success).toBe(true);
    expect(focalPointSchema.safeParse(0.5).success).toBe(true);
    expect(focalPointSchema.safeParse(1).success).toBe(true);
    expect(focalPointSchema.safeParse(0.333).success).toBe(true);
  });

  it('rejects values outside range', () => {
    expect(focalPointSchema.safeParse(-0.001).success).toBe(false);
    expect(focalPointSchema.safeParse(1.001).success).toBe(false);
  });
});

// ── Page path must start with / ────────────────────────────────────────────────
const pagePathSchema = z.string().min(1).startsWith('/', 'Must start with /');

describe('SEO page path', () => {
  it('accepts paths starting with /', () => {
    expect(pagePathSchema.safeParse('/').success).toBe(true);
    expect(pagePathSchema.safeParse('/projects').success).toBe(true);
    expect(pagePathSchema.safeParse('/studio/about').success).toBe(true);
  });

  it('rejects paths without leading slash', () => {
    expect(pagePathSchema.safeParse('projects').success).toBe(false);
    expect(pagePathSchema.safeParse('').success).toBe(false);
  });
});

// ── Navigation group enum ─────────────────────────────────────────────────────
const navGroupSchema = z.enum(['main', 'footer', 'mobile']);

describe('navigation group', () => {
  it('accepts valid groups', () => {
    expect(navGroupSchema.safeParse('main').success).toBe(true);
    expect(navGroupSchema.safeParse('footer').success).toBe(true);
    expect(navGroupSchema.safeParse('mobile').success).toBe(true);
  });

  it('rejects unknown group', () => {
    expect(navGroupSchema.safeParse('sidebar').success).toBe(false);
  });
});

// ── Sort order must be non-negative integer ────────────────────────────────────
const sortOrderSchema = z.number().int().min(0);

describe('sort order', () => {
  it('accepts 0 and positive integers', () => {
    expect(sortOrderSchema.safeParse(0).success).toBe(true);
    expect(sortOrderSchema.safeParse(99).success).toBe(true);
  });

  it('rejects negative values', () => {
    expect(sortOrderSchema.safeParse(-1).success).toBe(false);
  });

  it('rejects floats', () => {
    expect(sortOrderSchema.safeParse(1.5).success).toBe(false);
  });
});

// ── Testimonial consent: published testimonials require consent_recorded_at ────
// Business rule test — not Zod, just pure logic
describe('testimonial consent rule', () => {
  function canPublishTestimonial(t: { status: string; consent_recorded_at: string | null }) {
    return t.status !== 'published' || t.consent_recorded_at !== null;
  }

  it('allows draft without consent', () => {
    expect(canPublishTestimonial({ status: 'draft', consent_recorded_at: null })).toBe(true);
  });

  it('allows published with consent', () => {
    expect(
      canPublishTestimonial({ status: 'published', consent_recorded_at: '2026-11-09T00:00:00Z' })
    ).toBe(true);
  });

  it('blocks published without consent', () => {
    expect(canPublishTestimonial({ status: 'published', consent_recorded_at: null })).toBe(false);
  });
});

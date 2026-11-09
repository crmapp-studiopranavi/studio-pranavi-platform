import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { formatDate, formatDateTime, isOverdue, relativeDays, formatCurrency } from '../format';

// ─── Common schema patterns used in CRM forms ─────────────────────────────────

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be a date in YYYY-MM-DD format');

const positiveAmountSchema = z
  .number({ invalid_type_error: 'Must be a number' })
  .positive('Amount must be positive');

const emailSchema = z.string().email('Invalid email address');

const uuidSchema = z.string().uuid('Must be a valid UUID');

describe('ISO date schema', () => {
  it('accepts valid ISO date', () => {
    expect(isoDateSchema.safeParse('2026-11-08').success).toBe(true);
    expect(isoDateSchema.safeParse('2099-12-31').success).toBe(true);
    expect(isoDateSchema.safeParse('2020-01-01').success).toBe(true);
  });

  it('rejects slash-separated date', () => {
    expect(isoDateSchema.safeParse('11/08/2026').success).toBe(false);
  });

  it('rejects dot-separated date', () => {
    expect(isoDateSchema.safeParse('08.11.2026').success).toBe(false);
  });

  it('rejects arbitrary string', () => {
    expect(isoDateSchema.safeParse('not-a-date').success).toBe(false);
    expect(isoDateSchema.safeParse('today').success).toBe(false);
    expect(isoDateSchema.safeParse('').success).toBe(false);
  });

  it('rejects datetime string', () => {
    expect(isoDateSchema.safeParse('2026-11-08T12:00:00').success).toBe(false);
  });
});

describe('Positive amount schema', () => {
  it('accepts positive integer', () => {
    expect(positiveAmountSchema.safeParse(1).success).toBe(true);
    expect(positiveAmountSchema.safeParse(1_000_000).success).toBe(true);
  });

  it('accepts positive decimal', () => {
    expect(positiveAmountSchema.safeParse(0.5).success).toBe(true);
  });

  it('rejects zero', () => {
    expect(positiveAmountSchema.safeParse(0).success).toBe(false);
  });

  it('rejects negative numbers', () => {
    expect(positiveAmountSchema.safeParse(-1).success).toBe(false);
    expect(positiveAmountSchema.safeParse(-100_000).success).toBe(false);
  });

  it('rejects non-numeric string', () => {
    expect(positiveAmountSchema.safeParse('100').success).toBe(false);
  });

  it('rejects null', () => {
    expect(positiveAmountSchema.safeParse(null).success).toBe(false);
  });
});

describe('Email schema', () => {
  it('accepts valid email', () => {
    expect(emailSchema.safeParse('user@example.com').success).toBe(true);
    expect(emailSchema.safeParse('test+tag@sub.domain.com').success).toBe(true);
  });

  it('rejects missing @', () => {
    expect(emailSchema.safeParse('notanemail').success).toBe(false);
  });

  it('rejects missing domain', () => {
    expect(emailSchema.safeParse('user@').success).toBe(false);
  });

  it('rejects empty string', () => {
    expect(emailSchema.safeParse('').success).toBe(false);
  });
});

describe('UUID schema', () => {
  it('accepts valid v4 UUID', () => {
    expect(uuidSchema.safeParse('550e8400-e29b-41d4-a716-446655440000').success).toBe(true);
  });

  it('rejects non-UUID string', () => {
    expect(uuidSchema.safeParse('not-a-uuid').success).toBe(false);
  });

  it('rejects empty string', () => {
    expect(uuidSchema.safeParse('').success).toBe(false);
  });
});

describe('Due date must be >= issue date (cross-field validation)', () => {
  const invoiceSchema = z
    .object({
      issueDate: isoDateSchema,
      dueDate: isoDateSchema,
    })
    .refine((d) => d.dueDate >= d.issueDate, {
      message: 'Due date must be on or after issue date',
      path: ['dueDate'],
    });

  it('accepts due date equal to issue date', () => {
    expect(
      invoiceSchema.safeParse({ issueDate: '2026-11-08', dueDate: '2026-11-08' }).success
    ).toBe(true);
  });

  it('accepts due date after issue date', () => {
    expect(
      invoiceSchema.safeParse({ issueDate: '2026-11-08', dueDate: '2026-12-08' }).success
    ).toBe(true);
  });

  it('rejects due date before issue date', () => {
    const result = invoiceSchema.safeParse({ issueDate: '2026-11-08', dueDate: '2026-11-07' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('dueDate');
    }
  });
});

// ─── Format utilities ─────────────────────────────────────────────────────────

describe('formatDate', () => {
  it('returns a non-empty string for a valid date', () => {
    const result = formatDate('2026-11-08');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    expect(result).not.toBe('—');
  });

  it('returns — for null', () => {
    expect(formatDate(null)).toBe('—');
  });

  it('returns — for undefined', () => {
    expect(formatDate(undefined)).toBe('—');
  });

  it('returns — for empty string', () => {
    expect(formatDate('')).toBe('—');
  });
});

describe('formatDateTime', () => {
  it('returns a non-empty string for a valid ISO datetime', () => {
    const result = formatDateTime('2026-11-08T10:30:00Z');
    expect(typeof result).toBe('string');
    expect(result).not.toBe('—');
  });

  it('returns — for null', () => {
    expect(formatDateTime(null)).toBe('—');
  });
});

describe('isOverdue', () => {
  it('returns true for a date in the past', () => {
    expect(isOverdue('2020-01-01')).toBe(true);
  });

  it('returns false for a date in the far future', () => {
    expect(isOverdue('2099-01-01')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isOverdue(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isOverdue(undefined)).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isOverdue('')).toBe(false);
  });
});

describe('relativeDays', () => {
  it('returns a non-empty string for a valid date', () => {
    expect(typeof relativeDays('2026-11-08')).toBe('string');
    expect(relativeDays('2026-11-08').length).toBeGreaterThan(0);
  });

  it('returns — for null', () => {
    expect(relativeDays(null)).toBe('—');
  });

  it('returns "In X days" for future dates', () => {
    expect(relativeDays('2099-01-01')).toMatch(/^In \d+ days$/);
  });

  it('returns "X days ago" for past dates', () => {
    expect(relativeDays('2020-01-01')).toMatch(/^\d+ days ago$/);
  });
});

describe('formatCurrency', () => {
  it('formats paise to INR with en-IN locale separators', () => {
    const result = formatCurrency(10_620_000); // ₹1,06,200
    expect(result).toContain('1,06,200');
  });

  it('formats zero as ₹0', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0');
  });

  it('returns — for null', () => {
    expect(formatCurrency(null)).toBe('—');
  });

  it('returns — for undefined', () => {
    expect(formatCurrency(undefined)).toBe('—');
  });
});

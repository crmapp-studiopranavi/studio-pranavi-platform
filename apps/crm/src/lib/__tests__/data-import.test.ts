import { describe, it, expect, beforeAll } from 'vitest';
import { resolveHeaders, ENTITY_FIELD_CONFIGS } from '../data-import/column-map';

describe('resolveHeaders — leads', () => {
  it('maps exact CRM field name', () => {
    const result = resolveHeaders('leads', ['full_name', 'email', 'phone']);
    expect(result).toEqual([
      { source: 'full_name', target: 'full_name' },
      { source: 'email', target: 'email' },
      { source: 'phone', target: 'phone' },
    ]);
  });

  it('maps common aliases case-insensitively', () => {
    const result = resolveHeaders('leads', ['Customer Name', 'Mobile', 'Email ID', 'Requirement']);
    expect(result).toEqual([
      { source: 'Customer Name', target: 'full_name' },
      { source: 'Mobile', target: 'whatsapp_number' },
      { source: 'Email ID', target: 'email' },
      { source: 'Requirement', target: 'project_description' },
    ]);
  });

  it('returns null target for unrecognized header', () => {
    const result = resolveHeaders('leads', ['RandomColumn']);
    expect(result).toEqual([{ source: 'RandomColumn', target: null }]);
  });

  it('maps Phone No to phone', () => {
    const result = resolveHeaders('leads', ['Phone No']);
    expect(result).toEqual([{ source: 'Phone No', target: 'phone' }]);
  });
});

describe('ENTITY_FIELD_CONFIGS', () => {
  it('has required field definitions for leads', () => {
    const cfg = ENTITY_FIELD_CONFIGS.leads;
    const required = cfg.filter((f) => f.required).map((f) => f.field);
    expect(required).toContain('full_name');
  });

  it('has required field definitions for customers', () => {
    const cfg = ENTITY_FIELD_CONFIGS.customers;
    const required = cfg.filter((f) => f.required).map((f) => f.field);
    expect(required).toContain('display_name');
  });
});

describe('resolveHeaders — customers', () => {
  it('maps customer aliases', () => {
    const result = resolveHeaders('customers', ['Customer Name', 'GSTIN', 'Type']);
    expect(result).toEqual([
      { source: 'Customer Name', target: 'display_name' },
      { source: 'GSTIN', target: 'gstin' },
      { source: 'Type', target: 'customer_type' },
    ]);
  });
});

describe('resolveHeaders — orders', () => {
  it('maps customer_email alias', () => {
    const result = resolveHeaders('orders', ['Customer Email']);
    expect(result).toEqual([{ source: 'Customer Email', target: 'customer_email' }]);
  });
});

describe('resolveHeaders — whitespace trimming', () => {
  it('trims leading/trailing whitespace from header before resolving', () => {
    const result = resolveHeaders('leads', ['  full_name  ', '  Email ID  ']);
    expect(result).toEqual([
      { source: '  full_name  ', target: 'full_name' },
      { source: '  Email ID  ', target: 'email' },
    ]);
  });
});

describe('ENTITY_FIELD_CONFIGS — orders and projects', () => {
  it('orders: customer_email is required', () => {
    const cfg = ENTITY_FIELD_CONFIGS.orders;
    const required = cfg.filter((f) => f.required).map((f) => f.field);
    expect(required).toContain('customer_email');
  });

  it('projects: name is required', () => {
    const cfg = ENTITY_FIELD_CONFIGS.projects;
    const required = cfg.filter((f) => f.required).map((f) => f.field);
    expect(required).toContain('name');
  });

  it('projects: customer_email is required', () => {
    const cfg = ENTITY_FIELD_CONFIGS.projects;
    const required = cfg.filter((f) => f.required).map((f) => f.field);
    expect(required).toContain('customer_email');
  });
});

import { validateRow } from '../data-import/validators';

describe('validateRow — leads', () => {
  const config = ENTITY_FIELD_CONFIGS.leads;

  it('accepts a fully valid lead row', () => {
    const result = validateRow(config, {
      full_name: 'Priya Sharma',
      email: 'priya@example.com',
      phone: '+919876543210',
      status: 'new',
      priority: 'medium',
      budget_min_paise: '50000',
      budget_max_paise: '200000',
      next_followup_at: '2026-12-01',
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects missing required full_name', () => {
    const result = validateRow(config, { email: 'a@b.com' });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === 'full_name')).toBe(true);
  });

  it('warns on invalid email but still marks row valid', () => {
    const result = validateRow(config, { full_name: 'Test', email: 'not-an-email' });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings.some((w) => w.field === 'email')).toBe(true);
  });

  it('accepts empty email (not required)', () => {
    const result = validateRow(config, { full_name: 'Test', email: '' });
    expect(result.valid).toBe(true);
  });

  it('warns on invalid status enum but still marks row valid', () => {
    const result = validateRow(config, { full_name: 'Test', status: 'unknown_status' });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings.some((w) => w.field === 'status')).toBe(true);
  });

  it('warns on invalid date format but still marks row valid', () => {
    const result = validateRow(config, { full_name: 'Test', next_follow_up_at: '32/13/2026' });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings.some((w) => w.field === 'next_follow_up_at')).toBe(true);
  });

  it('warns on non-numeric budget but still marks row valid', () => {
    const result = validateRow(config, { full_name: 'Test', budget_min_minor: 'abc' });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings.some((w) => w.field === 'budget_min_minor')).toBe(true);
  });

  it('accepts ISO date', () => {
    const result = validateRow(config, { full_name: 'Test', next_followup_at: '2026-12-01' });
    expect(result.valid).toBe(true);
  });

  it('converts budget rupees to paise in coerced output', () => {
    const result = validateRow(config, { full_name: 'Test', budget_min_minor: '100000' });
    expect(result.valid).toBe(true);
    expect(result.coerced['budget_min_minor']).toBe(10000000); // 100000 rupees × 100
  });
});

describe('validateRow — edge cases', () => {
  const config = ENTITY_FIELD_CONFIGS.leads;

  it('warns on calendar-invalid ISO date but still marks row valid', () => {
    const result = validateRow(config, { full_name: 'Test', next_follow_up_at: '2026-02-30' });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings.some((w) => w.field === 'next_follow_up_at')).toBe(true);
  });

  it('accepts budget with rupee symbol and commas (₹1,00,000)', () => {
    const result = validateRow(config, { full_name: 'Test', budget_min_minor: '₹1,00,000' });
    expect(result.valid).toBe(true);
    expect(result.coerced['budget_min_minor']).toBe(10000000); // 100000 rupees × 100
  });

  it('warns on invalid phone number but still marks row valid', () => {
    const result = validateRow(config, { full_name: 'Test', phone: 'not-a-phone' });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings.some((w) => w.field === 'phone')).toBe(true);
  });
});

import { detectDuplicates } from '../data-import/duplicate-detector';
import type { ExistingRecord } from '../data-import/duplicate-detector';

describe('detectDuplicates — leads', () => {
  const existing: ExistingRecord[] = [
    { id: 'uuid-1', email: 'priya@example.com', phone: null, whatsapp: null, external_id: null },
    {
      id: 'uuid-2',
      email: null,
      phone: '+919876543210',
      whatsapp: '+919876543210',
      external_id: null,
    },
    { id: 'uuid-3', email: null, phone: null, whatsapp: null, external_id: 'EXT-001' },
  ];

  it('detects email duplicate', () => {
    const result = detectDuplicates(existing, {
      email: 'priya@example.com',
      phone: '',
      whatsapp: '',
      external_id: '',
    });
    expect(result).not.toBeNull();
    expect(result!.id).toBe('uuid-1');
    expect(result!.matchField).toBe('email');
  });

  it('detects phone duplicate', () => {
    const result = detectDuplicates(existing, {
      email: '',
      phone: '+919876543210',
      whatsapp: '',
      external_id: '',
    });
    expect(result).not.toBeNull();
    expect(result!.id).toBe('uuid-2');
    expect(result!.matchField).toBe('phone');
  });

  it('detects whatsapp duplicate', () => {
    const result = detectDuplicates(existing, {
      email: '',
      phone: '',
      whatsapp: '+919876543210',
      external_id: '',
    });
    expect(result).not.toBeNull();
    expect(result!.matchField).toBe('whatsapp');
  });

  it('detects external_id duplicate', () => {
    const result = detectDuplicates(existing, {
      email: '',
      phone: '',
      whatsapp: '',
      external_id: 'EXT-001',
    });
    expect(result).not.toBeNull();
    expect(result!.matchField).toBe('external_id');
  });

  it('returns null when no match', () => {
    const result = detectDuplicates(existing, {
      email: 'new@example.com',
      phone: '',
      whatsapp: '',
      external_id: '',
    });
    expect(result).toBeNull();
  });

  it('does NOT match on name alone', () => {
    const result = detectDuplicates(existing, {
      email: '',
      phone: '',
      whatsapp: '',
      external_id: '',
    });
    expect(result).toBeNull();
  });

  it('matches phone numbers despite formatting differences', () => {
    // +91 98765 43210 vs +919876543210 — spaces stripped
    const result = detectDuplicates(existing, {
      email: '',
      phone: '+91 98765 43210',
      whatsapp: '',
      external_id: '',
    });
    expect(result).not.toBeNull();
    expect(result!.matchField).toBe('phone');
  });

  it('matches email case-insensitively', () => {
    const result = detectDuplicates(existing, {
      email: 'PRIYA@EXAMPLE.COM',
      phone: '',
      whatsapp: '',
      external_id: '',
    });
    expect(result).not.toBeNull();
    expect(result!.matchField).toBe('email');
  });
});

describe('detectDuplicates — phone normalisation formats', () => {
  const existing: ExistingRecord[] = [
    { id: 'uuid-dash', email: null, phone: '+919876543210', whatsapp: null, external_id: null },
  ];

  it('matches phone with dashes (+91-98765-43210)', () => {
    const result = detectDuplicates(existing, {
      phone: '+91-98765-43210',
      email: '',
      whatsapp: '',
      external_id: '',
    });
    expect(result).not.toBeNull();
    expect(result!.matchField).toBe('phone');
  });

  it('matches phone with parentheses ((+91) 9876543210)', () => {
    const result = detectDuplicates(existing, {
      phone: '(+91) 9876543210',
      email: '',
      whatsapp: '',
      external_id: '',
    });
    expect(result).not.toBeNull();
    expect(result!.matchField).toBe('phone');
  });
});

import { parseAndMap } from '../data-import/import-engine';
import type { ParsedImport } from '../data-import/import-engine';
import { FIXTURE_100, FIXTURE_1000, FIXTURE_INVALID } from './import-fixtures';

describe('parseAndMap — empty input', () => {
  it('returns zero counts for empty array', () => {
    const result = parseAndMap('leads', []);
    expect(result.total).toBe(0);
    expect(result.valid).toBe(0);
    expect(result.rows).toHaveLength(0);
  });
});

describe('parseAndMap — 100 fixture leads', () => {
  let result: ParsedImport;
  beforeAll(() => {
    result = parseAndMap('leads', FIXTURE_100 as unknown as Record<string, string>[]);
  });

  it('parses all 100 rows', () => {
    expect(result.total).toBe(100);
  });

  it('all 100 rows are valid', () => {
    expect(result.valid).toBe(100);
    expect(result.invalid).toBe(0);
  });

  it('no duplicates in a fresh dataset', () => {
    expect(result.duplicates).toBe(0);
  });
});

describe('parseAndMap — 1000 fixture leads', () => {
  let result: ParsedImport;
  beforeAll(() => {
    result = parseAndMap('leads', FIXTURE_1000 as unknown as Record<string, string>[]);
  });

  it('parses all 1000 rows', () => {
    expect(result.total).toBe(1000);
  });

  it('all 1000 rows are valid', () => {
    expect(result.valid).toBe(1000);
    expect(result.invalid).toBe(0);
  });

  it('no duplicates in a fresh dataset', () => {
    expect(result.duplicates).toBe(0);
  });
});

describe('parseAndMap — invalid fixture', () => {
  let result: ParsedImport;
  beforeAll(() => {
    result = parseAndMap('leads', FIXTURE_INVALID as unknown as Record<string, string>[]);
  });

  it('total = 3', () => {
    expect(result.total).toBe(3);
  });

  it('row with missing required full_name is invalid; format-only issues are warnings not errors', () => {
    // Row 0: full_name='' → hard error (required missing) → invalid
    // Row 1: full_name='OK Name', budget field unmapped → valid (no errors)
    // Row 2: full_name='Date Test', bad date format → soft warning → valid
    expect(result.invalid).toBe(1);
    expect(result.valid).toBe(2);
  });

  it('the invalid row has a required-field error', () => {
    const invalidRows = result.rows.filter((r) => r.errors.length > 0);
    expect(invalidRows).toHaveLength(1);
    expect(invalidRows[0].errors.some((e) => e.field === 'full_name')).toBe(true);
  });
});

describe('parseAndMap — alias header auto-mapping', () => {
  it('maps aliased headers before validating', () => {
    const aliasRows: Record<string, string>[] = [
      { 'Customer Name': 'Alias Test', 'Email ID': 'alias@test.invalid', Mobile: '+919000000001' },
    ];
    const result = parseAndMap('leads', aliasRows);
    expect(result.valid).toBe(1);
  });
});

describe('parseAndMap — duplicate detection', () => {
  it('flags a row as duplicate when email matches existing record', () => {
    const existing = [
      {
        id: 'existing-1',
        email: 'duplicate@test.invalid',
        phone: null,
        whatsapp: null,
        external_id: null,
      },
    ];
    const rows: Record<string, string>[] = [
      { full_name: 'Dup User', email: 'duplicate@test.invalid' },
    ];
    const result = parseAndMap('leads', rows, existing);
    expect(result.duplicates).toBe(1);
    expect(result.valid).toBe(0);
    expect(result.rows[0].duplicateMatch?.matchField).toBe('email');
  });
});

describe('parseAndMap — error + duplicate overlap counting', () => {
  it('a row with a duplicate match and only warnings is counted in duplicates but not invalid', () => {
    const existing = [
      { id: 'ex-1', email: 'overlap@test.invalid', phone: null, whatsapp: null, external_id: null },
    ];
    // Row has an unrecognised status (soft warning, not a hard error) AND matching email (duplicate)
    const rows: Record<string, string>[] = [
      { full_name: 'Overlap User', email: 'overlap@test.invalid', status: 'not_a_status' },
    ];
    const result = parseAndMap('leads', rows, existing);
    expect(result.total).toBe(1);
    expect(result.invalid).toBe(0); // status warning ≠ hard error
    expect(result.duplicates).toBe(1);
    expect(result.valid).toBe(0); // not counted as valid because it has a duplicate match
  });

  it('a row with a missing required field AND a duplicate is counted in both invalid AND duplicates', () => {
    const existing = [
      { id: 'ex-1', email: 'overlap@test.invalid', phone: null, whatsapp: null, external_id: null },
    ];
    // Row is missing full_name (hard error) AND has matching email (duplicate)
    const rows: Record<string, string>[] = [{ full_name: '', email: 'overlap@test.invalid' }];
    const result = parseAndMap('leads', rows, existing);
    expect(result.total).toBe(1);
    expect(result.invalid).toBe(1);
    expect(result.duplicates).toBe(1);
    expect(result.valid).toBe(0);
    // invalid + duplicates can exceed total when a row has both — documented behaviour
  });
});

import { describe, it, expect } from 'vitest';
import {
  sanitiseValue,
  rowsToCsv,
  recordsToCsvByConfig,
  EXPORT_CONFIGS,
} from '../data-export/export-engine';

describe('sanitiseValue — formula injection protection', () => {
  it('strips leading = from strings', () => {
    expect(sanitiseValue('=SUM(A1)')).toBe("'=SUM(A1)");
  });

  it('strips leading + from strings', () => {
    expect(sanitiseValue('+123')).toBe("'+123");
  });

  it('strips leading - from strings', () => {
    expect(sanitiseValue('-1')).toBe("'-1");
  });

  it('strips leading @ from strings', () => {
    expect(sanitiseValue('@admin')).toBe("'@admin");
  });

  it('strips leading | from strings', () => {
    expect(sanitiseValue('|pipe')).toBe("'|pipe");
  });

  it('does not modify safe strings', () => {
    expect(sanitiseValue('Priya Sharma')).toBe('Priya Sharma');
    expect(sanitiseValue('priya@example.com')).toBe('priya@example.com');
    expect(sanitiseValue('123456')).toBe('123456');
  });

  it('handles null as empty string', () => {
    expect(sanitiseValue(null)).toBe('');
  });

  it('handles undefined as empty string', () => {
    expect(sanitiseValue(undefined)).toBe('');
  });

  it('handles numbers correctly (positive numbers are safe)', () => {
    expect(sanitiseValue(42)).toBe('42');
    expect(sanitiseValue(0)).toBe('0');
  });
});

describe('rowsToCsv', () => {
  it('generates CSV with header row', () => {
    const csv = rowsToCsv(['name', 'email'], [{ name: 'Priya', email: 'priya@example.com' }]);
    expect(csv).toContain('name,email');
    expect(csv).toContain('Priya');
    expect(csv).toContain('priya@example.com');
  });

  it('sanitises formula-injection values in CSV output', () => {
    const csv = rowsToCsv(['name'], [{ name: '=EVIL()' }]);
    // The sanitised value must be prefixed with ' so spreadsheets treat it as text
    expect(csv).toContain("'=EVIL()");
    // The raw dangerous value must not appear at the start of a CSV field
    expect(csv).not.toMatch(/(^|,|\r?\n)=EVIL\(\)/);
  });

  it('produces CSV with just headers for empty rows', () => {
    const csv = rowsToCsv(['name', 'email'], []);
    expect(csv).toContain('name');
    expect(csv).toContain('email');
  });
});

describe('recordsToCsvByConfig', () => {
  it('maps record fields to configured column headers', () => {
    const config = EXPORT_CONFIGS['leads'];
    const csv = recordsToCsvByConfig(config, [
      { full_name: 'Test Lead', email: 'test@example.com', id: 'uuid-1' },
    ]);
    expect(csv).toContain('Full Name');
    expect(csv).toContain('Test Lead');
    expect(csv).toContain('test@example.com');
  });

  it('sanitises dangerous values', () => {
    const config = EXPORT_CONFIGS['leads'];
    const csv = recordsToCsvByConfig(config, [
      { full_name: '=DANGEROUS', email: 'safe@example.com' },
    ]);
    // The sanitised value must be prefixed with ' so spreadsheets treat it as text
    expect(csv).toContain("'=DANGEROUS");
    // The raw dangerous value must not appear at the start of a CSV field
    expect(csv).not.toMatch(/(^|,|\r?\n)=DANGEROUS/);
  });
});

describe('EXPORT_CONFIGS', () => {
  const EXPECTED_ENTITIES = [
    'leads',
    'customers',
    'tasks',
    'site_visits',
    'measurements',
    'quotations',
    'orders',
    'projects',
    'installations',
    'invoices',
    'payments',
  ];

  it('has config for all 11 export entities', () => {
    for (const e of EXPECTED_ENTITIES) {
      expect(EXPORT_CONFIGS[e]).toBeDefined();
    }
  });

  it('each entity config has at least one column', () => {
    for (const e of EXPECTED_ENTITIES) {
      expect(EXPORT_CONFIGS[e].columns.length).toBeGreaterThan(0);
    }
  });

  it('each entity config has a table name', () => {
    for (const e of EXPECTED_ENTITIES) {
      expect(EXPORT_CONFIGS[e].table).toBeTruthy();
    }
  });

  it('leads config has ID, Full Name, Email columns', () => {
    const headers = EXPORT_CONFIGS['leads'].columns.map((c) => c.header);
    expect(headers).toContain('ID');
    expect(headers).toContain('Full Name');
    expect(headers).toContain('Email');
  });
});

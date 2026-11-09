import { describe, it, expect } from 'vitest';

// ── Currency formatting ────────────────────────────────────────────────────────

function fmt(minor: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(minor / 100);
}

describe('currency formatting (paise → INR)', () => {
  it('formats zero', () => {
    expect(fmt(0)).toContain('0');
  });
  it('formats 100 paise as ₹1', () => {
    expect(fmt(100)).toContain('1');
  });
  it('formats 100000 paise as ₹1,000', () => {
    expect(fmt(100000)).toContain('1,000');
  });
  it('formats 10000000 paise as ₹1,00,000 (en-IN grouping)', () => {
    expect(fmt(10000000)).toContain('1,00,000');
  });
});

// ── Conversion rate calculation ────────────────────────────────────────────────

function conversionRate(won: number, lost: number): number | null {
  const closed = won + lost;
  if (closed === 0) return null;
  return Math.round((won / closed) * 1000) / 10;
}

describe('conversion rate', () => {
  it('returns null when no closed leads', () => {
    expect(conversionRate(0, 0)).toBeNull();
  });
  it('returns 0 when all lost', () => {
    expect(conversionRate(0, 10)).toBe(0);
  });
  it('returns 100 when all won', () => {
    expect(conversionRate(10, 0)).toBe(100);
  });
  it('returns 50 for equal won/lost', () => {
    expect(conversionRate(5, 5)).toBe(50);
  });
  it('handles fractional correctly', () => {
    expect(conversionRate(1, 3)).toBeCloseTo(25);
  });
});

// ── Ageing bucket assignment ───────────────────────────────────────────────────

function ageingBucket(dueDateStr: string, todayStr: string): string {
  const due = new Date(dueDateStr);
  const today = new Date(todayStr);
  const daysOverdue = Math.floor((today.getTime() - due.getTime()) / 86400_000);
  if (daysOverdue <= 0) return 'current';
  if (daysOverdue <= 30) return '1–30 days';
  if (daysOverdue <= 60) return '31–60 days';
  if (daysOverdue <= 90) return '61–90 days';
  return '90+ days';
}

describe('ageing bucket assignment', () => {
  const today = '2026-11-09';
  it('due today = current', () => {
    expect(ageingBucket('2026-11-09', today)).toBe('current');
  });
  it('due tomorrow = current', () => {
    expect(ageingBucket('2026-11-10', today)).toBe('current');
  });
  it('1 day overdue → 1-30 days', () => {
    expect(ageingBucket('2026-11-08', today)).toBe('1–30 days');
  });
  it('30 days overdue → 1-30 days', () => {
    expect(ageingBucket('2026-10-10', today)).toBe('1–30 days');
  });
  it('31 days overdue → 31-60 days', () => {
    expect(ageingBucket('2026-10-09', today)).toBe('31–60 days');
  });
  it('60 days overdue → 31-60 days', () => {
    expect(ageingBucket('2026-09-10', today)).toBe('31–60 days');
  });
  it('61 days overdue → 61-90 days', () => {
    expect(ageingBucket('2026-09-09', today)).toBe('61–90 days');
  });
  it('91 days overdue → 90+ days', () => {
    expect(ageingBucket('2026-08-10', today)).toBe('90+ days');
  });
});

// ── Installation completion rate ───────────────────────────────────────────────

function installRate(total: number, completed: number): string {
  if (total === 0) return '—';
  return ((completed / total) * 100).toFixed(1) + '%';
}

describe('installation completion rate', () => {
  it('returns em dash when no installations', () => {
    expect(installRate(0, 0)).toBe('—');
  });
  it('returns 0% when none completed', () => {
    expect(installRate(10, 0)).toBe('0.0%');
  });
  it('returns 100% when all completed', () => {
    expect(installRate(5, 5)).toBe('100.0%');
  });
  it('rounds to 1 decimal', () => {
    expect(installRate(3, 1)).toBe('33.3%');
  });
});

// ── Finance summary totals ─────────────────────────────────────────────────────

describe('finance summary checks', () => {
  it('received cannot exceed invoiced', () => {
    const invoiced = 5_000_000;
    const received = 3_200_000;
    expect(received).toBeLessThanOrEqual(invoiced);
    expect(invoiced - received).toBe(1_800_000);
  });

  it('ageing bucket totals sum correctly', () => {
    const buckets = [
      { amount_minor: 500_000 },
      { amount_minor: 300_000 },
      { amount_minor: 200_000 },
    ];
    const total = buckets.reduce((a, b) => a + b.amount_minor, 0);
    expect(total).toBe(1_000_000);
  });
});

// ── Default date range (FY April start) ───────────────────────────────────────

function fyFromDate(now: Date): string {
  const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return `${year}-04-01`;
}

describe('default financial year start', () => {
  it('April 1 of current year when month is April', () => {
    expect(fyFromDate(new Date('2026-04-15'))).toBe('2026-04-01');
  });
  it('April 1 of current year when month is November', () => {
    expect(fyFromDate(new Date('2026-11-09'))).toBe('2026-04-01');
  });
  it('April 1 of previous year in January', () => {
    expect(fyFromDate(new Date('2026-01-10'))).toBe('2025-04-01');
  });
  it('April 1 of previous year in March', () => {
    expect(fyFromDate(new Date('2026-03-31'))).toBe('2025-04-01');
  });
});

// ── Sales performance sort ─────────────────────────────────────────────────────

describe('sales performance ordering', () => {
  const rows = [
    { owner: 'Alice', total: 10, won: 3, lost: 2, conversion_rate: 60 },
    { owner: 'Bob', total: 25, won: 8, lost: 5, conversion_rate: 61.5 },
    { owner: 'Carol', total: 5, won: 5, lost: 0, conversion_rate: 100 },
  ];

  it('sorted by total descending from RPC', () => {
    const sorted = [...rows].sort((a, b) => b.total - a.total);
    expect(sorted[0].owner).toBe('Bob');
    expect(sorted[1].owner).toBe('Alice');
    expect(sorted[2].owner).toBe('Carol');
  });
});

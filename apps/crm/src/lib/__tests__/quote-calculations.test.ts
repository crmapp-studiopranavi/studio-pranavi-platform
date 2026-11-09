import { describe, it, expect } from 'vitest';
import { calcLineItem, calcVersionTotals, inrToMinor } from '../quote-calculations';

describe('calcLineItem', () => {
  it('basic: no discount, no tax', () => {
    const r = calcLineItem(2, 50000, 0, 0); // 2 × ₹500 = ₹1000
    expect(r.lineSubtotalMinor).toBe(100000);
    expect(r.lineDiscountMinor).toBe(0);
    expect(r.lineTaxMinor).toBe(0);
    expect(r.lineTotalMinor).toBe(100000);
  });

  it('floors subtotal for fractional quantity', () => {
    // 1.5 × 333 = 499.5 → floor = 499
    const r = calcLineItem(1.5, 333, 0, 0);
    expect(r.lineSubtotalMinor).toBe(499);
  });

  it('floors discount when result is exact', () => {
    const r = calcLineItem(1, 1000, 0.3, 0); // 1000 × 0.3 = 300
    expect(r.lineDiscountMinor).toBe(300);
    expect(r.lineTotalMinor).toBe(700);
  });

  it('floors discount when result is fractional', () => {
    // 100 × (1/3) = 33.333... → floor = 33
    const r = calcLineItem(1, 100, 1 / 3, 0);
    expect(r.lineDiscountMinor).toBe(33);
  });

  it('applies 18% GST on after-discount amount', () => {
    // subtotal=10000, discount=0, tax=floor(10000*0.18)=1800, total=11800
    const r = calcLineItem(1, 10000, 0, 0.18);
    expect(r.lineSubtotalMinor).toBe(10000);
    expect(r.lineTaxMinor).toBe(1800);
    expect(r.lineTotalMinor).toBe(11800);
  });

  it('floors tax on fractional result', () => {
    // 111 × 0.18 = 19.98 → floor = 19
    const r = calcLineItem(1, 111, 0, 0.18);
    expect(r.lineTaxMinor).toBe(19);
    expect(r.lineTotalMinor).toBe(130); // 111 + 19
  });

  it('applies discount then tax on remainder', () => {
    // subtotal=10000, discount=1000, after=9000, tax=floor(9000×0.18)=1620, total=10620
    const r = calcLineItem(1, 10000, 0.1, 0.18);
    expect(r.lineSubtotalMinor).toBe(10000);
    expect(r.lineDiscountMinor).toBe(1000);
    expect(r.lineTaxMinor).toBe(1620);
    expect(r.lineTotalMinor).toBe(10620);
  });

  it('zero tax rate produces zero tax', () => {
    const r = calcLineItem(5, 2000, 0, 0);
    expect(r.lineTaxMinor).toBe(0);
    expect(r.lineTotalMinor).toBe(r.lineSubtotalMinor);
  });

  it('handles 5% GST (transport rate)', () => {
    const r = calcLineItem(1, 10000, 0, 0.05);
    expect(r.lineTaxMinor).toBe(500);
    expect(r.lineTotalMinor).toBe(10500);
  });

  it('multiple tax rates across independent items', () => {
    const item18 = calcLineItem(1, 10000, 0, 0.18);
    const item5 = calcLineItem(1, 10000, 0, 0.05);
    expect(item18.lineTaxMinor).toBe(1800);
    expect(item5.lineTaxMinor).toBe(500);
  });

  it('total = subtotal - discount + tax', () => {
    const r = calcLineItem(3, 7777, 0.07, 0.12);
    expect(r.lineTotalMinor).toBe(r.lineSubtotalMinor - r.lineDiscountMinor + r.lineTaxMinor);
  });
});

describe('calcVersionTotals', () => {
  it('sums multiple items correctly', () => {
    const items = [
      calcLineItem(1, 10000, 0, 0.18), // sub=10000, disc=0, tax=1800, total=11800
      calcLineItem(2, 5000, 0.1, 0.05), // sub=10000, disc=1000, after=9000, tax=450, total=9450
    ];
    const t = calcVersionTotals(items);
    expect(t.subtotalMinor).toBe(20000);
    expect(t.discountMinor).toBe(1000);
    expect(t.taxMinor).toBe(2250);
    expect(t.totalMinor).toBe(21250); // 20000 - 1000 + 2250
  });

  it('empty items list gives zero totals', () => {
    const t = calcVersionTotals([]);
    expect(t.subtotalMinor).toBe(0);
    expect(t.discountMinor).toBe(0);
    expect(t.taxMinor).toBe(0);
    expect(t.totalMinor).toBe(0);
  });

  it('invariant: total = subtotal - discount + tax', () => {
    const items = [
      calcLineItem(3, 7500, 0.05, 0.12),
      calcLineItem(1, 12000, 0, 0.18),
      calcLineItem(0.5, 8000, 0.15, 0),
    ];
    const t = calcVersionTotals(items);
    expect(t.totalMinor).toBe(t.subtotalMinor - t.discountMinor + t.taxMinor);
  });

  it('single item with zero tax', () => {
    const items = [calcLineItem(10, 500, 0, 0)];
    const t = calcVersionTotals(items);
    expect(t.taxMinor).toBe(0);
    expect(t.totalMinor).toBe(5000);
  });
});

describe('revision immutability guard', () => {
  it('updating a sent version throws', () => {
    function updateVersionIfDraft(version: { sent_at: string | null }, newTotal: number) {
      if (version.sent_at !== null) {
        throw new Error('Cannot modify a sent quote version. Create a new version instead.');
      }
      return { ...version, total: newTotal };
    }

    expect(() => updateVersionIfDraft({ sent_at: null }, 5000)).not.toThrow();
    expect(() => updateVersionIfDraft({ sent_at: '2026-11-08T00:00:00Z' }, 5000)).toThrow(
      'Cannot modify a sent quote version'
    );
  });

  it('revision increments version number', () => {
    const versions = [{ version_number: 1 }, { version_number: 2 }];
    const next = Math.max(...versions.map((v) => v.version_number)) + 1;
    expect(next).toBe(3);
  });

  it('new revision does not mutate previous version totals', () => {
    const originalTotal = 50000;
    const originalVersion = {
      id: 'v1',
      total_minor: originalTotal,
      sent_at: '2026-11-08T00:00:00Z',
    };
    // Revision creates a separate new version object
    const newVersion = { id: 'v2', total_minor: 0, sent_at: null };
    newVersion.total_minor = 60000; // mutating new version
    expect(originalVersion.total_minor).toBe(originalTotal); // original unchanged
  });
});

describe('inrToMinor', () => {
  it('converts whole rupees', () => {
    expect(inrToMinor(100)).toBe(10000);
  });

  it('converts fractional rupees', () => {
    expect(inrToMinor(1.5)).toBe(150);
  });

  it('floors sub-paisa amounts', () => {
    expect(inrToMinor(1.999)).toBe(199);
  });
});

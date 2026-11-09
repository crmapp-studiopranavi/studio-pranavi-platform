import { describe, it, expect } from 'vitest';
import {
  calcInvoiceLine,
  calcInvoiceTotals,
  applyPayment,
  reversePayment,
} from '../invoice-calculations';

describe('calcInvoiceLine', () => {
  it('no discount, no tax — subtotal equals qty × price', () => {
    const r = calcInvoiceLine(3, 100000, 0, 0);
    expect(r.lineSubtotalMinor).toBe(300000);
    expect(r.lineDiscountMinor).toBe(0);
    expect(r.lineTaxMinor).toBe(0);
    expect(r.lineTotalMinor).toBe(300000);
  });

  it('18% GST with floor arithmetic', () => {
    // 1 unit × 99999 paise, 0% discount, 18% tax
    // tax = floor(99999 × 0.18) = floor(17999.82) = 17999
    const r = calcInvoiceLine(1, 99999, 0, 0.18);
    expect(r.lineSubtotalMinor).toBe(99999);
    expect(r.lineDiscountMinor).toBe(0);
    expect(r.lineTaxMinor).toBe(17999);
    expect(r.lineTotalMinor).toBe(99999 + 17999);
  });

  it('10% discount applied before 18% GST', () => {
    // 2 units × 50000, 10% discount, 18% tax
    // sub = 100000, disc = 10000, after = 90000, tax = floor(90000 × 0.18) = 16200
    const r = calcInvoiceLine(2, 50000, 0.1, 0.18);
    expect(r.lineSubtotalMinor).toBe(100000);
    expect(r.lineDiscountMinor).toBe(10000);
    expect(r.lineTaxMinor).toBe(16200);
    expect(r.lineTotalMinor).toBe(90000 + 16200);
  });

  it('zero unit price produces zeros', () => {
    const r = calcInvoiceLine(5, 0, 0.1, 0.18);
    expect(r.lineSubtotalMinor).toBe(0);
    expect(r.lineDiscountMinor).toBe(0);
    expect(r.lineTaxMinor).toBe(0);
    expect(r.lineTotalMinor).toBe(0);
  });

  it('fractional quantity floors correctly', () => {
    // 1.5 × 33333 = 49999.5 → floor = 49999
    const r = calcInvoiceLine(1.5, 33333, 0, 0);
    expect(r.lineSubtotalMinor).toBe(49999);
  });
});

describe('calcInvoiceTotals', () => {
  it('aggregates multiple lines correctly', () => {
    const lines = [calcInvoiceLine(1, 100000, 0, 0.18), calcInvoiceLine(2, 50000, 0.1, 0.18)];
    const t = calcInvoiceTotals(lines);
    // line 1: sub=100000, disc=0, tax=18000, total=118000
    // line 2: sub=100000, disc=10000, tax=16200, total=106200
    expect(t.subtotalMinor).toBe(200000);
    expect(t.discountMinor).toBe(10000);
    expect(t.taxMinor).toBe(18000 + 16200);
    expect(t.totalMinor).toBe(118000 + 106200);
  });

  it('empty items list returns zeros', () => {
    const t = calcInvoiceTotals([]);
    expect(t.subtotalMinor).toBe(0);
    expect(t.discountMinor).toBe(0);
    expect(t.taxMinor).toBe(0);
    expect(t.totalMinor).toBe(0);
  });
});

describe('applyPayment', () => {
  const FUTURE_DATE = '2099-12-31';
  const PAST_DATE = '2000-01-01';

  it('partial payment returns partially_paid with correct balance (future due date)', () => {
    const r = applyPayment(0, 100000, 40000, FUTURE_DATE);
    expect(r.newAmountPaidMinor).toBe(40000);
    expect(r.newBalanceMinor).toBe(60000);
    expect(r.newStatus).toBe('partially_paid');
  });

  it('full payment returns paid with zero balance', () => {
    const r = applyPayment(0, 100000, 100000, FUTURE_DATE);
    expect(r.newAmountPaidMinor).toBe(100000);
    expect(r.newBalanceMinor).toBe(0);
    expect(r.newStatus).toBe('paid');
  });

  it('overpayment throws error', () => {
    expect(() => applyPayment(0, 100000, 100001, FUTURE_DATE)).toThrow(
      'Payment would exceed invoice total'
    );
  });

  it('zero payment throws error', () => {
    expect(() => applyPayment(0, 100000, 0, FUTURE_DATE)).toThrow(
      'Payment amount must be positive'
    );
  });

  it('negative payment throws error', () => {
    expect(() => applyPayment(0, 100000, -1, FUTURE_DATE)).toThrow(
      'Payment amount must be positive'
    );
  });

  it('partial payment on past-due invoice returns overdue', () => {
    const r = applyPayment(0, 100000, 40000, PAST_DATE);
    expect(r.newStatus).toBe('overdue');
  });
});

describe('reversePayment', () => {
  const FUTURE_DATE = '2099-12-31';
  const PAST_DATE = '2000-01-01';

  it('reversal of partial payment restores balance and partially_paid status', () => {
    const r = reversePayment(40000, 100000, 40000, FUTURE_DATE);
    expect(r.newAmountPaidMinor).toBe(0);
    expect(r.newBalanceMinor).toBe(100000);
    expect(r.newStatus).toBe('issued');
  });

  it('reversal of full payment on future-due invoice returns issued', () => {
    const r = reversePayment(100000, 100000, 100000, FUTURE_DATE);
    expect(r.newAmountPaidMinor).toBe(0);
    expect(r.newBalanceMinor).toBe(100000);
    expect(r.newStatus).toBe('issued');
  });

  it('reversal of full payment on past-due invoice returns overdue', () => {
    const r = reversePayment(100000, 100000, 100000, PAST_DATE);
    expect(r.newStatus).toBe('overdue');
  });

  it('reversal leaving nonzero paid returns partially_paid', () => {
    const r = reversePayment(80000, 100000, 30000, FUTURE_DATE);
    expect(r.newAmountPaidMinor).toBe(50000);
    expect(r.newBalanceMinor).toBe(50000);
    expect(r.newStatus).toBe('partially_paid');
  });

  it('reversal below zero throws error', () => {
    expect(() => reversePayment(10000, 100000, 20000, FUTURE_DATE)).toThrow(
      'Reversal would result in negative balance'
    );
  });

  it('sequential: apply partial + apply remainder = paid, then reverse last = partially_paid', () => {
    // Step 1: apply 40000
    const step1 = applyPayment(0, 100000, 40000, FUTURE_DATE);
    expect(step1.newStatus).toBe('partially_paid');
    // Step 2: apply remaining 60000
    const step2 = applyPayment(step1.newAmountPaidMinor, 100000, 60000, FUTURE_DATE);
    expect(step2.newStatus).toBe('paid');
    expect(step2.newBalanceMinor).toBe(0);
    // Step 3: reverse the last 60000 payment
    const step3 = reversePayment(step2.newAmountPaidMinor, 100000, 60000, FUTURE_DATE);
    expect(step3.newAmountPaidMinor).toBe(40000);
    expect(step3.newStatus).toBe('partially_paid');
  });
});

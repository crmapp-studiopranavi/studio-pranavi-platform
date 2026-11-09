import { describe, it, expect } from 'vitest';
import { calcLineItem, calcVersionTotals, inrToMinor, pctToRate } from '../quote-calculations';
import {
  calcInvoiceLine,
  calcInvoiceTotals,
  applyPayment,
  reversePayment,
} from '../invoice-calculations';
import { formatCurrency } from '../format';

// ─── Full business journey smoke test ─────────────────────────────────────────
// Simulates: Quote → Order → Invoice → Partial payment → Final payment → Reversal
// Uses pure calculation functions only (no Supabase calls).

const GLASS_PANEL_UNIT_PRICE_INR = 50_000;
const INSTALLATION_UNIT_PRICE_INR = 15_000;
const QTY = 2;
const DISCOUNT_RATE = pctToRate(10); // 10%
const TAX_RATE = pctToRate(18); // 18% GST
const FUTURE_DATE = '2099-12-31';
const PAST_DATE = '2020-01-01';

describe('Full business journey smoke test', () => {
  // ── Step 1: Quote line calculation ──────────────────────────────────────────

  it('step 1a: glass panel line item (floor arithmetic)', () => {
    const unitPrice = inrToMinor(GLASS_PANEL_UNIT_PRICE_INR); // 5_000_000 paise
    const line = calcLineItem(QTY, unitPrice, DISCOUNT_RATE, TAX_RATE);
    // lineSubtotal = floor(2 × 5_000_000) = 10_000_000
    expect(line.lineSubtotalMinor).toBe(10_000_000);
    // lineDiscount = floor(10_000_000 × 0.1) = 1_000_000
    expect(line.lineDiscountMinor).toBe(1_000_000);
    // after discount = 9_000_000; lineTax = floor(9_000_000 × 0.18) = 1_620_000
    expect(line.lineTaxMinor).toBe(1_620_000);
    // lineTotal = 9_000_000 + 1_620_000 = 10_620_000
    expect(line.lineTotalMinor).toBe(10_620_000);
  });

  it('step 1b: installation line item (no discount)', () => {
    const unitPrice = inrToMinor(INSTALLATION_UNIT_PRICE_INR); // 1_500_000 paise
    const line = calcLineItem(1, unitPrice, 0, TAX_RATE);
    // lineSubtotal = floor(1 × 1_500_000) = 1_500_000
    expect(line.lineSubtotalMinor).toBe(1_500_000);
    expect(line.lineDiscountMinor).toBe(0);
    // lineTax = floor(1_500_000 × 0.18) = 270_000
    expect(line.lineTaxMinor).toBe(270_000);
    expect(line.lineTotalMinor).toBe(1_770_000);
  });

  // ── Step 2: Quote version totals ────────────────────────────────────────────

  it('step 2: version totals aggregate correctly', () => {
    const glassUnit = inrToMinor(GLASS_PANEL_UNIT_PRICE_INR);
    const installUnit = inrToMinor(INSTALLATION_UNIT_PRICE_INR);
    const line1 = calcLineItem(QTY, glassUnit, DISCOUNT_RATE, TAX_RATE);
    const line2 = calcLineItem(1, installUnit, 0, TAX_RATE);
    const totals = calcVersionTotals([line1, line2]);
    expect(totals.subtotalMinor).toBe(10_000_000 + 1_500_000);
    expect(totals.discountMinor).toBe(1_000_000 + 0);
    expect(totals.taxMinor).toBe(1_620_000 + 270_000);
    expect(totals.totalMinor).toBe(10_620_000 + 1_770_000);
  });

  // ── Step 3: Currency formatting ──────────────────────────────────────────────

  it('step 3: formatCurrency uses en-IN locale', () => {
    const formatted = formatCurrency(10_620_000); // ₹1,06,200
    expect(formatted).toContain('1,06,200');
    expect(formatted).toMatch(/₹|INR/);
  });

  it('step 3b: formatCurrency handles null gracefully', () => {
    expect(formatCurrency(null)).toBe('—');
    expect(formatCurrency(undefined)).toBe('—');
  });

  // ── Step 4: Invoice line items match quote totals ────────────────────────────

  it('step 4: invoice line item matches quote line item', () => {
    const unitPrice = inrToMinor(GLASS_PANEL_UNIT_PRICE_INR);
    const quoteLine = calcLineItem(QTY, unitPrice, DISCOUNT_RATE, TAX_RATE);
    const invoiceLine = calcInvoiceLine(QTY, unitPrice, DISCOUNT_RATE, TAX_RATE);
    // Both use the same floor arithmetic — results must be identical
    expect(invoiceLine.lineTotalMinor).toBe(quoteLine.lineTotalMinor);
    expect(invoiceLine.lineSubtotalMinor).toBe(quoteLine.lineSubtotalMinor);
    expect(invoiceLine.lineDiscountMinor).toBe(quoteLine.lineDiscountMinor);
    expect(invoiceLine.lineTaxMinor).toBe(quoteLine.lineTaxMinor);
  });

  it('step 4b: invoice totals aggregate from items', () => {
    const unitPrice = inrToMinor(GLASS_PANEL_UNIT_PRICE_INR);
    const installPrice = inrToMinor(INSTALLATION_UNIT_PRICE_INR);
    const item1 = calcInvoiceLine(QTY, unitPrice, DISCOUNT_RATE, TAX_RATE);
    const item2 = calcInvoiceLine(1, installPrice, 0, TAX_RATE);
    const totals = calcInvoiceTotals([item1, item2]);
    expect(totals.subtotalMinor).toBe(11_500_000);
    expect(totals.discountMinor).toBe(1_000_000);
    expect(totals.taxMinor).toBe(1_890_000);
    expect(totals.totalMinor).toBe(12_390_000);
  });

  // ── Step 5: Payment recording ────────────────────────────────────────────────

  const invoiceTotal = 10_620_000;

  it('step 5a: partial payment returns partially_paid status', () => {
    const result = applyPayment(0, invoiceTotal, 5_000_000, FUTURE_DATE);
    expect(result.newAmountPaidMinor).toBe(5_000_000);
    expect(result.newBalanceMinor).toBe(5_620_000);
    expect(result.newStatus).toBe('partially_paid');
  });

  it('step 5b: second payment completes the invoice', () => {
    const result = applyPayment(5_000_000, invoiceTotal, 5_620_000, FUTURE_DATE);
    expect(result.newAmountPaidMinor).toBe(10_620_000);
    expect(result.newBalanceMinor).toBe(0);
    expect(result.newStatus).toBe('paid');
  });

  it('step 5c: single full payment marks invoice paid', () => {
    const result = applyPayment(0, invoiceTotal, invoiceTotal, FUTURE_DATE);
    expect(result.newStatus).toBe('paid');
    expect(result.newBalanceMinor).toBe(0);
  });

  it('step 5d: partial payment on past-due invoice stays overdue (not yet cleared)', () => {
    const result = applyPayment(0, invoiceTotal, 1_000_000, PAST_DATE);
    // Past due + unpaid balance → still overdue even after partial payment
    expect(result.newStatus).toBe('overdue');
    expect(result.newBalanceMinor).toBe(invoiceTotal - 1_000_000);
  });

  // ── Step 6: Overpayment prevention ──────────────────────────────────────────

  it('step 6a: overpayment by one paisa is rejected', () => {
    expect(() => applyPayment(0, invoiceTotal, invoiceTotal + 1, FUTURE_DATE)).toThrow(/exceed/i);
  });

  it('step 6b: overpayment when partially paid is rejected', () => {
    expect(() => applyPayment(5_000_000, invoiceTotal, 6_000_000, FUTURE_DATE)).toThrow(/exceed/i);
  });

  it('step 6c: zero payment is rejected', () => {
    expect(() => applyPayment(0, invoiceTotal, 0, FUTURE_DATE)).toThrow(/positive/i);
  });

  it('step 6d: negative payment is rejected', () => {
    expect(() => applyPayment(0, invoiceTotal, -100, FUTURE_DATE)).toThrow(/positive/i);
  });

  // ── Step 7: Payment reversal ──────────────────────────────────────────────────

  it('step 7a: reverse partial payment restores balance', () => {
    const result = reversePayment(5_000_000, invoiceTotal, 5_000_000, FUTURE_DATE);
    expect(result.newAmountPaidMinor).toBe(0);
    expect(result.newBalanceMinor).toBe(invoiceTotal);
    expect(result.newStatus).toBe('issued');
  });

  it('step 7b: reverse one of two payments leaves partially_paid', () => {
    // After paying 5M + 5.62M = 10.62M (paid), reverse the 5M
    const result = reversePayment(10_620_000, invoiceTotal, 5_000_000, FUTURE_DATE);
    expect(result.newAmountPaidMinor).toBe(5_620_000);
    expect(result.newBalanceMinor).toBe(5_000_000);
    expect(result.newStatus).toBe('partially_paid');
  });

  it('step 7c: reversal on overdue invoice returns overdue when fully unpaid', () => {
    // Past due date, payment reversed to zero → overdue
    const result = reversePayment(10_620_000, invoiceTotal, 10_620_000, PAST_DATE);
    expect(result.newAmountPaidMinor).toBe(0);
    expect(result.newStatus).toBe('overdue');
  });

  it('step 7d: reversal below zero is rejected', () => {
    expect(() => reversePayment(1_000_000, invoiceTotal, 2_000_000, FUTURE_DATE)).toThrow(
      /negative/i
    );
  });
});

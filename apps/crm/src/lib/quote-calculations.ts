// Pure calculation functions for quote line items and version totals.
// Uses floor() arithmetic on minor currency units — matches the PostgreSQL
// recalculate_version_totals() function exactly.

export interface LineCalcResult {
  lineSubtotalMinor: number;
  lineDiscountMinor: number;
  lineTaxMinor: number;
  lineTotalMinor: number;
}

export function calcLineItem(
  quantity: number,
  unitPriceMinor: number,
  discountRate: number,
  taxRate: number
): LineCalcResult {
  const lineSubtotalMinor = Math.floor(quantity * unitPriceMinor);
  const lineDiscountMinor = Math.floor(lineSubtotalMinor * discountRate);
  const afterDiscount = lineSubtotalMinor - lineDiscountMinor;
  const lineTaxMinor = Math.floor(afterDiscount * taxRate);
  const lineTotalMinor = afterDiscount + lineTaxMinor;
  return { lineSubtotalMinor, lineDiscountMinor, lineTaxMinor, lineTotalMinor };
}

export interface VersionTotals {
  subtotalMinor: number;
  discountMinor: number;
  taxMinor: number;
  totalMinor: number;
}

export function calcVersionTotals(items: LineCalcResult[]): VersionTotals {
  const subtotalMinor = items.reduce((s, i) => s + i.lineSubtotalMinor, 0);
  const discountMinor = items.reduce((s, i) => s + i.lineDiscountMinor, 0);
  const taxMinor = items.reduce((s, i) => s + i.lineTaxMinor, 0);
  const totalMinor = subtotalMinor - discountMinor + taxMinor;
  return { subtotalMinor, discountMinor, taxMinor, totalMinor };
}

// Convert a decimal INR amount to minor units (paise), flooring fractional paise.
export function inrToMinor(inr: number): number {
  return Math.floor(inr * 100);
}

// Convert a percentage (e.g. 18) to a decimal rate (0.18).
export function pctToRate(pct: number): number {
  return pct / 100;
}

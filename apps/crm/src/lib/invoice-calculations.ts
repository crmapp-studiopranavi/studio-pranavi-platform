export interface InvoiceLineCalcResult {
  lineSubtotalMinor: number;
  lineDiscountMinor: number;
  lineTaxMinor: number;
  lineTotalMinor: number;
}

export interface InvoiceTotals {
  subtotalMinor: number;
  discountMinor: number;
  taxMinor: number;
  totalMinor: number;
}

export interface PaymentApplicationResult {
  newAmountPaidMinor: number;
  newBalanceMinor: number;
  newStatus: 'issued' | 'partially_paid' | 'paid' | 'overdue';
}

export function calcInvoiceLine(
  quantity: number,
  unitPriceMinor: number,
  discountRate: number,
  taxRate: number
): InvoiceLineCalcResult {
  const lineSubtotalMinor = Math.floor(quantity * unitPriceMinor);
  const lineDiscountMinor = Math.floor(lineSubtotalMinor * discountRate);
  const afterDiscount = lineSubtotalMinor - lineDiscountMinor;
  const lineTaxMinor = Math.floor(afterDiscount * taxRate);
  const lineTotalMinor = afterDiscount + lineTaxMinor;
  return { lineSubtotalMinor, lineDiscountMinor, lineTaxMinor, lineTotalMinor };
}

export function calcInvoiceTotals(items: InvoiceLineCalcResult[]): InvoiceTotals {
  return items.reduce(
    (acc, item) => ({
      subtotalMinor: acc.subtotalMinor + item.lineSubtotalMinor,
      discountMinor: acc.discountMinor + item.lineDiscountMinor,
      taxMinor: acc.taxMinor + item.lineTaxMinor,
      totalMinor: acc.totalMinor + item.lineTotalMinor,
    }),
    { subtotalMinor: 0, discountMinor: 0, taxMinor: 0, totalMinor: 0 }
  );
}

function isDateInPast(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dateStr) < today;
}

export function applyPayment(
  currentPaidMinor: number,
  totalMinor: number,
  paymentMinor: number,
  dueDateStr: string
): PaymentApplicationResult {
  if (paymentMinor <= 0) throw new Error('Payment amount must be positive');
  const newAmountPaidMinor = currentPaidMinor + paymentMinor;
  if (newAmountPaidMinor > totalMinor) throw new Error('Payment would exceed invoice total');
  const newBalanceMinor = totalMinor - newAmountPaidMinor;
  let newStatus: PaymentApplicationResult['newStatus'];
  if (newBalanceMinor === 0) {
    newStatus = 'paid';
  } else if (isDateInPast(dueDateStr)) {
    newStatus = 'overdue';
  } else {
    newStatus = 'partially_paid';
  }
  return { newAmountPaidMinor, newBalanceMinor, newStatus };
}

export function reversePayment(
  currentPaidMinor: number,
  totalMinor: number,
  paymentMinor: number,
  dueDateStr: string
): PaymentApplicationResult {
  const newAmountPaidMinor = currentPaidMinor - paymentMinor;
  if (newAmountPaidMinor < 0) throw new Error('Reversal would result in negative balance');
  const newBalanceMinor = totalMinor - newAmountPaidMinor;
  let newStatus: PaymentApplicationResult['newStatus'];
  if (newAmountPaidMinor === 0) {
    newStatus = isDateInPast(dueDateStr) ? 'overdue' : 'issued';
  } else {
    newStatus = 'partially_paid';
  }
  return { newAmountPaidMinor, newBalanceMinor, newStatus };
}

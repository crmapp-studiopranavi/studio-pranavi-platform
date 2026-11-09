import { describe, it, expect } from 'vitest';

// ─── Order status transitions ──────────────────────────────────────────────────

const ORDER_NEXT_STATUS: Record<string, string> = {
  confirmed: 'design_or_measurement',
  design_or_measurement: 'production',
  production: 'ready_for_installation',
  ready_for_installation: 'installation_scheduled',
  installation_scheduled: 'installed',
  installed: 'completed',
};

const TERMINAL_ORDER_STATUSES = new Set(['completed', 'cancelled', 'on_hold']);

const ACTIVE_ORDER_STATUSES = [
  'confirmed',
  'design_or_measurement',
  'production',
  'ready_for_installation',
  'installation_scheduled',
  'installed',
];

describe('Order status transitions', () => {
  it('confirmed → design_or_measurement', () => {
    expect(ORDER_NEXT_STATUS.confirmed).toBe('design_or_measurement');
  });

  it('design_or_measurement → production', () => {
    expect(ORDER_NEXT_STATUS.design_or_measurement).toBe('production');
  });

  it('production → ready_for_installation', () => {
    expect(ORDER_NEXT_STATUS.production).toBe('ready_for_installation');
  });

  it('ready_for_installation → installation_scheduled', () => {
    expect(ORDER_NEXT_STATUS.ready_for_installation).toBe('installation_scheduled');
  });

  it('installation_scheduled → installed', () => {
    expect(ORDER_NEXT_STATUS.installation_scheduled).toBe('installed');
  });

  it('installed → completed', () => {
    expect(ORDER_NEXT_STATUS.installed).toBe('completed');
  });

  it('terminal statuses have no next step', () => {
    expect(ORDER_NEXT_STATUS.completed).toBeUndefined();
    expect(ORDER_NEXT_STATUS.cancelled).toBeUndefined();
    expect(ORDER_NEXT_STATUS.on_hold).toBeUndefined();
  });

  it('completed is terminal', () => {
    expect(TERMINAL_ORDER_STATUSES.has('completed')).toBe(true);
  });

  it('cancelled is terminal', () => {
    expect(TERMINAL_ORDER_STATUSES.has('cancelled')).toBe(true);
  });

  it('on_hold is terminal for advancement purposes', () => {
    expect(TERMINAL_ORDER_STATUSES.has('on_hold')).toBe(true);
  });

  it('confirmed is not terminal', () => {
    expect(TERMINAL_ORDER_STATUSES.has('confirmed')).toBe(false);
  });

  it('all active statuses have a next step', () => {
    for (const s of ACTIVE_ORDER_STATUSES) {
      expect(ORDER_NEXT_STATUS[s], `${s} should have a next status`).toBeDefined();
    }
  });
});

// ─── Invoice status logic ─────────────────────────────────────────────────────

type InvoiceStatus = 'draft' | 'issued' | 'partially_paid' | 'paid' | 'overdue' | 'void';

function computeInvoiceStatus(
  totalMinor: number,
  amountPaidMinor: number,
  dueDateStr: string,
  currentStatus: InvoiceStatus
): InvoiceStatus {
  if (currentStatus === 'void' || currentStatus === 'draft') return currentStatus;
  if (amountPaidMinor >= totalMinor) return 'paid';
  if (amountPaidMinor > 0) return 'partially_paid';
  const isOverdue = new Date(dueDateStr) < new Date(new Date().toDateString());
  return isOverdue ? 'overdue' : 'issued';
}

describe('Invoice status computation', () => {
  const futureDate = '2099-12-31';
  const pastDate = '2020-01-01';
  const total = 10_000_000;

  it('full payment → paid', () => {
    expect(computeInvoiceStatus(total, total, futureDate, 'issued')).toBe('paid');
  });

  it('partial payment → partially_paid', () => {
    expect(computeInvoiceStatus(total, 5_000_000, futureDate, 'issued')).toBe('partially_paid');
  });

  it('no payment, future due date → issued', () => {
    expect(computeInvoiceStatus(total, 0, futureDate, 'issued')).toBe('issued');
  });

  it('no payment, past due date → overdue', () => {
    expect(computeInvoiceStatus(total, 0, pastDate, 'issued')).toBe('overdue');
  });

  it('void status is preserved regardless of payment', () => {
    expect(computeInvoiceStatus(total, 0, futureDate, 'void')).toBe('void');
    expect(computeInvoiceStatus(total, total, futureDate, 'void')).toBe('void');
  });

  it('draft status is preserved', () => {
    expect(computeInvoiceStatus(total, 0, futureDate, 'draft')).toBe('draft');
  });
});

// ─── Project status values ────────────────────────────────────────────────────

const PROJECT_STATUSES = [
  'planned',
  'active',
  'blocked',
  'on_hold',
  'completed',
  'cancelled',
] as const;

describe('Project status values', () => {
  it('includes planned', () => expect(PROJECT_STATUSES).toContain('planned'));
  it('includes active', () => expect(PROJECT_STATUSES).toContain('active'));
  it('includes blocked', () => expect(PROJECT_STATUSES).toContain('blocked'));
  it('includes on_hold', () => expect(PROJECT_STATUSES).toContain('on_hold'));
  it('includes completed', () => expect(PROJECT_STATUSES).toContain('completed'));
  it('includes cancelled', () => expect(PROJECT_STATUSES).toContain('cancelled'));
  it('has exactly 6 values', () => expect(PROJECT_STATUSES.length).toBe(6));
});

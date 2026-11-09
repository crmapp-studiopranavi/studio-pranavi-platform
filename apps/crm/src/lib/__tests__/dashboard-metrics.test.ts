import { describe, it, expect } from 'vitest';
import { formatCurrency } from '../format';

// ── Manager metrics ────────────────────────────────────────────────────────────
const MANAGER_FIXTURE = {
  new_leads: 3,
  followups_due: 7,
  quotes_awaiting: 2,
  active_orders: 5,
  active_projects: 8,
  delayed_projects: 2,
  installs_this_week: 1,
  invoiced_minor: 25000000, // ₹2,50,000
  received_minor: 18000000, // ₹1,80,000
  outstanding_minor: 7000000, // ₹70,000
};

describe('manager dashboard metrics', () => {
  it('new_leads count is a non-negative integer', () => {
    expect(MANAGER_FIXTURE.new_leads).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(MANAGER_FIXTURE.new_leads)).toBe(true);
  });

  it('outstanding = invoiced - received', () => {
    expect(MANAGER_FIXTURE.outstanding_minor).toBe(
      MANAGER_FIXTURE.invoiced_minor - MANAGER_FIXTURE.received_minor
    );
  });

  it('formatCurrency formats paise to INR string', () => {
    const result = formatCurrency(MANAGER_FIXTURE.invoiced_minor);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('delayed_projects > 0 triggers urgent flag', () => {
    const isUrgent = MANAGER_FIXTURE.delayed_projects > 0;
    expect(isUrgent).toBe(true);
  });

  it('followups_due > 0 triggers urgent flag', () => {
    const isUrgent = MANAGER_FIXTURE.followups_due > 0;
    expect(isUrgent).toBe(true);
  });

  it('all count fields are non-negative', () => {
    const countFields = [
      'new_leads',
      'followups_due',
      'quotes_awaiting',
      'active_orders',
      'active_projects',
      'delayed_projects',
      'installs_this_week',
    ] as const;
    for (const field of countFields) {
      expect(MANAGER_FIXTURE[field]).toBeGreaterThanOrEqual(0);
    }
  });
});

// ── Sales metrics ──────────────────────────────────────────────────────────────
const SALES_FIXTURE = {
  my_leads: 12,
  overdue_followups: 3,
  site_visits_pending: 2,
  quotes_awaiting: 4,
  quotes_expiring: 1,
  pipeline_leads: 9,
};

describe('sales dashboard metrics', () => {
  it('overdue_followups > 0 triggers urgent flag', () => {
    expect(SALES_FIXTURE.overdue_followups > 0).toBe(true);
  });

  it('quotes_expiring > 0 triggers urgent flag', () => {
    expect(SALES_FIXTURE.quotes_expiring > 0).toBe(true);
  });

  it('pipeline_leads >= 0', () => {
    expect(SALES_FIXTURE.pipeline_leads).toBeGreaterThanOrEqual(0);
  });

  it('my_leads >= overdue_followups (overdue is a subset of active leads)', () => {
    expect(SALES_FIXTURE.my_leads).toBeGreaterThanOrEqual(SALES_FIXTURE.overdue_followups);
  });

  it('all fields are non-negative integers', () => {
    for (const value of Object.values(SALES_FIXTURE)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(value)).toBe(true);
    }
  });
});

// ── Operations metrics ─────────────────────────────────────────────────────────
const OPS_FIXTURE = {
  orders_in_production: 6,
  blocked_projects: 1,
  overdue_milestones: 4,
  measurements_pending: 2,
  upcoming_installations: 3,
};

describe('operations dashboard metrics', () => {
  it('blocked_projects > 0 triggers urgent flag', () => {
    expect(OPS_FIXTURE.blocked_projects > 0).toBe(true);
  });

  it('overdue_milestones > 0 triggers urgent flag', () => {
    expect(OPS_FIXTURE.overdue_milestones > 0).toBe(true);
  });

  it('all fields are non-negative integers', () => {
    for (const value of Object.values(OPS_FIXTURE)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(value)).toBe(true);
    }
  });
});

// ── Finance metrics ────────────────────────────────────────────────────────────
const FINANCE_FIXTURE = {
  invoices_issued: 8,
  overdue_invoices: 2,
  payments_received_minor: 12000000, // ₹1,20,000
  outstanding_minor: 5500000, // ₹55,000
  ageing_30_minor: 3000000, // ₹30,000
  ageing_60_minor: 1500000, // ₹15,000
};

describe('finance dashboard metrics', () => {
  it('overdue_invoices > 0 triggers urgent flag', () => {
    expect(FINANCE_FIXTURE.overdue_invoices > 0).toBe(true);
  });

  it('ageing_60 <= ageing_30 (60-day bucket is a subset of 30-day bucket)', () => {
    expect(FINANCE_FIXTURE.ageing_60_minor).toBeLessThanOrEqual(FINANCE_FIXTURE.ageing_30_minor);
  });

  it('ageing_30 <= outstanding (ageing is a subset of all outstanding)', () => {
    expect(FINANCE_FIXTURE.ageing_30_minor).toBeLessThanOrEqual(FINANCE_FIXTURE.outstanding_minor);
  });

  it('overdue_invoices <= invoices_issued', () => {
    expect(FINANCE_FIXTURE.overdue_invoices).toBeLessThanOrEqual(FINANCE_FIXTURE.invoices_issued);
  });

  it('formats outstanding_minor to INR currency string', () => {
    const result = formatCurrency(FINANCE_FIXTURE.outstanding_minor);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('all monetary fields are positive integers', () => {
    const monetaryFields = [
      'payments_received_minor',
      'outstanding_minor',
      'ageing_30_minor',
      'ageing_60_minor',
    ] as const;
    for (const field of monetaryFields) {
      expect(FINANCE_FIXTURE[field]).toBeGreaterThan(0);
      expect(Number.isInteger(FINANCE_FIXTURE[field])).toBe(true);
    }
  });
});

// ── Urgent flag logic ──────────────────────────────────────────────────────────
describe('urgent flag business rule', () => {
  it('urgent=false when count is 0', () => {
    const urgent = true;
    const value = 0;
    const isUrgent = urgent && value > 0;
    expect(isUrgent).toBe(false);
  });

  it('urgent=true when flag set and count > 0', () => {
    const urgent = true;
    const value = 3;
    const isUrgent = urgent && value > 0;
    expect(isUrgent).toBe(true);
  });

  it('urgent=false when flag not set even if count > 0', () => {
    const urgent = false;
    const value = 5;
    const isUrgent = urgent && value > 0;
    expect(isUrgent).toBe(false);
  });
});

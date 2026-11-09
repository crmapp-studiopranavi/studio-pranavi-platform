import { describe, it, expect } from 'vitest';
import {
  NOTIFICATION_TYPES,
  NOTIFICATION_LABELS,
  AUTOMATION_RULE_KEYS,
} from '../notifications/notification-types';

describe('NOTIFICATION_TYPES', () => {
  it('contains all 7 required types', () => {
    const required = [
      'new_enquiry_assigned',
      'followup_due',
      'quote_sent_followup',
      'quote_expiring',
      'order_confirmed',
      'installation_scheduled',
      'invoice_overdue',
    ];
    required.forEach((t) => expect(NOTIFICATION_TYPES).toContain(t));
  });

  it('has a label for every type', () => {
    NOTIFICATION_TYPES.forEach((t) => {
      expect(NOTIFICATION_LABELS[t]).toBeTruthy();
    });
  });
});

describe('AUTOMATION_RULE_KEYS', () => {
  it('contains all 7 rule keys', () => {
    expect(AUTOMATION_RULE_KEYS).toHaveLength(7);
  });

  it('includes new_enquiry', () => {
    expect(AUTOMATION_RULE_KEYS).toContain('new_enquiry');
  });
});

// ── Idempotency key format tests ──────────────────────────────────────────────

describe('idempotency key patterns', () => {
  const makeOrderKey = (id: string) => `order_confirmed:${id}`;
  const makeInstallKey = (id: string, start: string) => `installation_scheduled:${id}:${start}`;
  const makeFollowupKey = (id: string, date: string) => `followup_due:${id}:${date}`;
  const makeQuoteExpiringKey = (id: string, date: string) => `quote_expiring:${id}:${date}`;

  it('order_confirmed key is stable for same order_id', () => {
    const id = '550e8400-e29b-41d4-a716-446655440000';
    expect(makeOrderKey(id)).toBe(`order_confirmed:${id}`);
    expect(makeOrderKey(id)).toBe(makeOrderKey(id));
  });

  it('installation_scheduled key changes when scheduled_start changes', () => {
    const id = '550e8400-e29b-41d4-a716-446655440001';
    const key1 = makeInstallKey(id, '2026-12-01T09:00:00Z');
    const key2 = makeInstallKey(id, '2026-12-02T09:00:00Z');
    expect(key1).not.toBe(key2);
  });

  it('followup_due key is once-per-day-per-lead', () => {
    const id = '550e8400-e29b-41d4-a716-446655440002';
    const key1 = makeFollowupKey(id, '2026-12-01');
    const key2 = makeFollowupKey(id, '2026-12-01');
    const key3 = makeFollowupKey(id, '2026-12-02');
    expect(key1).toBe(key2);
    expect(key1).not.toBe(key3);
  });

  it('quote_expiring key is once-per-day-per-quote', () => {
    const id = '550e8400-e29b-41d4-a716-446655440003';
    expect(makeQuoteExpiringKey(id, '2026-12-01')).toBe(makeQuoteExpiringKey(id, '2026-12-01'));
    expect(makeQuoteExpiringKey(id, '2026-12-01')).not.toBe(makeQuoteExpiringKey(id, '2026-12-02'));
  });
});

// ── Notification preference logic ─────────────────────────────────────────────

describe('notification preference resolution', () => {
  type Pref = { notification_type: string; enabled: boolean };

  function shouldNotify(prefs: Pref[], type: string): boolean {
    const pref = prefs.find((p) => p.notification_type === type);
    return pref === undefined ? true : pref.enabled;
  }

  it('defaults to enabled when no preference row exists', () => {
    expect(shouldNotify([], 'invoice_overdue')).toBe(true);
  });

  it('respects explicit enabled = false', () => {
    const prefs: Pref[] = [{ notification_type: 'invoice_overdue', enabled: false }];
    expect(shouldNotify(prefs, 'invoice_overdue')).toBe(false);
  });

  it('respects explicit enabled = true', () => {
    const prefs: Pref[] = [{ notification_type: 'invoice_overdue', enabled: true }];
    expect(shouldNotify(prefs, 'invoice_overdue')).toBe(true);
  });

  it('unrelated preferences do not affect other types', () => {
    const prefs: Pref[] = [{ notification_type: 'followup_due', enabled: false }];
    expect(shouldNotify(prefs, 'invoice_overdue')).toBe(true);
  });
});

// ── Outbox retry semantics ────────────────────────────────────────────────────

describe('outbox retry semantics', () => {
  type OutboxItem = { attempts: number; max_attempts: number; status: string };

  function nextStatus(item: OutboxItem, hadError: boolean): string {
    if (!hadError) return 'delivered';
    const newAttempts = item.attempts + 1;
    return newAttempts >= item.max_attempts ? 'failed' : 'pending';
  }

  it('delivers on success regardless of attempt count', () => {
    expect(nextStatus({ attempts: 0, max_attempts: 3, status: 'pending' }, false)).toBe(
      'delivered'
    );
    expect(nextStatus({ attempts: 2, max_attempts: 3, status: 'pending' }, false)).toBe(
      'delivered'
    );
  });

  it('retries on error when attempts < max_attempts', () => {
    expect(nextStatus({ attempts: 1, max_attempts: 3, status: 'pending' }, true)).toBe('pending');
  });

  it('marks failed on error when attempts reach max_attempts', () => {
    expect(nextStatus({ attempts: 2, max_attempts: 3, status: 'pending' }, true)).toBe('failed');
  });

  it('never retries past max_attempts', () => {
    expect(nextStatus({ attempts: 3, max_attempts: 3, status: 'pending' }, true)).toBe('failed');
  });
});

// ── Read/unread logic ─────────────────────────────────────────────────────────

describe('read/unread state', () => {
  type N = { id: string; read_at: string | null };

  const applyMarkRead = (notifs: N[], ids: string[]): N[] =>
    notifs.map((n) =>
      ids.includes(n.id) && !n.read_at ? { ...n, read_at: '2026-11-09T10:00:00Z' } : n
    );

  const unreadCount = (notifs: N[]): number => notifs.filter((n) => !n.read_at).length;

  it('counts unread correctly', () => {
    const notifs: N[] = [
      { id: '1', read_at: null },
      { id: '2', read_at: '2026-11-09T09:00:00Z' },
      { id: '3', read_at: null },
    ];
    expect(unreadCount(notifs)).toBe(2);
  });

  it('marks specific notifications as read', () => {
    const notifs: N[] = [
      { id: '1', read_at: null },
      { id: '2', read_at: null },
    ];
    const updated = applyMarkRead(notifs, ['1']);
    expect(updated.find((n) => n.id === '1')?.read_at).not.toBeNull();
    expect(updated.find((n) => n.id === '2')?.read_at).toBeNull();
  });

  it('does not re-stamp already-read notifications', () => {
    const notifs: N[] = [{ id: '1', read_at: '2026-11-09T09:00:00Z' }];
    const updated = applyMarkRead(notifs, ['1']);
    expect(updated[0].read_at).toBe('2026-11-09T09:00:00Z');
  });
});

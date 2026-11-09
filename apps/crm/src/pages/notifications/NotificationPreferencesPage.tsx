import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { NOTIFICATION_TYPES, NOTIFICATION_LABELS } from '@/lib/notifications/notification-types';
import type { NotificationType } from '@/lib/notifications/notification-types';

type Prefs = Record<NotificationType, boolean>;

export function NotificationPreferencesPage() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<Prefs>(
    () => Object.fromEntries(NOTIFICATION_TYPES.map((t) => [t, true])) as Prefs
  );
  const [saving, setSaving] = useState<NotificationType | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('notification_preferences')
      .select('notification_type, enabled')
      .eq('profile_id', user.id)
      .then(({ data }) => {
        if (data) {
          setPrefs((prev) => {
            const next = { ...prev };
            data.forEach((row) => {
              if (NOTIFICATION_TYPES.includes(row.notification_type as NotificationType)) {
                next[row.notification_type as NotificationType] = row.enabled;
              }
            });
            return next;
          });
        }
      });
  }, [user]);

  async function toggle(type: NotificationType, enabled: boolean) {
    if (!user) return;
    setSaving(type);
    await supabase
      .from('notification_preferences')
      .upsert({ profile_id: user.id, notification_type: type, enabled });
    setPrefs((prev) => ({ ...prev, [type]: enabled }));
    setSaving(null);
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Notification Preferences</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Choose which in-app notifications you receive.
        </p>
      </div>

      <ul className="space-y-2">
        {NOTIFICATION_TYPES.map((type) => (
          <li
            key={type}
            className="flex items-center justify-between rounded-lg border bg-card p-4"
          >
            <span className="text-sm font-medium">{NOTIFICATION_LABELS[type]}</span>
            <button
              type="button"
              disabled={saving === type}
              onClick={() => toggle(type, !prefs[type])}
              aria-checked={prefs[type]}
              role="switch"
              className={`relative h-5 w-9 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 ${prefs[type] ? 'bg-primary' : 'bg-input'}`}
            >
              <span
                className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${prefs[type] ? 'translate-x-4' : 'translate-x-0'}`}
              />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

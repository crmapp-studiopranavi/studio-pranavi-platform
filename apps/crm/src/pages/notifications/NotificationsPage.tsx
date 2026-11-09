import { useNotifications } from '@/lib/hooks/useNotifications';
import { NOTIFICATION_LABELS } from '@/lib/notifications/notification-types';
import type { NotificationType } from '@/lib/notifications/notification-types';
import { Bell, CheckCheck } from 'lucide-react';

export function NotificationsPage() {
  const { notifications, unreadCount, isLoading, markRead, markAllRead } = useNotifications(100);

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Notifications</h1>
          {unreadCount > 0 && <p className="text-sm text-muted-foreground">{unreadCount} unread</p>}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead()}
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-accent transition-colors"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
          <Bell className="h-8 w-8" />
          <p className="text-sm">No notifications yet</p>
        </div>
      ) : (
        <ul className="space-y-1">
          {notifications.map((n) => (
            <li
              key={n.id}
              onClick={() => !n.read_at && markRead([n.id])}
              className={`flex cursor-pointer gap-3 rounded-lg border p-4 transition-colors hover:bg-accent/50 ${!n.read_at ? 'bg-primary/5 border-primary/20' : 'bg-card'}`}
            >
              {!n.read_at && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium leading-snug">{n.title}</p>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {new Date(n.created_at).toLocaleString('en-IN', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
                {n.body && <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>}
                <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                  {NOTIFICATION_LABELS[n.notification_type as NotificationType] ??
                    n.notification_type}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

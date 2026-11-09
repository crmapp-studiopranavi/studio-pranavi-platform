import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabase';
import type { Notification } from '../notifications/notification-types';
import { useAuth } from '../auth-context';

export function useNotifications(limit = 50) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (data) {
      setNotifications(data as Notification[]);
      setUnreadCount(data.filter((n) => !n.read_at).length);
    }
    setIsLoading(false);
  }, [user, limit]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!user) return;
    // Unique suffix prevents "already subscribed" error on React StrictMode double-invoke
    const channel = supabase
      .channel(`notifications:${user.id}:${crypto.randomUUID()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${user.id}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications]);

  const markRead = useCallback(async (ids: string[]) => {
    await supabase.rpc('mark_notifications_read', { p_ids: ids });
    setNotifications((prev) =>
      prev.map((n) =>
        ids.includes(n.id) && !n.read_at ? { ...n, read_at: new Date().toISOString() } : n
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - ids.length));
  }, []);

  const markAllRead = useCallback(async () => {
    const unread = notifications.filter((n) => !n.read_at).map((n) => n.id);
    if (unread.length > 0) await markRead(unread);
  }, [notifications, markRead]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markRead,
    markAllRead,
    refetch: fetchNotifications,
  };
}

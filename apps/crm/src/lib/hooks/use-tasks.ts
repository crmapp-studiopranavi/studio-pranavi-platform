import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useTasks({
  assignedToMe = false,
  userId,
}: {
  assignedToMe?: boolean;
  userId?: string;
}) {
  return useQuery({
    queryKey: ['tasks', { assignedToMe, userId }],
    queryFn: async () => {
      let q = supabase
        .from('tasks')
        .select(
          `*, assignee:profiles!assigned_to(id, full_name), lead:leads!lead_id(id, lead_number, full_name), customer:customers!customer_id(id, display_name)`
        )
        .not('status', 'in', '("done","cancelled")')
        .order('due_at')
        .limit(100);

      if (assignedToMe && userId) {
        q = q.eq('assigned_to', userId);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
    placeholderData: (prev) => prev,
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Enums } from '@platform/types';

export interface ActivityFilters {
  leadId?: string;
  customerId?: string;
  orderId?: string;
  projectId?: string;
}

export function useActivityTimeline(entity: ActivityFilters) {
  return useQuery({
    queryKey: ['activities', entity],
    queryFn: async () => {
      let q = supabase
        .from('activities')
        .select(
          `
          id, activity_type, subject, body, occurred_at,
          actor:profiles!actor_id(full_name)
        `
        )
        .order('occurred_at', { ascending: false })
        .limit(50);
      if (entity.leadId) q = q.eq('lead_id', entity.leadId);
      if (entity.customerId) q = q.eq('customer_id', entity.customerId);
      if (entity.orderId) q = q.eq('order_id', entity.orderId);
      if (entity.projectId) q = q.eq('project_id', entity.projectId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
    enabled: Object.values(entity).some(Boolean),
  });
}

export function useAddActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: {
      activity_type: Enums<'activity_type'>;
      subject?: string | null;
      body?: string | null;
      lead_id?: string | null;
      customer_id?: string | null;
      order_id?: string | null;
      project_id?: string | null;
    }) => {
      const { data, error } = await supabase.from('activities').insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['activities'] }),
  });
}

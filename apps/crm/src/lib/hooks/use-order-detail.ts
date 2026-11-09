import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { TablesUpdate } from '@platform/types';

export function useOrderDetail(id: string) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(
          `*,
          customer:customers!customer_id(id, display_name),
          quote:quotes!quote_id(id, quote_number, status),
          owner:profiles!owner_id(id, full_name)`
        )
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useProjectByOrderId(orderId: string) {
  return useQuery({
    queryKey: ['project-by-order', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, project_number, name, status')
        .eq('order_id', orderId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!orderId,
  });
}

export function useOrderActivities(orderId: string) {
  return useQuery({
    queryKey: ['order-activities', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activities')
        .select(`*, actor:profiles!actor_id(id, full_name)`)
        .eq('order_id', orderId)
        .order('occurred_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!orderId,
  });
}

export function useUpdateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      update,
    }: {
      orderId: string;
      update: TablesUpdate<'orders'>;
    }) => {
      const { error } = await supabase.from('orders').update(update).eq('id', orderId);
      if (error) throw error;
    },
    onSuccess: (_d, { orderId }) => {
      void qc.invalidateQueries({ queryKey: ['order', orderId] });
      void qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

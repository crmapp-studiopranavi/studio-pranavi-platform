/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { TablesUpdate } from '@platform/types';

const PAGE_SIZE = 20;

export interface OrderFilters {
  status?: string;
  page?: number;
}

export function useOrders(filters: OrderFilters = {}) {
  const { status, page = 0 } = filters;
  return useQuery({
    queryKey: ['orders', filters],
    queryFn: async () => {
      let q = supabase
        .from('orders')
        .select(
          `id, order_number, status, order_date, target_completion_date, total_minor, currency,
           customer:customers!customer_id(id, display_name),
           quote:quotes!quote_id(id, quote_number)`,
          { count: 'exact' }
        )
        .is('archived_at', null)
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (status) q = q.eq('status', status as any);

      const { data, error, count } = await q;
      if (error) throw error;
      return { orders: data ?? [], total: count ?? 0, page, pageSize: PAGE_SIZE };
    },
    placeholderData: (prev) => prev,
  });
}

export function useCreateOrderFromQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (quoteId: string) => {
      const { data, error } = await supabase.rpc('create_order_from_quote', {
        p_quote_id: quoteId,
      });
      if (error) throw error;
      return data as { order_id: string };
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['orders'] });
      void qc.invalidateQueries({ queryKey: ['quotes'] });
    },
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const update: TablesUpdate<'orders'> = { status: status as any };
      const { error } = await supabase.from('orders').update(update).eq('id', orderId);
      if (error) throw error;
      await supabase.from('activities').insert({
        activity_type: 'status_change',
        subject: `Order status changed to ${status.replace(/_/g, ' ')}`,
        order_id: orderId,
        occurred_at: new Date().toISOString(),
      });
    },
    onSuccess: (_d, { orderId }) => {
      void qc.invalidateQueries({ queryKey: ['order', orderId] });
      void qc.invalidateQueries({ queryKey: ['orders'] });
      void qc.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
  });
}

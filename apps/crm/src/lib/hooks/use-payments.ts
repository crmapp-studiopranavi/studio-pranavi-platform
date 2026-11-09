import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface PaymentFilters {
  customerId?: string;
  month?: string; // YYYY-MM format
}

export function usePayments(filters: PaymentFilters = {}) {
  return useQuery({
    queryKey: ['payments', filters],
    queryFn: async () => {
      let q = supabase
        .from('payments')
        .select(
          `
          id, payment_number, payment_date, amount_minor, currency,
          method, status, reference, notes,
          invoice:invoices!invoice_id(id, invoice_number),
          customer:customers!customer_id(id, display_name)
        `
        )
        .order('payment_date', { ascending: false })
        .limit(200);
      if (filters.customerId) q = q.eq('customer_id', filters.customerId);
      if (filters.month) {
        const start = `${filters.month}-01`;
        const d = new Date(start);
        d.setMonth(d.getMonth() + 1);
        const end = d.toISOString().split('T')[0];
        q = q.gte('payment_date', start).lt('payment_date', end);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

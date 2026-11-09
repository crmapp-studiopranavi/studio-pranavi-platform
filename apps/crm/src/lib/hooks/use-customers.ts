import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

const PAGE_SIZE = 20;

export interface CustomerFilters {
  search?: string;
  page?: number;
}

export function useCustomers(filters: CustomerFilters = {}) {
  const { search, page = 0 } = filters;
  return useQuery({
    queryKey: ['customers', filters],
    queryFn: async () => {
      let q = supabase
        .from('customers')
        .select(
          `id, customer_number, display_name, customer_type, owner_id, source_lead_id,
           created_at, archived_at,
           primary_contact:customer_contacts!primary_contact_id(id, full_name, email, phone),
           owner:profiles!owner_id(id, full_name)`,
          { count: 'exact' }
        )
        .is('archived_at', null)
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (search) {
        q = q.ilike('display_name', `%${search}%`);
      }

      const { data, error, count } = await q;
      if (error) throw error;
      return { customers: data ?? [], total: count ?? 0, page, pageSize: PAGE_SIZE };
    },
    placeholderData: (prev) => prev,
  });
}

export function useCustomerCount() {
  return useQuery({
    queryKey: ['customers', 'count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('customers')
        .select('id', { count: 'exact', head: true })
        .is('archived_at', null);
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function useConvertLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (leadId: string) => {
      const { data, error } = await supabase.rpc('convert_lead_to_customer', {
        p_lead_id: leadId,
      });
      if (error) throw error;
      return data as { customer_id: string };
    },
    onSuccess: (_data, leadId) => {
      void qc.invalidateQueries({ queryKey: ['lead', leadId] });
      void qc.invalidateQueries({ queryKey: ['leads'] });
      void qc.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

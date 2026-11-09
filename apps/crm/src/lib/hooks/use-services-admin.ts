import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { TablesInsert, TablesUpdate } from '@platform/types';

export function useServicesAdmin() {
  return useQuery({
    queryKey: ['services-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('id, slug, title, category, status, sort_order, short_description, created_at')
        .order('sort_order');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (insert: TablesInsert<'services'>) => {
      const { error } = await supabase.from('services').insert(insert);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['services-admin'] });
    },
  });
}

export function useUpdateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, update }: { id: string; update: TablesUpdate<'services'> }) => {
      const { error } = await supabase.from('services').update(update).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['services-admin'] });
    },
  });
}

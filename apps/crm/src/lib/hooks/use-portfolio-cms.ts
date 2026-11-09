import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { TablesInsert, TablesUpdate } from '@platform/types';

export function usePortfolioProjectsAdmin() {
  return useQuery({
    queryKey: ['portfolio-cms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('portfolio_projects')
        .select(
          'id, title, slug, category, status, sort_order, cover_image_path, completed_on, location_label, created_at, is_featured'
        )
        .order('sort_order');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function usePortfolioProjectAdmin(id: string | undefined) {
  return useQuery({
    queryKey: ['portfolio-cms', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('portfolio_projects')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreatePortfolioProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (insert: TablesInsert<'portfolio_projects'>) => {
      const { data, error } = await supabase
        .from('portfolio_projects')
        .insert(insert)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['portfolio-cms'] });
      void qc.invalidateQueries({ queryKey: ['portfolio'] });
    },
  });
}

export function useUpdatePortfolioProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      update,
    }: {
      id: string;
      update: TablesUpdate<'portfolio_projects'>;
    }) => {
      const { error } = await supabase.from('portfolio_projects').update(update).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['portfolio-cms'] });
      void qc.invalidateQueries({ queryKey: ['portfolio'] });
    },
  });
}

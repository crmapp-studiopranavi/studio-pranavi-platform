/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { NavigationItem, NavGroup } from '@/lib/types/cms';

export function useNavigationCms(group?: NavGroup) {
  return useQuery({
    queryKey: ['cms-navigation', group],
    queryFn: async () => {
      let q = (supabase as any).from('website_navigation').select('*').order('sort_order');
      if (group) q = q.eq('nav_group', group);
      const { data, error } = await q;
      if (error) throw error;
      return data as NavigationItem[];
    },
  });
}

export function useCreateNavItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: Omit<NavigationItem, 'id' | 'created_at'>) => {
      const { data, error } = await (supabase as any)
        .from('website_navigation')
        .insert(values)
        .select()
        .single();
      if (error) throw error;
      return data as NavigationItem;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cms-navigation'] }),
  });
}

export function useUpdateNavItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: Partial<NavigationItem> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from('website_navigation')
        .update(values)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as NavigationItem;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cms-navigation'] }),
  });
}

export function useDeleteNavItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('website_navigation').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cms-navigation'] }),
  });
}

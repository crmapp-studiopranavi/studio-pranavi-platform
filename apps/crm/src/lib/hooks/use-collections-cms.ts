/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { WebsiteCollection } from '@/lib/types/cms';

export function useCollectionsCms() {
  return useQuery({
    queryKey: ['cms-collections'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('website_collections')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as WebsiteCollection[];
    },
  });
}

export function useCollectionCms(id: string | null | undefined) {
  return useQuery({
    queryKey: ['cms-collection', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await (supabase as any)
        .from('website_collections')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as WebsiteCollection;
    },
    enabled: !!id,
  });
}

export function useCreateCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: Omit<WebsiteCollection, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await (supabase as any)
        .from('website_collections')
        .insert(values)
        .select()
        .single();
      if (error) throw error;
      return data as WebsiteCollection;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cms-collections'] }),
  });
}

export function useUpdateCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: Partial<WebsiteCollection> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from('website_collections')
        .update(values)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as WebsiteCollection;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['cms-collections'] });
      qc.invalidateQueries({ queryKey: ['cms-collection', data.id] });
    },
  });
}

export function useDeleteCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('website_collections').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cms-collections'] }),
  });
}

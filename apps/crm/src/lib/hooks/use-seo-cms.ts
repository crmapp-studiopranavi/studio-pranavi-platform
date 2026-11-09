/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { WebsiteSeo } from '@/lib/types/cms';

export function useSeoSettings() {
  return useQuery({
    queryKey: ['cms-seo'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('website_seo')
        .select('*')
        .order('page_path');
      if (error) throw error;
      return data as WebsiteSeo[];
    },
  });
}

export function useSeoForPath(pagePath: string | null | undefined) {
  return useQuery({
    queryKey: ['cms-seo-path', pagePath],
    queryFn: async () => {
      if (!pagePath) return null;
      const { data, error } = await (supabase as any)
        .from('website_seo')
        .select('*')
        .eq('page_path', pagePath)
        .maybeSingle();
      if (error) throw error;
      return data as WebsiteSeo | null;
    },
    enabled: !!pagePath,
  });
}

export function useUpsertSeo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: Omit<WebsiteSeo, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await (supabase as any)
        .from('website_seo')
        .upsert(values, { onConflict: 'page_path' })
        .select()
        .single();
      if (error) throw error;
      return data as WebsiteSeo;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['cms-seo'] });
      qc.invalidateQueries({ queryKey: ['cms-seo-path', data.page_path] });
    },
  });
}

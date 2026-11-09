import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabase';

export function useServices() {
  return useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('id, title, slug, short_description, hero_image_path, sort_order')
        .eq('status', 'published')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useServiceBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ['services', slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();
      if (error) throw error;
      return data;
    },
    enabled: Boolean(slug),
  });
}

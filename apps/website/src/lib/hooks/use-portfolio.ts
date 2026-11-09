import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabase';

export function usePortfolioProjects(category?: string) {
  return useQuery({
    queryKey: ['portfolio', category ?? 'all'],
    queryFn: async () => {
      let q = supabase
        .from('portfolio_projects')
        .select('id, title, slug, category, summary, cover_image_path, completed_on, sort_order')
        .eq('status', 'published')
        .order('sort_order', { ascending: true });
      if (category) {
        q = q.eq('category', category);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useProjectBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ['portfolio', 'detail', slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from('portfolio_projects')
        .select('*, portfolio_images(id, storage_path, alt_text, caption, sort_order)')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();
      if (error) throw error;
      return data;
    },
    enabled: Boolean(slug),
  });
}

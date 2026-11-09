/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { WebsitePage, PageSection } from '@/lib/types/cms';

export function useWebsitePages() {
  return useQuery({
    queryKey: ['website-pages'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('website_pages')
        .select('*')
        .order('slug');
      if (error) throw error;
      return data as WebsitePage[];
    },
  });
}

export function useWebsitePage(id: string | null | undefined) {
  return useQuery({
    queryKey: ['website-page', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await (supabase as any)
        .from('website_pages')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as WebsitePage;
    },
    enabled: !!id,
  });
}

export function useCreateWebsitePage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      values: Pick<WebsitePage, 'slug' | 'title' | 'meta_title' | 'meta_description'>
    ) => {
      const { data, error } = await (supabase as any)
        .from('website_pages')
        .insert(values)
        .select()
        .single();
      if (error) throw error;
      return data as WebsitePage;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['website-pages'] }),
  });
}

export function useUpdateWebsitePage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: Partial<WebsitePage> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from('website_pages')
        .update(values)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as WebsitePage;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['website-pages'] });
      qc.invalidateQueries({ queryKey: ['website-page', data.id] });
    },
  });
}

// ── Page sections ──────────────────────────────────────────────────────────

export function usePageSections(pageId: string | null | undefined) {
  return useQuery({
    queryKey: ['page-sections', pageId],
    queryFn: async () => {
      if (!pageId) return [];
      const { data, error } = await (supabase as any)
        .from('page_sections')
        .select('*')
        .eq('page_id', pageId)
        .order('sort_order');
      if (error) throw error;
      return data as PageSection[];
    },
    enabled: !!pageId,
  });
}

export function usePageSection(id: string | null | undefined) {
  return useQuery({
    queryKey: ['page-section', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await (supabase as any)
        .from('page_sections')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as PageSection;
    },
    enabled: !!id,
  });
}

export function useCreatePageSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      values: Pick<PageSection, 'page_id' | 'section_type' | 'title' | 'subtitle' | 'description'> &
        Partial<PageSection>
    ) => {
      const { data, error } = await (supabase as any)
        .from('page_sections')
        .insert(values)
        .select()
        .single();
      if (error) throw error;
      return data as PageSection;
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ['page-sections', data.page_id] }),
  });
}

export function useUpdatePageSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: Partial<PageSection> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from('page_sections')
        .update(values)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as PageSection;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['page-sections', data.page_id] });
      qc.invalidateQueries({ queryKey: ['page-section', data.id] });
    },
  });
}

export function useDeletePageSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, pageId }: { id: string; pageId: string }) => {
      const { error } = await (supabase as any).from('page_sections').delete().eq('id', id);
      if (error) throw error;
      return pageId;
    },
    onSuccess: (pageId) => qc.invalidateQueries({ queryKey: ['page-sections', pageId] }),
  });
}

export function usePublishSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, pageId }: { id: string; pageId: string }) => {
      const { error } = await (supabase as any).rpc('publish_page_section', { p_section_id: id });
      if (error) throw error;
      return pageId;
    },
    onSuccess: (pageId) => {
      qc.invalidateQueries({ queryKey: ['page-sections', pageId] });
    },
  });
}

export function useReorderSections() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ pageId, orderedIds }: { pageId: string; orderedIds: string[] }) => {
      const { error } = await (supabase as any).rpc('reorder_page_sections', {
        p_page_id: pageId,
        p_ordered_ids: orderedIds,
      });
      if (error) throw error;
      return pageId;
    },
    onSuccess: (pageId) => qc.invalidateQueries({ queryKey: ['page-sections', pageId] }),
  });
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { CatalogueCategory, CatalogueItem } from '@/lib/types/cms';

// ── Categories ─────────────────────────────────────────────────────────────

export function useCatalogueCategories() {
  return useQuery({
    queryKey: ['catalogue-categories'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('catalogue_categories')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as CatalogueCategory[];
    },
  });
}

export function useCreateCatalogueCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: Omit<CatalogueCategory, 'id' | 'created_at'>) => {
      const { data, error } = await (supabase as any)
        .from('catalogue_categories')
        .insert(values)
        .select()
        .single();
      if (error) throw error;
      return data as CatalogueCategory;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalogue-categories'] }),
  });
}

export function useUpdateCatalogueCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: Partial<CatalogueCategory> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from('catalogue_categories')
        .update(values)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as CatalogueCategory;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalogue-categories'] }),
  });
}

export function useDeleteCatalogueCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('catalogue_categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalogue-categories'] }),
  });
}

// ── Items ──────────────────────────────────────────────────────────────────

export function useCatalogueItems(categoryId?: string) {
  return useQuery({
    queryKey: ['catalogue-items', categoryId],
    queryFn: async () => {
      let q = (supabase as any).from('catalogue_items').select('*').order('sort_order');
      if (categoryId) q = q.eq('category_id', categoryId);
      const { data, error } = await q;
      if (error) throw error;
      return data as CatalogueItem[];
    },
  });
}

export function useCatalogueItem(id: string | null | undefined) {
  return useQuery({
    queryKey: ['catalogue-item', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await (supabase as any)
        .from('catalogue_items')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as CatalogueItem;
    },
    enabled: !!id,
  });
}

export function useCreateCatalogueItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: Omit<CatalogueItem, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await (supabase as any)
        .from('catalogue_items')
        .insert(values)
        .select()
        .single();
      if (error) throw error;
      return data as CatalogueItem;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['catalogue-items', data.category_id] });
      qc.invalidateQueries({ queryKey: ['catalogue-items'] });
    },
  });
}

export function useUpdateCatalogueItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: Partial<CatalogueItem> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from('catalogue_items')
        .update(values)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as CatalogueItem;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['catalogue-items', data.category_id] });
      qc.invalidateQueries({ queryKey: ['catalogue-item', data.id] });
    },
  });
}

export function useDeleteCatalogueItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('catalogue_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['catalogue-items'] });
    },
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { TablesInsert, TablesUpdate } from '@platform/types';

export function useQuoteDetail(id: string) {
  return useQuery({
    queryKey: ['quote', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotes')
        .select(
          `*, customer:customers!customer_id(id, display_name, gstin),
           current_version:quote_versions!current_version_id(*),
           owner:profiles!owner_id(id, full_name),
           source_lead:leads!lead_id(id, lead_number, full_name)`
        )
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useQuoteVersions(quoteId: string) {
  return useQuery({
    queryKey: ['quote-versions', quoteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quote_versions')
        .select('*')
        .eq('quote_id', quoteId)
        .order('version_number', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!quoteId,
  });
}

export function useQuoteItems(versionId: string | null | undefined) {
  return useQuery({
    queryKey: ['quote-items', versionId],
    queryFn: async () => {
      if (!versionId) return [];
      const { data, error } = await supabase
        .from('quote_items')
        .select('*')
        .eq('quote_version_id', versionId)
        .order('sort_order')
        .order('line_number');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!versionId,
  });
}

export function useQuoteActivities(quoteId: string) {
  return useQuery({
    queryKey: ['quote-activities', quoteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activities')
        .select(`*, actor:profiles!actor_id(id, full_name)`)
        .eq('quote_id', quoteId)
        .order('occurred_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!quoteId,
  });
}

export function useRecalculateVersionTotals() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ versionId, quoteId }: { versionId: string; quoteId: string }) => {
      const { data, error } = await supabase.rpc('recalculate_version_totals', {
        p_version_id: versionId,
      });
      if (error) throw error;
      return {
        totals: data as {
          subtotal_minor: number;
          discount_minor: number;
          tax_minor: number;
          total_minor: number;
        },
        quoteId,
        versionId,
      };
    },
    onSuccess: (_d, { versionId, quoteId }) => {
      void qc.invalidateQueries({ queryKey: ['quote-items', versionId] });
      void qc.invalidateQueries({ queryKey: ['quote', quoteId] });
      void qc.invalidateQueries({ queryKey: ['quote-versions', quoteId] });
    },
  });
}

export function useAddQuoteItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      versionId: string;
      quoteId: string;
      lineNumber: number;
      itemType: string;
      title: string;
      description?: string | null;
      quantity: number;
      unit: string;
      unitPriceMinor: number;
      discountRate: number;
      taxRate: number;
      sortOrder?: number;
      lineSubtotalMinor: number;
      lineDiscountMinor: number;
      lineTaxMinor: number;
      lineTotalMinor: number;
    }) => {
      const insert: TablesInsert<'quote_items'> = {
        quote_version_id: payload.versionId,
        line_number: payload.lineNumber,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        item_type: payload.itemType as any,
        title: payload.title,
        description: payload.description ?? null,
        quantity: payload.quantity,
        unit: payload.unit,
        unit_price_minor: payload.unitPriceMinor,
        discount_rate: payload.discountRate,
        tax_rate: payload.taxRate,
        sort_order: payload.sortOrder ?? payload.lineNumber,
        line_subtotal_minor: payload.lineSubtotalMinor,
        line_discount_minor: payload.lineDiscountMinor,
        line_tax_minor: payload.lineTaxMinor,
        line_total_minor: payload.lineTotalMinor,
      };
      const { error } = await supabase.from('quote_items').insert(insert);
      if (error) throw error;
      return { versionId: payload.versionId, quoteId: payload.quoteId };
    },
    onSuccess: (_d, p) => {
      void qc.invalidateQueries({ queryKey: ['quote-items', p.versionId] });
    },
  });
}

export function useUpdateQuoteItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      itemId: string;
      versionId: string;
      quoteId: string;
      update: TablesUpdate<'quote_items'>;
    }) => {
      const { error } = await supabase
        .from('quote_items')
        .update(payload.update)
        .eq('id', payload.itemId);
      if (error) throw error;
      return { versionId: payload.versionId, quoteId: payload.quoteId };
    },
    onSuccess: (_d, p) => {
      void qc.invalidateQueries({ queryKey: ['quote-items', p.versionId] });
    },
  });
}

export function useDeleteQuoteItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      itemId,
      versionId,
      quoteId,
    }: {
      itemId: string;
      versionId: string;
      quoteId: string;
    }) => {
      const { error } = await supabase.from('quote_items').delete().eq('id', itemId);
      if (error) throw error;
      return { versionId, quoteId };
    },
    onSuccess: (_d, p) => {
      void qc.invalidateQueries({ queryKey: ['quote-items', p.versionId] });
    },
  });
}

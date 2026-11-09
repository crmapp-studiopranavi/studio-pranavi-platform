import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

const PAGE_SIZE = 20;

export interface QuoteFilters {
  search?: string;
  status?: string;
  page?: number;
}

export function useQuotes(filters: QuoteFilters = {}) {
  const { search, status, page = 0 } = filters;
  return useQuery({
    queryKey: ['quotes', filters],
    queryFn: async () => {
      let q = supabase
        .from('quotes')
        .select(
          `id, quote_number, status, created_at, owner_id,
           customer:customers!customer_id(id, display_name),
           current_version:quote_versions!current_version_id(id, version_number, total_minor, issue_date, valid_until, sent_at)`,
          { count: 'exact' }
        )
        .is('archived_at', null)
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (search) q = q.ilike('quote_number', `%${search}%`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (status) q = q.eq('status', status as any);

      const { data, error, count } = await q;
      if (error) throw error;
      return { quotes: data ?? [], total: count ?? 0, page, pageSize: PAGE_SIZE };
    },
    placeholderData: (prev) => prev,
  });
}

export function useActiveQuoteCount() {
  return useQuery({
    queryKey: ['quotes', 'active-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('quotes')
        .select('id', { count: 'exact', head: true })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .in('status', ['draft', 'internal_review', 'sent', 'viewed'] as any[]);
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function useCreateQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      customerId: string;
      leadId?: string | null;
      issueDate: string;
      validUntil: string;
      currency?: string;
      ownerId?: string | null;
      terms?: string | null;
      customerNotes?: string | null;
      internalNotes?: string | null;
    }) => {
      const { data, error } = await supabase.rpc('create_quote', {
        p_customer_id: args.customerId,
        p_lead_id: args.leadId ?? null,
        p_issue_date: args.issueDate,
        p_valid_until: args.validUntil,
        p_currency: args.currency ?? 'INR',
        p_owner_id: args.ownerId ?? null,
        p_terms: args.terms ?? null,
        p_customer_notes: args.customerNotes ?? null,
        p_internal_notes: args.internalNotes ?? null,
      });
      if (error) throw error;
      return data as { quote_id: string; version_id: string };
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['quotes'] });
    },
  });
}

export function useSendQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (quoteId: string) => {
      const { data, error } = await supabase.rpc('send_quote', { p_quote_id: quoteId });
      if (error) throw error;
      return data as { quote_id: string };
    },
    onSuccess: (_d, quoteId) => {
      void qc.invalidateQueries({ queryKey: ['quote', quoteId] });
      void qc.invalidateQueries({ queryKey: ['quotes'] });
    },
  });
}

export function useAcceptQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ quoteId, notes }: { quoteId: string; notes?: string | null }) => {
      const { data, error } = await supabase.rpc('accept_quote', {
        p_quote_id: quoteId,
        p_notes: notes ?? null,
      });
      if (error) throw error;
      return data as { quote_id: string };
    },
    onSuccess: (_d, { quoteId }) => {
      void qc.invalidateQueries({ queryKey: ['quote', quoteId] });
      void qc.invalidateQueries({ queryKey: ['quotes'] });
    },
  });
}

export function useRejectQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ quoteId, reason }: { quoteId: string; reason?: string | null }) => {
      const { data, error } = await supabase.rpc('reject_quote', {
        p_quote_id: quoteId,
        p_reason: reason ?? null,
      });
      if (error) throw error;
      return data as { quote_id: string };
    },
    onSuccess: (_d, { quoteId }) => {
      void qc.invalidateQueries({ queryKey: ['quote', quoteId] });
      void qc.invalidateQueries({ queryKey: ['quotes'] });
    },
  });
}

export function useReviseQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (quoteId: string) => {
      const { data, error } = await supabase.rpc('revise_quote', { p_quote_id: quoteId });
      if (error) throw error;
      return data as { quote_id: string; version_id: string };
    },
    onSuccess: (_d, quoteId) => {
      void qc.invalidateQueries({ queryKey: ['quote', quoteId] });
      void qc.invalidateQueries({ queryKey: ['quotes'] });
    },
  });
}

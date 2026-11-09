/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

const PAGE_SIZE = 20;

export interface InvoiceFilters {
  status?: string;
  customerId?: string;
  page?: number;
}

export function useInvoices(filters: InvoiceFilters = {}) {
  const { status, customerId, page = 0 } = filters;
  return useQuery({
    queryKey: ['invoices', filters],
    queryFn: async () => {
      let q = supabase
        .from('invoices')
        .select(
          `id, invoice_number, status, issue_date, due_date,
           total_minor, amount_paid_minor, balance_minor, currency,
           customer:customers!customer_id(id, display_name),
           order:orders!order_id(id, order_number)`,
          { count: 'exact' }
        )
        .is('archived_at', null)
        .order('issue_date', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (status) q = q.eq('status', status as any);
      if (customerId) q = q.eq('customer_id', customerId);

      const { data, error, count } = await q;
      if (error) throw error;
      return { invoices: data ?? [], total: count ?? 0, page, pageSize: PAGE_SIZE };
    },
    placeholderData: (prev) => prev,
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      customerId: string;
      orderId?: string;
      projectId?: string;
      issueDate: string;
      dueDate: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase.rpc('create_invoice', {
        p_customer_id: args.customerId,
        p_order_id: args.orderId ?? null,
        p_project_id: args.projectId ?? null,
        p_issue_date: args.issueDate,
        p_due_date: args.dueDate,
        p_notes: args.notes ?? null,
      });
      if (error) throw error;
      return data as { invoice_id: string; invoice_number: string };
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useIssueInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const { error } = await supabase.rpc('issue_invoice', { p_invoice_id: invoiceId });
      if (error) throw error;
    },
    onSuccess: (_d, invoiceId) => {
      void qc.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      void qc.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useVoidInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const { error } = await supabase.rpc('void_invoice', { p_invoice_id: invoiceId });
      if (error) throw error;
    },
    onSuccess: (_d, invoiceId) => {
      void qc.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      void qc.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useInvoicesByOrder(orderId: string) {
  return useQuery({
    queryKey: ['invoices', 'order', orderId],
    enabled: !!orderId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select(
          'id, invoice_number, status, issue_date, due_date, total_minor, balance_minor, currency'
        )
        .eq('order_id', orderId)
        .is('archived_at', null)
        .order('issue_date', { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

export function useInvoicesByProject(projectId: string) {
  return useQuery({
    queryKey: ['invoices', 'project', projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select(
          'id, invoice_number, status, issue_date, due_date, total_minor, balance_minor, currency'
        )
        .eq('project_id', projectId)
        .is('archived_at', null)
        .order('issue_date', { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

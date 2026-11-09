/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useInvoiceDetail(id: string) {
  return useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select(
          `*,
           customer:customers!customer_id(id, display_name),
           order:orders!order_id(id, order_number),
           project:projects!project_id(id, project_number, name)`
        )
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useInvoiceItems(invoiceId: string) {
  return useQuery({
    queryKey: ['invoice-items', invoiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('line_number');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!invoiceId,
  });
}

export function useInvoicePayments(invoiceId: string) {
  return useQuery({
    queryKey: ['invoice-payments', invoiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select(`*, recorder:profiles!recorded_by(id, full_name)`)
        .eq('invoice_id', invoiceId)
        .order('payment_date', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!invoiceId,
  });
}

export function useAddInvoiceItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      invoiceId: string;
      title: string;
      description?: string;
      quantity: number;
      unit: string;
      unitPriceMinor: number;
      discountRate?: number;
      taxRate?: number;
    }) => {
      const { data, error } = await supabase.rpc('add_invoice_item', {
        p_invoice_id: args.invoiceId,
        p_title: args.title,
        p_description: args.description ?? null,
        p_quantity: args.quantity,
        p_unit: args.unit,
        p_unit_price_minor: args.unitPriceMinor,
        p_discount_rate: args.discountRate ?? 0,
        p_tax_rate: args.taxRate ?? 0,
      });
      if (error) throw error;
      return data as { item_id: string };
    },
    onSuccess: (_d, { invoiceId }) => {
      void qc.invalidateQueries({ queryKey: ['invoice-items', invoiceId] });
      void qc.invalidateQueries({ queryKey: ['invoice', invoiceId] });
    },
  });
}

export function useRecordPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      invoiceId: string;
      amountMinor: number;
      method: string;
      paymentDate: string;
      reference?: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase.rpc('record_payment', {
        p_invoice_id: args.invoiceId,
        p_amount_minor: args.amountMinor,
        p_method: args.method as any,
        p_payment_date: args.paymentDate,
        p_reference: args.reference ?? null,
        p_notes: args.notes ?? null,
      });
      if (error) throw error;
      return data as { payment_id: string; payment_number: string };
    },
    onSuccess: (_d, { invoiceId }) => {
      void qc.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      void qc.invalidateQueries({ queryKey: ['invoice-payments', invoiceId] });
      void qc.invalidateQueries({ queryKey: ['invoices'] });
      void qc.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
  });
}

export function useReversePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      paymentId,
      reason,
    }: {
      paymentId: string;
      invoiceId: string;
      reason?: string;
    }) => {
      const { error } = await supabase.rpc('reverse_payment', {
        p_payment_id: paymentId,
        p_reason: reason ?? null,
      });
      if (error) throw error;
    },
    onSuccess: (_d, { invoiceId }) => {
      void qc.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      void qc.invalidateQueries({ queryKey: ['invoice-payments', invoiceId] });
      void qc.invalidateQueries({ queryKey: ['invoices'] });
      void qc.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
  });
}

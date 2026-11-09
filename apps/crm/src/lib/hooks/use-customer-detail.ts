import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { TablesUpdate } from '@platform/types';

export function useCustomerDetail(id: string) {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select(
          `*, primary_contact:customer_contacts!primary_contact_id(id, full_name, email, phone, whatsapp_number, preferred_contact_method),
           owner:profiles!owner_id(id, full_name),
           source_lead:leads!source_lead_id(id, lead_number, full_name, status)`
        )
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCustomerContacts(customerId: string) {
  return useQuery({
    queryKey: ['customer-contacts', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_contacts')
        .select('*')
        .eq('customer_id', customerId)
        .order('is_primary', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!customerId,
  });
}

export function useCustomerAddresses(customerId: string) {
  return useQuery({
    queryKey: ['customer-addresses', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('customer_id', customerId)
        .order('is_primary', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!customerId,
  });
}

export function useCustomerActivities(customerId: string) {
  return useQuery({
    queryKey: ['customer-activities', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activities')
        .select(`*, actor:profiles!actor_id(id, full_name)`)
        .eq('customer_id', customerId)
        .order('occurred_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!customerId,
  });
}

export function useCustomerTasks(customerId: string) {
  return useQuery({
    queryKey: ['customer-tasks', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(`*, assignee:profiles!assigned_to(id, full_name)`)
        .eq('customer_id', customerId)
        .order('due_at');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!customerId,
  });
}

export function useCustomerSiteVisits(customerId: string) {
  return useQuery({
    queryKey: ['customer-site-visits', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_visits')
        .select(`*, assignee:profiles!assigned_to(id, full_name), measurements(*)`)
        .eq('customer_id', customerId)
        .order('scheduled_start', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!customerId,
  });
}

export function useAddCustomerActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      customerId: string;
      actorId: string;
      subject: string;
      body?: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      activityType?: any;
    }) => {
      const { error } = await supabase.from('activities').insert({
        customer_id: payload.customerId,
        actor_id: payload.actorId,
        activity_type: payload.activityType ?? 'note',
        subject: payload.subject,
        body: payload.body ?? null,
        occurred_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: (_data, { customerId }) => {
      void qc.invalidateQueries({ queryKey: ['customer-activities', customerId] });
    },
  });
}

export function useCreateCustomerTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      customerId: string;
      createdBy: string;
      title: string;
      assignedTo?: string;
      dueAt?: string;
    }) => {
      const { error } = await supabase.from('tasks').insert({
        customer_id: payload.customerId,
        created_by: payload.createdBy,
        title: payload.title,
        assigned_to: payload.assignedTo ?? null,
        due_at: payload.dueAt ?? null,
        status: 'todo',
        priority: 'medium',
      });
      if (error) throw error;
    },
    onSuccess: (_data, { customerId }) => {
      void qc.invalidateQueries({ queryKey: ['customer-tasks', customerId] });
    },
  });
}

export function useUpdateCustomerTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      taskId,
      customerId,
      update,
    }: {
      taskId: string;
      customerId: string;
      update: TablesUpdate<'tasks'>;
    }) => {
      const { error } = await supabase.from('tasks').update(update).eq('id', taskId);
      if (error) throw error;
      return { customerId };
    },
    onSuccess: (_data, { customerId }) => {
      void qc.invalidateQueries({ queryKey: ['customer-tasks', customerId] });
      void qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useCreateSiteVisit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      customerId: string;
      leadId?: string;
      scheduledStart?: string;
      scheduledEnd?: string;
      assignedTo?: string;
      purpose?: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('site_visits')
        .insert({
          customer_id: payload.customerId,
          lead_id: payload.leadId ?? null,
          scheduled_start: payload.scheduledStart ?? null,
          scheduled_end: payload.scheduledEnd ?? null,
          assigned_to: payload.assignedTo ?? null,
          purpose: payload.purpose ?? null,
          notes: payload.notes ?? null,
          status: 'scheduled',
        })
        .select('id')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, { customerId }) => {
      void qc.invalidateQueries({ queryKey: ['customer-site-visits', customerId] });
    },
  });
}

export function useUpdateSiteVisit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      visitId,
      customerId,
      update,
    }: {
      visitId: string;
      customerId: string;
      update: TablesUpdate<'site_visits'>;
    }) => {
      const { error } = await supabase.from('site_visits').update(update).eq('id', visitId);
      if (error) throw error;
      return { customerId };
    },
    onSuccess: (_data, { customerId }) => {
      void qc.invalidateQueries({ queryKey: ['customer-site-visits', customerId] });
    },
  });
}

export function useCreateMeasurement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      siteVisitId: string;
      customerId: string;
      areaOrItem: string;
      widthMm?: number | null;
      heightMm?: number | null;
      depthMm?: number | null;
      quantity?: number;
      unit?: string;
      notes?: string;
      recordedBy?: string;
    }) => {
      const { error } = await supabase.from('measurements').insert({
        site_visit_id: payload.siteVisitId,
        area_or_item: payload.areaOrItem,
        width_mm: payload.widthMm ?? null,
        height_mm: payload.heightMm ?? null,
        depth_mm: payload.depthMm ?? null,
        quantity: payload.quantity ?? 1,
        unit: payload.unit ?? 'mm',
        notes: payload.notes ?? null,
        recorded_by: payload.recordedBy ?? null,
      });
      if (error) throw error;
    },
    onSuccess: (_data, { customerId }) => {
      void qc.invalidateQueries({ queryKey: ['customer-site-visits', customerId] });
    },
  });
}

export function useCustomerQuotes(customerId: string) {
  return useQuery({
    queryKey: ['customer-quotes', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotes')
        .select(
          `id, quote_number, status, created_at,
                 current_version:quote_versions!current_version_id(id, version_number, total_minor)`
        )
        .eq('customer_id', customerId)
        .is('archived_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!customerId,
  });
}

export function useCustomerOrders(customerId: string) {
  return useQuery({
    queryKey: ['customer-orders', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, status, order_date, total_minor, target_completion_date')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!customerId,
  });
}

export function useCustomerProjects(customerId: string) {
  return useQuery({
    queryKey: ['customer-projects', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, project_number, name, status, start_date, target_completion_date')
        .eq('customer_id', customerId)
        .is('archived_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!customerId,
  });
}

export function useAddCustomerContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      customerId: string;
      fullName: string;
      email?: string;
      phone?: string;
      whatsappNumber?: string;
      title?: string;
    }) => {
      const { error } = await supabase.from('customer_contacts').insert({
        customer_id: payload.customerId,
        full_name: payload.fullName,
        email: payload.email ?? null,
        phone: payload.phone ?? null,
        whatsapp_number: payload.whatsappNumber ?? null,
        title: payload.title ?? null,
        is_primary: false,
      });
      if (error) throw error;
    },
    onSuccess: (_data, { customerId }) => {
      void qc.invalidateQueries({ queryKey: ['customer-contacts', customerId] });
    },
  });
}

export function useAddCustomerAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      customerId: string;
      line1: string;
      line2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      addressType?: string;
      isPrimary?: boolean;
    }) => {
      const { error } = await supabase.from('addresses').insert({
        customer_id: payload.customerId,
        line1: payload.line1,
        line2: payload.line2 ?? null,
        city: payload.city ?? null,
        state: payload.state ?? null,
        postal_code: payload.postalCode ?? null,
        address_type: payload.addressType ?? null,
        is_primary: payload.isPrimary ?? false,
      });
      if (error) throw error;
    },
    onSuccess: (_data, { customerId }) => {
      void qc.invalidateQueries({ queryKey: ['customer-addresses', customerId] });
    },
  });
}

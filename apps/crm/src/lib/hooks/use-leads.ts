import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { TablesUpdate, Enums } from '@platform/types';

const PAGE_SIZE = 20;

export interface LeadFilters {
  search?: string;
  status?: string;
  priority?: string;
  ownerId?: string;
  page?: number;
}

export function useLeads(filters: LeadFilters = {}) {
  const { search, status, priority, ownerId, page = 0 } = filters;
  return useQuery({
    queryKey: ['leads', filters],
    queryFn: async () => {
      let q = supabase
        .from('leads')
        .select(
          `id, lead_number, full_name, email, phone, status, priority, budget_min_minor, budget_max_minor,
           next_follow_up_at, created_at, owner:profiles!owner_id(id, full_name),
           service:services!service_id(id, title)`,
          { count: 'exact' }
        )
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (search) {
        q = q.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (status) q = q.eq('status', status as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (priority) q = q.eq('priority', priority as any);
      if (ownerId) q = q.eq('owner_id', ownerId);

      const { data, error, count } = await q;
      if (error) throw error;
      return { leads: data ?? [], total: count ?? 0, page, pageSize: PAGE_SIZE };
    },
    placeholderData: (prev) => prev,
  });
}

const KANBAN_STATUSES = [
  'new',
  'contacted',
  'site_visit_scheduled',
  'site_visit_completed',
  'quote_drafting',
  'quote_sent',
  'negotiation',
  'won',
  'lost',
];

export function useLeadsKanban() {
  return useQuery({
    queryKey: ['leads', 'kanban'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select(
          `id, lead_number, full_name, status, priority, budget_min_minor, budget_max_minor,
                 next_follow_up_at, owner:profiles!owner_id(id, full_name)`
        )
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .in('status', KANBAN_STATUSES as any)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      const byStatus: Record<string, typeof data> = {};
      for (const s of KANBAN_STATUSES) byStatus[s] = [];
      for (const lead of data ?? []) {
        if (byStatus[lead.status]) byStatus[lead.status].push(lead);
      }
      return byStatus;
    },
    placeholderData: (prev) => prev,
  });
}

export function useUpdateLeadStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      leadId,
      status,
      lostReason,
      actorId,
    }: {
      leadId: string;
      status: Enums<'lead_status'>;
      lostReason?: string;
      actorId: string;
    }) => {
      const update: TablesUpdate<'leads'> = { status };
      if (status === 'lost' && lostReason) update.lost_reason = lostReason;

      const { error: updateError } = await supabase.from('leads').update(update).eq('id', leadId);
      if (updateError) throw updateError;

      const { error: actError } = await supabase.from('activities').insert({
        activity_type: 'status_change',
        subject: `Status changed to ${status}`,
        lead_id: leadId,
        actor_id: actorId,
        occurred_at: new Date().toISOString(),
      });
      if (actError) throw actError;
    },
    onSuccess: (_data, { leadId }) => {
      void qc.invalidateQueries({ queryKey: ['lead', leadId] });
      void qc.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

export function useUpdateLeadField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      leadId,
      field,
      value,
    }: {
      leadId: string;
      field: string;
      value: unknown;
    }) => {
      const { error } = await supabase
        .from('leads')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update({ [field]: value } as any)
        .eq('id', leadId);
      if (error) throw error;
    },
    onSuccess: (_data, { leadId }) => {
      void qc.invalidateQueries({ queryKey: ['lead', leadId] });
      void qc.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      full_name: string;
      email?: string | null;
      phone?: string | null;
      whatsapp_number?: string | null;
      source?: string | null;
      service_interest?: string | null;
      priority?: Enums<'lead_priority'>;
      budget_min_minor?: number | null;
      budget_max_minor?: number | null;
      location_text?: string | null;
      project_description?: string | null;
      owner_id?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('leads')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert(payload as any)
        .select('id')
        .single();
      if (error) throw error;
      return data as { id: string };
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (leadId: string) => {
      const { error } = await supabase.from('leads').delete().eq('id', leadId);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

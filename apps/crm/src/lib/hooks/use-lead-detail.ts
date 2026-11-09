import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { TablesUpdate } from '@platform/types';

export function useLeadSiteVisits(leadId: string) {
  return useQuery({
    queryKey: ['lead-site-visits', leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_visits')
        .select(
          `id, scheduled_start, scheduled_end, status, purpose,
                 assigned:profiles!assigned_to(id, full_name)`
        )
        .eq('lead_id', leadId)
        .order('scheduled_start', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!leadId,
  });
}

export function useLeadQuotes(leadId: string) {
  return useQuery({
    queryKey: ['lead-quotes', leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotes')
        .select(
          `id, quote_number, status, created_at,
                 current_version:quote_versions!current_version_id(id, version_number, total_minor),
                 order:orders!quote_id(id, order_number, status)`
        )
        .eq('lead_id', leadId)
        .is('archived_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!leadId,
  });
}

export function useScheduleLeadSiteVisit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      leadId: string;
      scheduledStart: string;
      scheduledEnd?: string | null;
      assignedTo?: string | null;
      purpose?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('site_visits')
        .insert({
          lead_id: payload.leadId,
          scheduled_start: payload.scheduledStart,
          scheduled_end: payload.scheduledEnd ?? null,
          assigned_to: payload.assignedTo ?? null,
          purpose: payload.purpose ?? null,
          status: 'scheduled',
        })
        .select('id')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, { leadId }) => {
      void qc.invalidateQueries({ queryKey: ['lead-site-visits', leadId] });
      void qc.invalidateQueries({ queryKey: ['site-visits'] });
    },
  });
}

export function useLeadDetail(id: string) {
  return useQuery({
    queryKey: ['lead', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select(`*, service:services!service_id(id, title), owner:profiles!owner_id(id, full_name)`)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useLeadActivities(leadId: string) {
  return useQuery({
    queryKey: ['lead-activities', leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activities')
        .select(`*, actor:profiles!actor_id(id, full_name)`)
        .eq('lead_id', leadId)
        .order('occurred_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!leadId,
  });
}

export function useLeadTasks(leadId: string) {
  return useQuery({
    queryKey: ['lead-tasks', leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(`*, assignee:profiles!assigned_to(id, full_name)`)
        .eq('lead_id', leadId)
        .order('due_at');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!leadId,
  });
}

export function useLeadAttachments(leadId: string) {
  return useQuery({
    queryKey: ['lead-attachments', leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attachments')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!leadId,
  });
}

export function useAddActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      leadId: string;
      actorId: string;
      subject: string;
      body?: string;
      activityType?: string;
    }) => {
      const { error } = await supabase.from('activities').insert({
        lead_id: payload.leadId,
        actor_id: payload.actorId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        activity_type: (payload.activityType ?? 'note') as any,
        subject: payload.subject,
        body: payload.body ?? null,
        occurred_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: (_data, { leadId }) => {
      void qc.invalidateQueries({ queryKey: ['lead-activities', leadId] });
    },
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      leadId: string;
      createdBy: string;
      title: string;
      assignedTo?: string;
      dueAt?: string;
    }) => {
      const { error } = await supabase.from('tasks').insert({
        lead_id: payload.leadId,
        created_by: payload.createdBy,
        title: payload.title,
        assigned_to: payload.assignedTo ?? null,
        due_at: payload.dueAt ?? null,
        status: 'todo',
        priority: 'medium',
      });
      if (error) throw error;
    },
    onSuccess: (_data, { leadId }) => {
      void qc.invalidateQueries({ queryKey: ['lead-tasks', leadId] });
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      taskId,
      leadId,
      update,
    }: {
      taskId: string;
      leadId?: string | null;
      update: Record<string, unknown>;
    }) => {
      const { error } = await supabase
        .from('tasks')
        .update(update as TablesUpdate<'tasks'>)
        .eq('id', taskId);
      if (error) throw error;
      return { leadId };
    },
    onSuccess: (_data, { leadId }) => {
      if (leadId) void qc.invalidateQueries({ queryKey: ['lead-tasks', leadId] });
      void qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

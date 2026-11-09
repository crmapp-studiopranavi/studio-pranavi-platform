import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { TablesUpdate, TablesInsert } from '@platform/types';

export function useProjectDetail(id: string) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(
          `*,
          customer:customers!customer_id(id, display_name),
          manager:profiles!project_manager_id(id, full_name),
          order:orders!order_id(id, order_number, status, total_minor)`
        )
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useProjectMilestones(projectId: string) {
  return useQuery({
    queryKey: ['project-milestones', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_milestones')
        .select(`*, assignee:profiles!assigned_to(id, full_name)`)
        .eq('project_id', projectId)
        .order('sort_order')
        .order('created_at');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!projectId,
  });
}

export function useProjectInstallations(projectId: string) {
  return useQuery({
    queryKey: ['project-installations', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('installations')
        .select(`*, installer:profiles!lead_installer_id(id, full_name)`)
        .eq('project_id', projectId)
        .order('scheduled_start');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!projectId,
  });
}

export function useProjectActivities(projectId: string) {
  return useQuery({
    queryKey: ['project-activities', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activities')
        .select(`*, actor:profiles!actor_id(id, full_name)`)
        .eq('project_id', projectId)
        .order('occurred_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!projectId,
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      update,
    }: {
      projectId: string;
      update: TablesUpdate<'projects'>;
    }) => {
      const { error } = await supabase.from('projects').update(update).eq('id', projectId);
      if (error) throw error;
    },
    onSuccess: (_d, { projectId }) => {
      void qc.invalidateQueries({ queryKey: ['project', projectId] });
      void qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useCreateMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      projectId: string;
      name: string;
      description?: string;
      dueDate?: string;
      assignedTo?: string;
      sortOrder?: number;
    }) => {
      const insert: TablesInsert<'project_milestones'> = {
        project_id: payload.projectId,
        name: payload.name,
        description: payload.description ?? null,
        due_date: payload.dueDate ?? null,
        assigned_to: payload.assignedTo ?? null,
        sort_order: payload.sortOrder ?? 0,
        status: 'pending',
      };
      const { error } = await supabase.from('project_milestones').insert(insert);
      if (error) throw error;
    },
    onSuccess: (_d, { projectId }) => {
      void qc.invalidateQueries({ queryKey: ['project-milestones', projectId] });
    },
  });
}

export function useUpdateMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      milestoneId,
      projectId: _projectId,
      update,
    }: {
      milestoneId: string;
      projectId: string;
      update: TablesUpdate<'project_milestones'>;
    }) => {
      const { error } = await supabase
        .from('project_milestones')
        .update(update)
        .eq('id', milestoneId);
      if (error) throw error;
    },
    onSuccess: (_d, { projectId }) => {
      void qc.invalidateQueries({ queryKey: ['project-milestones', projectId] });
    },
  });
}

export function useCreateInstallation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      projectId: string;
      scheduledStart?: string;
      scheduledEnd?: string;
      assignedTeam?: string;
      leadInstallerId?: string;
    }) => {
      const insert: TablesInsert<'installations'> = {
        project_id: payload.projectId,
        scheduled_start: payload.scheduledStart ?? null,
        scheduled_end: payload.scheduledEnd ?? null,
        assigned_team: payload.assignedTeam ?? null,
        lead_installer_id: payload.leadInstallerId ?? null,
        status: 'scheduled',
      };
      const { error } = await supabase.from('installations').insert(insert);
      if (error) throw error;
    },
    onSuccess: (_d, { projectId }) => {
      void qc.invalidateQueries({ queryKey: ['project-installations', projectId] });
      void qc.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
  });
}

export function useUpdateInstallation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      installationId,
      projectId: _projectId,
      update,
    }: {
      installationId: string;
      projectId: string;
      update: TablesUpdate<'installations'>;
    }) => {
      const { error } = await supabase
        .from('installations')
        .update(update)
        .eq('id', installationId);
      if (error) throw error;
    },
    onSuccess: (_d, { projectId }) => {
      void qc.invalidateQueries({ queryKey: ['project-installations', projectId] });
      void qc.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
  });
}

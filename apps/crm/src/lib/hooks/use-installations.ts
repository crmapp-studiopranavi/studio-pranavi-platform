/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';

export interface InstallationFilters {
  status?: string;
  statusIn?: string[];
  fromNow?: boolean;
  week?: boolean;
  projectId?: string;
}

export function useInstallations(filters: InstallationFilters = {}) {
  return useQuery({
    queryKey: ['installations', filters],
    queryFn: async () => {
      let q = supabase
        .from('installations')
        .select(
          `
          id, scheduled_start, scheduled_end, status, assigned_team,
          completion_notes, customer_signoff_name, signed_off_at,
          project:projects!project_id(
            id, project_number, name,
            customer:customers!customer_id(id, display_name)
          )
        `
        )
        .order('scheduled_start', { ascending: false })
        .limit(100);

      if (filters.status) q = q.eq('status', filters.status as any);
       
      if (filters.statusIn && filters.statusIn.length > 0)
        q = q.in('status', filters.statusIn as any);
      if (filters.projectId) q = q.eq('project_id', filters.projectId);
      if (filters.fromNow) q = q.gte('scheduled_start', new Date().toISOString());
      if (filters.week) {
        const now = new Date().toISOString();
        const week = new Date(Date.now() + 7 * 86400000).toISOString();
        q = q.gte('scheduled_start', now).lte('scheduled_start', week);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpdateInstallation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: {
        status?: string;
        customer_signoff_name?: string;
        signed_off_at?: string;
        completion_notes?: string;
      };
    }) => {
      const { data, error } = await supabase
        .from('installations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['installations'] }),
  });
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

const PAGE_SIZE = 20;

export interface ProjectFilters {
  status?: string;
  page?: number;
}

export function useProjects(filters: ProjectFilters = {}) {
  const { status, page = 0 } = filters;
  return useQuery({
    queryKey: ['projects', filters],
    queryFn: async () => {
      let q = supabase
        .from('projects')
        .select(
          `id, project_number, name, status, start_date, target_completion_date, actual_completion_date,
           customer:customers!customer_id(id, display_name),
           manager:profiles!project_manager_id(id, full_name)`,
          { count: 'exact' }
        )
        .is('archived_at', null)
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (status) q = q.eq('status', status as any);

      const { data, error, count } = await q;
      if (error) throw error;
      return { projects: data ?? [], total: count ?? 0, page, pageSize: PAGE_SIZE };
    },
    placeholderData: (prev) => prev,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      name: string;
      customerId: string;
      orderId?: string;
      managerId?: string;
      scope?: string;
      startDate?: string;
      targetCompletionDate?: string;
    }) => {
      const { data, error } = await supabase.rpc('create_project', {
        p_name: args.name,
        p_customer_id: args.customerId,
        p_order_id: args.orderId ?? null,
        p_manager_id: args.managerId ?? null,
        p_scope: args.scope ?? null,
        p_start_date: args.startDate ?? null,
        p_target_completion_date: args.targetCompletionDate ?? null,
      });
      if (error) throw error;
      return data as { project_id: string; project_number: string };
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['projects'] });
      void qc.invalidateQueries({ queryKey: ['orders'] });
      void qc.invalidateQueries({ queryKey: ['project-by-order'] });
    },
  });
}

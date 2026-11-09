import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { useAuth } from '../auth-context';

export interface SiteVisitFilters {
  mine?: boolean;
  status?: string;
  upcoming?: boolean;
}

export function useSiteVisits(filters: SiteVisitFilters = {}) {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ['site-visits', filters],
    queryFn: async () => {
      let q = supabase
        .from('site_visits')
        .select(
          `
          id, scheduled_start, scheduled_end, status, purpose, notes,
          lead:leads!lead_id(id, full_name),
          customer:customers!customer_id(id, display_name),
          assigned:profiles!assigned_to(id, full_name)
        `
        )
        .order('scheduled_start', { ascending: false })
        .limit(100);
      if (filters.mine && profile?.id) q = q.eq('assigned_to', profile.id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (filters.status) q = q.eq('status', filters.status as any);
      if (filters.upcoming) q = q.gte('scheduled_start', new Date().toISOString());
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateSiteVisit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: {
      lead_id?: string | null;
      customer_id?: string | null;
      scheduled_start: string;
      scheduled_end?: string | null;
      assigned_to?: string | null;
      purpose?: string | null;
      notes?: string | null;
    }) => {
      const { data, error } = await supabase.from('site_visits').insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['site-visits'] }),
  });
}

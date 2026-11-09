import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabase';

export interface MeasurementFilters {
  projectId?: string;
  pending?: boolean;
}

export function useMeasurements(filters: MeasurementFilters = {}) {
  return useQuery({
    queryKey: ['measurements', filters],
    queryFn: async () => {
      let q = supabase
        .from('measurements')
        .select(
          `
          id, area_or_item, width_mm, height_mm, depth_mm, quantity, unit, notes,
          project:projects!project_id(id, project_number, name),
          site_visit:site_visits!site_visit_id(id, scheduled_start),
          recorded_by:profiles!recorded_by(full_name)
        `
        )
        .order('created_at', { ascending: false })
        .limit(200);
      if (filters.projectId) q = q.eq('project_id', filters.projectId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface StaffProfile {
  id: string;
  full_name: string | null;
}

export function useStaffProfiles() {
  return useQuery({
    queryKey: ['staff-profiles'],
    queryFn: async (): Promise<StaffProfile[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('is_active', true)
        .order('full_name');
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

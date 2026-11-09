import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { TablesUpdate } from '@platform/types';

export function useTeamMembers() {
  return useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_staff_list');
      if (error) throw error;
      return (data ?? []) as {
        id: string;
        full_name: string;
        email: string;
        phone: string | null;
        role: 'admin' | 'manager' | 'sales' | 'operations' | 'viewer';
        is_active: boolean;
        last_seen_at: string | null;
        created_at: string;
      }[];
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      update,
    }: {
      userId: string;
      update: TablesUpdate<'profiles'>;
    }) => {
      const { error } = await supabase.from('profiles').update(update).eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['team-members'] });
    },
  });
}

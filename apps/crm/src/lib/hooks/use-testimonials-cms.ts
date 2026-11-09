/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { CmsTestimonial } from '@/lib/types/cms';

export function useTestimonialsCms() {
  return useQuery({
    queryKey: ['cms-testimonials'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('testimonials')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as CmsTestimonial[];
    },
  });
}

export function useTestimonialCms(id: string | null | undefined) {
  return useQuery({
    queryKey: ['cms-testimonial', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await (supabase as any)
        .from('testimonials')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as CmsTestimonial;
    },
    enabled: !!id,
  });
}

export function useCreateTestimonial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: Omit<CmsTestimonial, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await (supabase as any)
        .from('testimonials')
        .insert(values)
        .select()
        .single();
      if (error) throw error;
      return data as CmsTestimonial;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cms-testimonials'] }),
  });
}

export function useUpdateTestimonial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: Partial<CmsTestimonial> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from('testimonials')
        .update(values)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as CmsTestimonial;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['cms-testimonials'] });
      qc.invalidateQueries({ queryKey: ['cms-testimonial', data.id] });
    },
  });
}

export function useDeleteTestimonial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('testimonials').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cms-testimonials'] }),
  });
}

export function useApproveTestimonial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await (supabase as any)
        .from('testimonials')
        .update({
          status: 'published',
          consent_recorded_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as CmsTestimonial;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['cms-testimonials'] });
      qc.invalidateQueries({ queryKey: ['cms-testimonial', data.id] });
    },
  });
}

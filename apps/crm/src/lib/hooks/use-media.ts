/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { MediaItem, MediaFolder } from '@/lib/types/cms';

// ── Folders ────────────────────────────────────────────────────────────────

export function useMediaFolders() {
  return useQuery({
    queryKey: ['media-folders'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('media_folders')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as MediaFolder[];
    },
  });
}

export function useCreateMediaFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: {
      name: string;
      slug: string;
      parent_id?: string | null;
      is_public?: boolean;
    }) => {
      const { data, error } = await (supabase as any)
        .from('media_folders')
        .insert(values)
        .select()
        .single();
      if (error) throw error;
      return data as MediaFolder;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['media-folders'] }),
  });
}

// ── Media items ────────────────────────────────────────────────────────────

export function useMedia(opts?: {
  folderId?: string | null;
  tag?: string;
  includeArchived?: boolean;
}) {
  return useQuery({
    queryKey: ['media', opts],
    queryFn: async () => {
      let q = (supabase as any)
        .from('media_library')
        .select('*')
        .order('created_at', { ascending: false });

      if (opts?.folderId !== undefined) q = q.eq('folder_id', opts.folderId);
      if (opts?.tag) q = q.contains('tags', [opts.tag]);
      if (!opts?.includeArchived) q = q.is('archived_at', null);

      const { data, error } = await q;
      if (error) throw error;
      return data as MediaItem[];
    },
    staleTime: 30_000,
  });
}

export function useMediaItem(id: string | null | undefined) {
  return useQuery({
    queryKey: ['media-item', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await (supabase as any)
        .from('media_library')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as MediaItem;
    },
    enabled: !!id,
  });
}

export function useUploadMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      file: File;
      folderId?: string | null;
      isPublic?: boolean;
      altText?: string;
      title?: string;
      tags?: string[];
    }) => {
      const bucket = payload.isPublic !== false ? 'website-media' : 'crm-media';
      const ext = payload.file.name.split('.').pop() ?? 'bin';
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, payload.file, { upsert: false });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);

      const { data, error } = await (supabase as any)
        .from('media_library')
        .insert({
          filename: payload.file.name,
          title: payload.title ?? null,
          alt_text: payload.altText ?? '',
          media_kind: 'image',
          storage_path: urlData.publicUrl,
          file_size_bytes: payload.file.size,
          folder_id: payload.folderId ?? null,
          is_public: payload.isPublic !== false,
          tags: payload.tags ?? [],
        })
        .select()
        .single();
      if (error) throw error;
      return data as MediaItem;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['media'] }),
  });
}

export function useAddVideoEmbed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: {
      title: string;
      video_platform: 'youtube' | 'vimeo';
      video_id: string;
      external_url: string;
      thumbnail_path?: string;
      caption?: string;
      autoplay?: boolean;
      muted?: boolean;
      loop?: boolean;
      folder_id?: string | null;
      tags?: string[];
    }) => {
      const { data, error } = await (supabase as any)
        .from('media_library')
        .insert({
          filename: values.title,
          title: values.title,
          caption: values.caption ?? null,
          alt_text: values.title,
          media_kind: 'video_embed',
          external_url: values.external_url,
          video_platform: values.video_platform,
          video_id: values.video_id,
          thumbnail_path: values.thumbnail_path ?? null,
          autoplay: values.autoplay ?? false,
          muted: values.muted ?? true,
          loop: values.loop ?? false,
          folder_id: values.folder_id ?? null,
          is_public: true,
          tags: values.tags ?? [],
          storage_path: values.external_url, // satisfies check constraint
        })
        .select()
        .single();
      if (error) throw error;
      return data as MediaItem;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['media'] }),
  });
}

export function useUpdateMediaItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: Partial<MediaItem> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from('media_library')
        .update(values)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as MediaItem;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['media'] });
      qc.invalidateQueries({ queryKey: ['media-item', data.id] });
    },
  });
}

export function useArchiveMediaItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('media_library')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['media'] }),
  });
}

export function useMediaUsage(mediaId: string | null | undefined) {
  return useQuery({
    queryKey: ['media-usage', mediaId],
    queryFn: async () => {
      if (!mediaId) return [];
      const { data, error } = await (supabase as any)
        .from('media_usage')
        .select('*')
        .eq('media_id', mediaId);
      if (error) throw error;
      return data;
    },
    enabled: !!mediaId,
  });
}

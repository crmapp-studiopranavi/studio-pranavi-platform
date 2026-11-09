/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useCallback, DragEvent, ChangeEvent } from 'react';
import { Image, Video, FolderOpen, Upload, Archive, Tag, Search, X, Info } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@platform/ui';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  useMedia,
  useMediaFolders,
  useUploadMedia,
  useAddVideoEmbed,
  useUpdateMediaItem,
  useArchiveMediaItem,
  useMediaUsage,
} from '@/lib/hooks/use-media';
import type { MediaItem } from '@/lib/types/cms';

// ── Video embed form schema ────────────────────────────────────────────────

const videoSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  video_platform: z.enum(['youtube', 'vimeo']),
  video_id: z.string().min(1, 'Video ID is required'),
  caption: z.string().optional(),
  autoplay: z.boolean().default(false),
  muted: z.boolean().default(true),
  loop: z.boolean().default(false),
});
type VideoForm = z.infer<typeof videoSchema>;

// ── Edit media form schema ─────────────────────────────────────────────────

const editSchema = z.object({
  title: z.string().optional(),
  alt_text: z.string().min(1, 'Alt text is required for accessibility'),
  caption: z.string().optional(),
  tags: z.string().optional(), // comma-separated
  focal_point_x: z.number().min(0).max(1).default(0.5),
  focal_point_y: z.number().min(0).max(1).default(0.5),
});
type EditForm = z.infer<typeof editSchema>;

// ── Status badge ───────────────────────────────────────────────────────────

function StatusPill({ item }: { item: MediaItem }) {
  if (item.archived_at) {
    return (
      <span className="rounded bg-yellow-100 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-700">
        Archived
      </span>
    );
  }
  if (!item.is_public) {
    return (
      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
        Private
      </span>
    );
  }
  return (
    <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">
      Public
    </span>
  );
}

// ── Media thumbnail ────────────────────────────────────────────────────────

function MediaThumb({ item, onClick }: { item: MediaItem; onClick: () => void }) {
  const src = item.thumbnail_path ?? item.storage_path;
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative aspect-square overflow-hidden rounded-md border border-border bg-muted hover:border-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`${item.title ?? item.filename} — click to edit`}
    >
      {item.media_kind === 'image' && src ? (
        <img
          src={src}
          alt={item.alt_text || item.filename}
          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
          loading="lazy"
        />
      ) : item.media_kind !== 'image' ? (
        <div className="flex h-full flex-col items-center justify-center gap-1 bg-muted p-2 text-center">
          <Video className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
          <p className="truncate text-[10px] text-muted-foreground w-full px-1">
            {item.title ?? item.filename}
          </p>
        </div>
      ) : (
        <div className="flex h-full items-center justify-center bg-muted">
          <Image className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-background/80 px-1.5 py-1 text-[10px] truncate opacity-0 group-hover:opacity-100 transition-opacity">
        {item.filename}
      </div>
      {item.archived_at && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
          <Archive className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        </div>
      )}
    </button>
  );
}

// ── Detail panel ───────────────────────────────────────────────────────────

function DetailPanel({ item, onClose }: { item: MediaItem; onClose: () => void }) {
  const { data: usages } = useMediaUsage(item.id);
  const updateMutation = useUpdateMediaItem();
  const archiveMutation = useArchiveMediaItem();

  const form = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      title: item.title ?? '',
      alt_text: item.alt_text,
      caption: item.caption ?? '',
      tags: item.tags.join(', '),
      focal_point_x: item.focal_point_x,
      focal_point_y: item.focal_point_y,
    },
  });

  async function onSubmit(values: EditForm) {
    await updateMutation.mutateAsync({
      id: item.id,
      title: values.title || null,
      alt_text: values.alt_text,
      caption: values.caption || null,
      tags: values.tags
        ? values.tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
      focal_point_x: values.focal_point_x,
      focal_point_y: values.focal_point_y,
    });
  }

  return (
    <aside className="flex h-full w-80 flex-col border-l border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">Media Details</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Close detail panel"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Preview */}
        <div className="aspect-video overflow-hidden rounded-md border border-border bg-muted">
          {item.media_kind === 'image' && item.storage_path ? (
            <img
              src={item.storage_path}
              alt={item.alt_text}
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <Video className="h-10 w-10" aria-hidden="true" />
            </div>
          )}
        </div>

        {/* Meta */}
        <div className="space-y-0.5 text-xs text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">File: </span>
            {item.filename}
          </p>
          {item.width && item.height && (
            <p>
              <span className="font-medium text-foreground">Size: </span>
              {item.width}×{item.height}px
            </p>
          )}
          {item.file_size_bytes && (
            <p>
              <span className="font-medium text-foreground">Weight: </span>
              {(item.file_size_bytes / 1024).toFixed(1)} KB
            </p>
          )}
          <p>
            <span className="font-medium text-foreground">Kind: </span>
            {item.media_kind}
          </p>
          <div className="flex items-center gap-1.5 pt-1">
            <StatusPill item={item} />
          </div>
        </div>

        {/* Edit form */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3" noValidate>
          <div>
            <label className="text-xs font-medium" htmlFor={`title-${item.id}`}>
              Title
            </label>
            <input
              id={`title-${item.id}`}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...form.register('title')}
            />
          </div>
          <div>
            <label className="text-xs font-medium" htmlFor={`alt-${item.id}`}>
              Alt Text <span className="text-destructive">*</span>
            </label>
            <input
              id={`alt-${item.id}`}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...form.register('alt_text')}
            />
            {form.formState.errors.alt_text && (
              <p className="mt-0.5 text-[11px] text-destructive">
                {form.formState.errors.alt_text.message}
              </p>
            )}
          </div>
          <div>
            <label className="text-xs font-medium" htmlFor={`caption-${item.id}`}>
              Caption
            </label>
            <textarea
              id={`caption-${item.id}`}
              rows={2}
              className="mt-1 w-full resize-none rounded-md border border-input bg-background px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...form.register('caption')}
            />
          </div>
          <div>
            <label className="text-xs font-medium" htmlFor={`tags-${item.id}`}>
              <Tag className="inline h-3 w-3 mr-1" aria-hidden="true" />
              Tags (comma-separated)
            </label>
            <input
              id={`tags-${item.id}`}
              placeholder="lobby, chandelier, hospitality"
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...form.register('tags')}
            />
          </div>

          {item.media_kind === 'image' && (
            <div>
              <p className="text-xs font-medium mb-1">Focal Point</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-muted-foreground">X (0–1)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    className="mt-0.5 w-full rounded-md border border-input bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    {...form.register('focal_point_x', { valueAsNumber: true })}
                  />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground">Y (0–1)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    className="mt-0.5 w-full rounded-md border border-input bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    {...form.register('focal_point_y', { valueAsNumber: true })}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              size="sm"
              disabled={form.formState.isSubmitting || updateMutation.isPending}
              className="flex-1"
            >
              {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
          {updateMutation.isSuccess && <p className="text-[11px] text-green-600">Saved.</p>}
          {updateMutation.isError && (
            <p className="text-[11px] text-destructive">Failed to save.</p>
          )}
        </form>

        {/* Usage references */}
        {usages && usages.length > 0 && (
          <div>
            <p className="text-xs font-medium mb-1 flex items-center gap-1">
              <Info className="h-3 w-3" aria-hidden="true" />
              Used in {usages.length} place{usages.length !== 1 ? 's' : ''}
            </p>
            <ul className="space-y-0.5 text-[11px] text-muted-foreground">
              {usages.map((u: any) => (
                <li key={u.id}>
                  {u.table_name} / {u.field_name}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Archive */}
        {!item.archived_at && (
          <div className="border-t border-border pt-3">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-full text-destructive hover:bg-destructive/10"
              disabled={archiveMutation.isPending}
              onClick={() => {
                if (
                  confirm(
                    'Archive this media item? It will no longer appear in the library but can be restored.'
                  )
                ) {
                  archiveMutation.mutate(item.id);
                  onClose();
                }
              }}
            >
              <Archive className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
              Archive
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}

// ── Video embed dialog ─────────────────────────────────────────────────────

function VideoEmbedDialog({ onClose }: { onClose: () => void }) {
  const addVideo = useAddVideoEmbed();
  const form = useForm<VideoForm>({ resolver: zodResolver(videoSchema) });

  async function onSubmit(values: VideoForm) {
    const external_url =
      values.video_platform === 'youtube'
        ? `https://www.youtube.com/watch?v=${values.video_id}`
        : `https://vimeo.com/${values.video_id}`;
    await addVideo.mutateAsync({ ...values, external_url });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Add video embed"
    >
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">Add Video Embed</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label className="text-sm font-medium">Title *</label>
            <input
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...form.register('title')}
            />
            {form.formState.errors.title && (
              <p className="mt-0.5 text-xs text-destructive">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">Platform *</label>
            <select
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...form.register('video_platform')}
            >
              <option value="youtube">YouTube</option>
              <option value="vimeo">Vimeo</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Video ID *</label>
            <input
              placeholder="e.g. dQw4w9WgXcQ"
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...form.register('video_id')}
            />
            {form.formState.errors.video_id && (
              <p className="mt-0.5 text-xs text-destructive">
                {form.formState.errors.video_id.message}
              </p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">Caption</label>
            <input
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...form.register('caption')}
            />
          </div>
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded" {...form.register('autoplay')} />
              Autoplay
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded" {...form.register('muted')} />
              Muted
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded" {...form.register('loop')} />
              Loop
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={addVideo.isPending}>
              {addVideo.isPending ? 'Adding…' : 'Add Video'}
            </Button>
          </div>
          {addVideo.isError && <p className="text-xs text-destructive">Failed to add video.</p>}
        </form>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export function CmsMediaLibraryPage() {
  const [selectedFolder, setSelectedFolder] = useState<string | null | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: folders } = useMediaFolders();
  const {
    data: media,
    isLoading,
    isError,
  } = useMedia({
    folderId: selectedFolder,
    includeArchived: showArchived,
  });
  const uploadMutation = useUploadMedia();

  const filteredMedia =
    media?.filter((item) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        item.filename.toLowerCase().includes(term) ||
        (item.title ?? '').toLowerCase().includes(term) ||
        item.tags.some((t) => t.toLowerCase().includes(term))
      );
    }) ?? [];

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const arr = Array.from(files);
      for (const file of arr) {
        await uploadMutation.mutateAsync({
          file,
          folderId: selectedFolder,
          isPublic: true,
          altText: file.name.replace(/\.[^.]+$/, ''),
        });
      }
    },
    [uploadMutation, selectedFolder]
  );

  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        void handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const onFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        void handleFiles(e.target.files);
        e.target.value = '';
      }
    },
    [handleFiles]
  );

  return (
    <div className="flex h-full" aria-label="Media Library">
      {/* Folders sidebar */}
      <aside className="w-52 shrink-0 border-r border-border bg-muted/30 p-3">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Folders
        </p>
        <ul className="space-y-0.5">
          <li>
            <button
              type="button"
              onClick={() => setSelectedFolder(undefined)}
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                selectedFolder === undefined
                  ? 'bg-primary/10 font-medium text-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <FolderOpen className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              All Media
            </button>
          </li>
          {folders?.map((folder) => (
            <li key={folder.id}>
              <button
                type="button"
                onClick={() => setSelectedFolder(folder.id)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                  selectedFolder === folder.id
                    ? 'bg-primary/10 font-medium text-foreground'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                <FolderOpen className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{folder.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 border-b border-border bg-background px-4 py-2.5">
          <div className="relative flex-1">
            <Search
              className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Search by name or tag…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border border-input bg-background pl-8 pr-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Search media"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
            <input
              type="checkbox"
              className="rounded"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
            />
            Show archived
          </label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setShowVideoDialog(true)}
          >
            <Video className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            Add Video
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
          >
            <Upload className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            {uploadMutation.isPending ? 'Uploading…' : 'Upload'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,.pdf"
            className="sr-only"
            aria-label="Upload files"
            onChange={onFileChange}
          />
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Drop zone + grid */}
          <div
            className={cn(
              'flex-1 overflow-y-auto p-4 transition-colors',
              isDragging && 'bg-primary/5 ring-2 ring-inset ring-primary/30'
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            aria-label="Drop files here to upload"
          >
            {isDragging && (
              <div className="pointer-events-none mb-4 flex items-center justify-center rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 py-8 text-sm text-primary">
                Drop files to upload
              </div>
            )}

            {isError && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                Failed to load media. Please try again.
              </div>
            )}

            {isLoading && (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {Array.from({ length: 12 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-md" />
                ))}
              </div>
            )}

            {!isLoading && filteredMedia.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                <Image className="mb-4 h-10 w-10 opacity-30" aria-hidden="true" />
                <p className="text-sm font-medium">No media yet</p>
                <p className="mt-1 text-xs">Drag and drop files here, or click Upload above.</p>
              </div>
            )}

            {!isLoading && filteredMedia.length > 0 && (
              <>
                <p className="mb-3 text-xs text-muted-foreground">
                  {filteredMedia.length} item{filteredMedia.length !== 1 ? 's' : ''}
                </p>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {filteredMedia.map((item) => (
                    <MediaThumb key={item.id} item={item} onClick={() => setSelectedItem(item)} />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Detail panel */}
          {selectedItem && (
            <DetailPanel
              key={selectedItem.id}
              item={selectedItem}
              onClose={() => setSelectedItem(null)}
            />
          )}
        </div>
      </div>

      {showVideoDialog && <VideoEmbedDialog onClose={() => setShowVideoDialog(false)} />}
    </div>
  );
}

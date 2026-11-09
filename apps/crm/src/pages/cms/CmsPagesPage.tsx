import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Plus, ChevronRight, Globe } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@platform/ui';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  useWebsitePages,
  useCreateWebsitePage,
  useUpdateWebsitePage,
} from '@/lib/hooks/use-cms-pages';
import { useAuth } from '@/lib/auth-context';
import type { WebsitePage, ContentStatus } from '@/lib/types/cms';

const pageSchema = z.object({
  slug: z.string().min(1, 'Slug is required').startsWith('/', 'Must start with /'),
  title: z.string().min(1, 'Title is required'),
  meta_title: z.string().optional(),
  meta_description: z.string().max(160, 'Max 160 characters').optional(),
  status: z.enum(['draft', 'published', 'archived']),
});
type PageForm = z.infer<typeof pageSchema>;

function StatusBadge({ status }: { status: ContentStatus }) {
  return (
    <span
      className={cn(
        'rounded px-1.5 py-0.5 text-[10px] font-semibold',
        status === 'published'
          ? 'bg-green-100 text-green-700'
          : status === 'draft'
            ? 'bg-slate-100 text-slate-600'
            : 'bg-yellow-100 text-yellow-700'
      )}
    >
      {status}
    </span>
  );
}

function PageFormDialog({ page, onClose }: { page?: WebsitePage | null; onClose: () => void }) {
  const createMutation = useCreateWebsitePage();
  const updateMutation = useUpdateWebsitePage();

  const form = useForm<PageForm>({
    resolver: zodResolver(pageSchema),
    defaultValues: {
      slug: page?.slug ?? '/',
      title: page?.title ?? '',
      meta_title: page?.meta_title ?? '',
      meta_description: page?.meta_description ?? '',
      status: page?.status ?? 'draft',
    },
  });

  async function onSubmit(values: PageForm) {
    const payload = {
      ...values,
      meta_title: values.meta_title || null,
      meta_description: values.meta_description || null,
    };
    if (page) {
      await updateMutation.mutateAsync({ id: page.id, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    onClose();
  }

  const isPending = createMutation.isPending || updateMutation.isPending;
  const isError = createMutation.isError || updateMutation.isError;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={page ? 'Edit page' : 'New page'}
    >
      <div className="w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-lg">
        <h2 className="mb-4 text-base font-semibold">{page ? 'Edit Page' : 'New Page'}</h2>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Slug *</label>
              <input
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="/my-page"
                readOnly={page?.is_system}
                {...form.register('slug')}
              />
              {form.formState.errors.slug && (
                <p className="mt-0.5 text-xs text-destructive">
                  {form.formState.errors.slug.message}
                </p>
              )}
            </div>
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
          </div>
          <div>
            <label className="text-sm font-medium">Meta Title</label>
            <input
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...form.register('meta_title')}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Meta Description</label>
            <textarea
              rows={2}
              className="mt-1 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...form.register('meta_description')}
            />
            {form.formState.errors.meta_description && (
              <p className="mt-0.5 text-xs text-destructive">
                {form.formState.errors.meta_description.message}
              </p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">Status</label>
            <select
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...form.register('status')}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          {isError && <p className="text-sm text-destructive">Failed to save. Please try again.</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? 'Saving…' : page ? 'Save Changes' : 'Create Page'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CmsPagesPage() {
  const { profile } = useAuth();
  const canWrite = profile?.role === 'admin' || profile?.role === 'manager';
  const { data: pages, isLoading, isError } = useWebsitePages();
  const [editingPage, setEditingPage] = useState<WebsitePage | null | undefined>(undefined);

  return (
    <div className="space-y-6" aria-label="Website Pages">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Pages</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Manage website pages and their sections.
          </p>
        </div>
        {canWrite && (
          <Button size="sm" onClick={() => setEditingPage(null)}>
            <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
            New Page
          </Button>
        )}
      </div>

      {isError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load pages.
        </div>
      )}

      {isLoading && (
        <div className="divide-y divide-border rounded-lg border border-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="ml-auto h-6 w-16" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && pages && pages.length === 0 && (
        <div className="rounded-lg border border-dashed border-border py-16 text-center text-muted-foreground">
          <Globe className="mx-auto mb-3 h-8 w-8 opacity-30" aria-hidden="true" />
          <p className="text-sm">No pages yet.</p>
        </div>
      )}

      {!isLoading && pages && pages.length > 0 && (
        <div className="divide-y divide-border rounded-lg border border-border">
          {pages.map((page) => (
            <div key={page.id} className="flex items-center gap-4 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{page.title}</span>
                  {page.is_system && (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      system
                    </span>
                  )}
                  <StatusBadge status={page.status} />
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground font-mono">{page.slug}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <a
                  href={`${window.location.protocol}//${window.location.hostname}:5173${page.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  aria-label={`Preview ${page.title} on website`}
                >
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  Preview
                </a>
                <Link
                  to={`/cms/pages/${page.id}/sections`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  aria-label={`Edit sections for ${page.title}`}
                >
                  Sections
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
                {canWrite && (
                  <button
                    type="button"
                    onClick={() => setEditingPage(page)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {editingPage !== undefined && (
        <PageFormDialog page={editingPage} onClose={() => setEditingPage(undefined)} />
      )}
    </div>
  );
}

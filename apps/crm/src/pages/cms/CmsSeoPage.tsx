import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@platform/ui';
import { Skeleton } from '@/components/ui/skeleton';
import { useSeoSettings, useUpsertSeo } from '@/lib/hooks/use-seo-cms';
import { useAuth } from '@/lib/auth-context';
import type { WebsiteSeo } from '@/lib/types/cms';

const seoSchema = z.object({
  page_path: z.string().min(1).startsWith('/', 'Must start with /'),
  meta_title: z.string().optional(),
  meta_description: z.string().max(160, 'Max 160 characters').optional(),
  og_title: z.string().optional(),
  og_description: z.string().optional(),
  canonical_url: z.string().optional(),
  robots_directive: z.string().default('index,follow'),
  structured_data: z.string().optional(),
});
type SeoForm = z.infer<typeof seoSchema>;

function SeoFormDialog({ entry, onClose }: { entry?: WebsiteSeo | null; onClose: () => void }) {
  const upsertMutation = useUpsertSeo();

  const form = useForm<SeoForm>({
    resolver: zodResolver(seoSchema),
    defaultValues: {
      page_path: entry?.page_path ?? '/',
      meta_title: entry?.meta_title ?? '',
      meta_description: entry?.meta_description ?? '',
      og_title: entry?.og_title ?? '',
      og_description: entry?.og_description ?? '',
      canonical_url: entry?.canonical_url ?? '',
      robots_directive: entry?.robots_directive ?? 'index,follow',
      structured_data: entry?.structured_data ? JSON.stringify(entry.structured_data, null, 2) : '',
    },
  });

  async function onSubmit(values: SeoForm) {
    let structured_data: Record<string, unknown> | null = null;
    if (values.structured_data?.trim()) {
      try {
        structured_data = JSON.parse(values.structured_data);
      } catch {
        form.setError('structured_data', { message: 'Invalid JSON' });
        return;
      }
    }
    await upsertMutation.mutateAsync({
      page_path: values.page_path,
      meta_title: values.meta_title || null,
      meta_description: values.meta_description || null,
      og_title: values.og_title || null,
      og_description: values.og_description || null,
      og_image_id: entry?.og_image_id ?? null,
      canonical_url: values.canonical_url || null,
      robots_directive: values.robots_directive,
      structured_data,
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-lg border border-border bg-card p-6 shadow-lg">
        <h2 className="mb-4 text-base font-semibold">{entry ? 'Edit SEO' : 'Add SEO Entry'}</h2>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label className="text-sm font-medium">Page Path *</label>
            <input
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              readOnly={!!entry}
              {...form.register('page_path')}
            />
            {form.formState.errors.page_path && (
              <p className="mt-0.5 text-xs text-destructive">
                {form.formState.errors.page_path.message}
              </p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">Meta Title</label>
            <input
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...form.register('meta_title')}
            />
          </div>
          <div>
            <label className="text-sm font-medium">
              Meta Description{' '}
              <span className="font-normal text-muted-foreground">(max 160 chars)</span>
            </label>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">OG Title</label>
              <input
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...form.register('og_title')}
              />
            </div>
            <div>
              <label className="text-sm font-medium">OG Description</label>
              <input
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...form.register('og_description')}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Canonical URL</label>
            <input
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...form.register('canonical_url')}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Robots Directive</label>
            <select
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...form.register('robots_directive')}
            >
              <option value="index,follow">index, follow (default)</option>
              <option value="noindex,follow">noindex, follow</option>
              <option value="noindex,nofollow">noindex, nofollow</option>
              <option value="index,nofollow">index, nofollow</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">
              Structured Data <span className="font-normal text-muted-foreground">(JSON-LD)</span>
            </label>
            <textarea
              rows={5}
              className="mt-1 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder='{"@type": "Organization", ...}'
              {...form.register('structured_data')}
            />
            {form.formState.errors.structured_data && (
              <p className="mt-0.5 text-xs text-destructive">
                {form.formState.errors.structured_data.message}
              </p>
            )}
          </div>
          {upsertMutation.isError && (
            <p className="text-sm text-destructive">Failed to save SEO entry.</p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={upsertMutation.isPending}>
              {upsertMutation.isPending ? 'Saving…' : entry ? 'Save Changes' : 'Add Entry'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CmsSeoPage() {
  const { profile } = useAuth();
  const canWrite = profile?.role === 'admin' || profile?.role === 'manager';
  const { data: entries, isLoading, isError } = useSeoSettings();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<WebsiteSeo | null | undefined>(undefined);

  const filtered =
    entries?.filter(
      (e) =>
        !search ||
        e.page_path.includes(search) ||
        (e.meta_title ?? '').toLowerCase().includes(search.toLowerCase())
    ) ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">SEO Settings</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Manage per-page meta titles, descriptions, Open Graph, and structured data.
          </p>
        </div>
        {canWrite && (
          <Button size="sm" onClick={() => setEditing(null)}>
            <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Add Entry
          </Button>
        )}
      </div>

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Search by path or title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search SEO entries"
        />
      </div>

      {isError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load SEO settings.
        </div>
      )}

      {isLoading && (
        <div className="divide-y divide-border rounded-lg border border-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-48 ml-4" />
              <Skeleton className="ml-auto h-6 w-12" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="rounded-lg border border-dashed border-border py-16 text-center text-muted-foreground text-sm">
          {search ? 'No matching entries.' : 'No SEO entries yet.'}
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="divide-y divide-border rounded-lg border border-border">
          {filtered.map((entry) => (
            <div key={entry.id} className="flex items-center gap-4 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-medium">{entry.page_path}</span>
                  {entry.robots_directive !== 'index,follow' && (
                    <span className="rounded bg-yellow-100 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-700">
                      {entry.robots_directive}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground truncate">
                  {entry.meta_title || <span className="italic">No title set</span>}
                </p>
              </div>
              {canWrite && (
                <button
                  type="button"
                  onClick={() => setEditing(entry)}
                  className="shrink-0 text-xs text-primary hover:underline"
                >
                  Edit
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {editing !== undefined && (
        <SeoFormDialog entry={editing} onClose={() => setEditing(undefined)} />
      )}
    </div>
  );
}

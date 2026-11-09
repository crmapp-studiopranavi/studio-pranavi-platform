import { useState } from 'react';
import { Plus, ExternalLink } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@platform/ui';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  useServicesAdmin,
  useCreateService,
  useUpdateService,
} from '@/lib/hooks/use-services-admin';
import { useAuth } from '@/lib/auth-context';

const CATEGORIES = [
  'Bespoke Lighting',
  'Architectural Lighting',
  'Decorative Lighting',
  'Custom Glass',
  'Installation',
];

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const serviceSchema = z.object({
  title: z.string().min(1, 'Title required'),
  slug: z
    .string()
    .min(1, 'Slug required')
    .regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers and hyphens only'),
  category: z.string().min(1, 'Category required'),
  short_description: z.string().min(1, 'Short description required'),
  description: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']),
  sort_order: z.number().int().min(0),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
});
type ServiceForm = z.infer<typeof serviceSchema>;

function ServiceFormDialog({
  service,
  onClose,
}: {
  service?: Record<string, unknown> | null;
  onClose: () => void;
}) {
  const createMutation = useCreateService();
  const updateMutation = useUpdateService();

  const form = useForm<ServiceForm>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      title: (service?.title as string) ?? '',
      slug: (service?.slug as string) ?? '',
      category: (service?.category as string) ?? CATEGORIES[0],
      short_description: (service?.short_description as string) ?? '',
      description: (service?.description as string) ?? '',
      status: (service?.status as 'draft' | 'published' | 'archived') ?? 'draft',
      sort_order: (service?.sort_order as number) ?? 0,
      seo_title: (service?.seo_title as string) ?? '',
      seo_description: (service?.seo_description as string) ?? '',
    },
  });

  async function onSubmit(values: ServiceForm) {
    const payload = {
      ...values,
      description: values.description || null,
      seo_title: values.seo_title || null,
      seo_description: values.seo_description || null,
    };
    if (service) {
      await updateMutation.mutateAsync({ id: service.id as string, update: payload });
    } else {
      await createMutation.mutateAsync(payload as Parameters<typeof createMutation.mutateAsync>[0]);
    }
    onClose();
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-lg border border-border bg-card p-6 shadow-lg">
        <h2 className="mb-4 text-base font-semibold">{service ? 'Edit Service' : 'New Service'}</h2>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Title *</label>
              <input
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...form.register('title', {
                  onChange: (e) => {
                    if (!service) form.setValue('slug', slugify(e.target.value));
                  },
                })}
              />
              {form.formState.errors.title && (
                <p className="mt-0.5 text-xs text-destructive">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Slug *</label>
              <input
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...form.register('slug')}
              />
              {form.formState.errors.slug && (
                <p className="mt-0.5 text-xs text-destructive">
                  {form.formState.errors.slug.message}
                </p>
              )}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Category *</label>
            <select
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...form.register('category')}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Short Description *</label>
            <textarea
              rows={2}
              className="mt-1 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...form.register('short_description')}
            />
            {form.formState.errors.short_description && (
              <p className="mt-0.5 text-xs text-destructive">
                {form.formState.errors.short_description.message}
              </p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">Full Description</label>
            <textarea
              rows={4}
              className="mt-1 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...form.register('description')}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <label className="text-sm font-medium">Sort Order</label>
              <input
                type="number"
                min="0"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...form.register('sort_order', { valueAsNumber: true })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">SEO Title</label>
              <input
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...form.register('seo_title')}
              />
            </div>
            <div>
              <label className="text-sm font-medium">SEO Description</label>
              <input
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...form.register('seo_description')}
              />
            </div>
          </div>
          {(createMutation.isError || updateMutation.isError) && (
            <p className="text-sm text-destructive">Failed to save.</p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? 'Saving…' : service ? 'Save Changes' : 'Create Service'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CmsServicesPage() {
  const { profile } = useAuth();
  const canWrite = profile?.role === 'admin' || profile?.role === 'manager';
  const { data: services, isLoading, isError } = useServicesAdmin();
  const [editing, setEditing] = useState<Record<string, unknown> | null | undefined>(undefined);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Services / Expertise</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Manage publicly visible expertise and service pages.
          </p>
        </div>
        {canWrite && (
          <Button size="sm" onClick={() => setEditing(null)}>
            <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
            New Service
          </Button>
        )}
      </div>

      {isError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load services.
        </div>
      )}

      {isLoading && (
        <div className="divide-y divide-border rounded-lg border border-border">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="ml-auto h-6 w-16" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && services && services.length === 0 && (
        <div className="rounded-lg border border-dashed border-border py-16 text-center text-muted-foreground text-sm">
          No services yet. Create your first.
        </div>
      )}

      {!isLoading && services && services.length > 0 && (
        <div className="divide-y divide-border rounded-lg border border-border">
          {services.map((service) => (
            <div key={service.id} className="flex items-center gap-4 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{service.title}</span>
                  <span
                    className={cn(
                      'rounded px-1.5 py-0.5 text-[10px] font-semibold',
                      service.status === 'published'
                        ? 'bg-green-100 text-green-700'
                        : service.status === 'draft'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-yellow-100 text-yellow-700'
                    )}
                  >
                    {service.status}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {service.category} · /expertise/{service.slug}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <a
                  href={`${window.location.protocol}//${window.location.hostname}:5173/expertise/${service.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-foreground"
                  aria-label={`Preview ${service.title}`}
                >
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
                {canWrite && (
                  <button
                    type="button"
                    onClick={() => setEditing(service as unknown as Record<string, unknown>)}
                    className="text-xs text-primary hover:underline"
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {editing !== undefined && (
        <ServiceFormDialog service={editing} onClose={() => setEditing(undefined)} />
      )}
    </div>
  );
}

import { useState } from 'react';
import { Plus, ExternalLink } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@platform/ui';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  usePortfolioProjectsAdmin,
  useCreatePortfolioProject,
  useUpdatePortfolioProject,
} from '@/lib/hooks/use-portfolio-cms';
import { useAuth } from '@/lib/auth-context';
import type { Tables } from '@platform/types';

type PortfolioProject = Tables<'portfolio_projects'>;

const CATEGORIES = [
  'Residential',
  'Hospitality',
  'Commercial',
  'Heritage',
  'Retail',
  'Corporate',
  'Other',
];

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const projectSchema = z.object({
  title: z.string().min(1, 'Title required'),
  slug: z
    .string()
    .min(1, 'Slug required')
    .regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers and hyphens only'),
  category: z.string().min(1, 'Category required'),
  summary: z.string().min(1, 'Summary required'),
  description: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']),
  sort_order: z.number().int().min(0),
  location_label: z.string().optional(),
  is_featured: z.boolean().default(false),
  completed_on: z.string().optional(),
  seo_title: z.string().optional(),
  seo_description: z.string().max(160, 'Max 160 characters').optional(),
});
type ProjectForm = z.infer<typeof projectSchema>;

function ProjectFormDialog({
  project,
  onClose,
}: {
  project?: PortfolioProject | null;
  onClose: () => void;
}) {
  const createMutation = useCreatePortfolioProject();
  const updateMutation = useUpdatePortfolioProject();

  const form = useForm<ProjectForm>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: project?.title ?? '',
      slug: project?.slug ?? '',
      category: project?.category ?? CATEGORIES[0],
      summary: project?.summary ?? '',
      description: project?.description ?? '',
      status: (project?.status ?? 'draft') as 'draft' | 'published' | 'archived',
      sort_order: project?.sort_order ?? 0,
      location_label: project?.location_label ?? '',
      is_featured: project?.is_featured ?? false,
      completed_on: project?.completed_on ?? '',
      seo_title: project?.seo_title ?? '',
      seo_description: project?.seo_description ?? '',
    },
  });

  async function onSubmit(values: ProjectForm) {
    const payload = {
      title: values.title,
      slug: values.slug,
      category: values.category,
      summary: values.summary,
      description: values.description || null,
      status: values.status,
      sort_order: values.sort_order,
      location_label: values.location_label || null,
      is_featured: values.is_featured,
      completed_on: values.completed_on || null,
      seo_title: values.seo_title || null,
      seo_description: values.seo_description || null,
    };
    if (project) {
      await updateMutation.mutateAsync({ id: project.id, update: payload });
    } else {
      await createMutation.mutateAsync(payload);
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
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border border-border bg-card p-6 shadow-lg">
        <h2 className="mb-4 text-base font-semibold">
          {project ? 'Edit Project' : 'New Portfolio Project'}
        </h2>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Title *</label>
              <input
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...form.register('title', {
                  onChange: (e) => {
                    if (!project) form.setValue('slug', slugify(e.target.value));
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
          <div className="grid grid-cols-2 gap-4">
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
          </div>
          <div>
            <label className="text-sm font-medium">Summary *</label>
            <textarea
              rows={2}
              className="mt-1 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...form.register('summary')}
            />
            {form.formState.errors.summary && (
              <p className="mt-0.5 text-xs text-destructive">
                {form.formState.errors.summary.message}
              </p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              rows={4}
              className="mt-1 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...form.register('description')}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Location</label>
              <input
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="e.g. Mumbai, India"
                {...form.register('location_label')}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Completed On</label>
              <input
                type="date"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...form.register('completed_on')}
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
              {form.formState.errors.seo_description && (
                <p className="mt-0.5 text-xs text-destructive">
                  {form.formState.errors.seo_description.message}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Sort Order</label>
              <input
                type="number"
                min="0"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...form.register('sort_order', { valueAsNumber: true })}
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" className="rounded" {...form.register('is_featured')} />
                Featured project
              </label>
            </div>
          </div>
          {(createMutation.isError || updateMutation.isError) && (
            <p className="text-sm text-destructive">Failed to save project.</p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? 'Saving…' : project ? 'Save Changes' : 'Create Project'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
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

export function CmsProjectsPage() {
  const { profile } = useAuth();
  const canWrite = profile?.role === 'admin' || profile?.role === 'manager';
  const { data: projects, isLoading, isError } = usePortfolioProjectsAdmin();
  const [editing, setEditing] = useState<PortfolioProject | null | undefined>(undefined);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Portfolio Projects</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Manage publicly visible portfolio projects and their details.
          </p>
        </div>
        {canWrite && (
          <Button size="sm" onClick={() => setEditing(null)}>
            <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
            New Project
          </Button>
        )}
      </div>

      {isError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load projects.
        </div>
      )}

      {isLoading && (
        <div className="divide-y divide-border rounded-lg border border-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <Skeleton className="h-10 w-10 rounded shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && projects && projects.length === 0 && (
        <div className="rounded-lg border border-dashed border-border py-16 text-center text-muted-foreground text-sm">
          No portfolio projects yet. Create your first.
        </div>
      )}

      {!isLoading && projects && projects.length > 0 && (
        <div className="divide-y divide-border rounded-lg border border-border">
          {projects.map((project) => (
            <div key={project.id} className="flex items-center gap-4 px-4 py-3">
              <div className="h-10 w-10 shrink-0 rounded overflow-hidden">
                {project.cover_image_path ? (
                  <img
                    src={project.cover_image_path}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full rounded" style={{ background: '#EDE8DF' }} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{project.title}</span>
                  <StatusBadge status={project.status} />
                  {project.is_featured && (
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                      featured
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {project.category}
                  {project.location_label && ` · ${project.location_label}`}
                  {project.completed_on && ` · ${new Date(project.completed_on).getFullYear()}`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <a
                  href={`${window.location.protocol}//${window.location.hostname}:5173/projects/${project.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-foreground"
                  aria-label={`Preview ${project.title}`}
                >
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
                {canWrite && (
                  <button
                    type="button"
                    onClick={() => setEditing(project as unknown as PortfolioProject)}
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
        <ProjectFormDialog project={editing} onClose={() => setEditing(undefined)} />
      )}
    </div>
  );
}

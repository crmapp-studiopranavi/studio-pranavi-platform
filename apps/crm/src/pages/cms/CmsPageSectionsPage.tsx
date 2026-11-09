import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, GripVertical, Eye, EyeOff, Check, Trash2, Edit2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@platform/ui';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  useWebsitePage,
  usePageSections,
  useCreatePageSection,
  useUpdatePageSection,
  useDeletePageSection,
  usePublishSection,
  useReorderSections,
} from '@/lib/hooks/use-cms-pages';
import { useAuth } from '@/lib/auth-context';
import type { PageSection, SectionType, ContentStatus } from '@/lib/types/cms';

const SECTION_TYPES: { value: SectionType; label: string }[] = [
  { value: 'hero', label: 'Hero' },
  { value: 'selected_projects', label: 'Selected Projects' },
  { value: 'services', label: 'Services / Expertise' },
  { value: 'collections', label: 'Collections' },
  { value: 'gallery', label: 'Gallery' },
  { value: 'video', label: 'Video' },
  { value: 'about', label: 'About' },
  { value: 'text_image', label: 'Text + Image' },
  { value: 'craftsmanship', label: 'Craftsmanship' },
  { value: 'materials', label: 'Materials' },
  { value: 'process_timeline', label: 'Process Timeline' },
  { value: 'before_after', label: 'Before / After' },
  { value: 'testimonials', label: 'Testimonials' },
  { value: 'faq', label: 'FAQ' },
  { value: 'cta', label: 'CTA' },
  { value: 'contact', label: 'Contact' },
  { value: 'map', label: 'Map' },
];

const sectionSchema = z.object({
  section_type: z.enum([
    'hero',
    'selected_projects',
    'services',
    'collections',
    'gallery',
    'video',
    'about',
    'text_image',
    'craftsmanship',
    'materials',
    'process_timeline',
    'before_after',
    'testimonials',
    'faq',
    'cta',
    'contact',
    'map',
  ]),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  theme: z.enum(['light', 'dark', 'stone', 'amber']),
  alignment: z.enum(['left', 'center', 'right']),
  cta_label: z.string().optional(),
  cta_url: z.string().optional(),
  cta_secondary_label: z.string().optional(),
  cta_secondary_url: z.string().optional(),
  is_visible: z.boolean().default(true),
  status: z.enum(['draft', 'published', 'archived']),
});
type SectionForm = z.infer<typeof sectionSchema>;

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

function SectionFormDialog({
  pageId,
  section,
  onClose,
}: {
  pageId: string;
  section?: PageSection | null;
  onClose: () => void;
}) {
  const createMutation = useCreatePageSection();
  const updateMutation = useUpdatePageSection();

  const form = useForm<SectionForm>({
    resolver: zodResolver(sectionSchema),
    defaultValues: {
      section_type: section?.section_type ?? 'hero',
      title: section?.title ?? '',
      subtitle: section?.subtitle ?? '',
      description: section?.description ?? '',
      theme: section?.theme ?? 'light',
      alignment: section?.alignment ?? 'left',
      cta_label: section?.cta_label ?? '',
      cta_url: section?.cta_url ?? '',
      cta_secondary_label: section?.cta_secondary_label ?? '',
      cta_secondary_url: section?.cta_secondary_url ?? '',
      is_visible: section?.is_visible ?? true,
      status: section?.status ?? 'draft',
    },
  });

  async function onSubmit(values: SectionForm) {
    if (section) {
      await updateMutation.mutateAsync({
        id: section.id,
        ...values,
        title: values.title || null,
        subtitle: values.subtitle || null,
        description: values.description || null,
        cta_label: values.cta_label || null,
        cta_url: values.cta_url || null,
        cta_secondary_label: values.cta_secondary_label || null,
        cta_secondary_url: values.cta_secondary_url || null,
      });
    } else {
      await createMutation.mutateAsync({
        page_id: pageId,
        ...values,
        title: values.title || null,
        subtitle: values.subtitle || null,
        description: values.description || null,
        cta_label: values.cta_label || null,
        cta_url: values.cta_url || null,
        cta_secondary_label: values.cta_secondary_label || null,
        cta_secondary_url: values.cta_secondary_url || null,
      });
    }
    onClose();
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={section ? 'Edit section' : 'Add section'}
    >
      <div className="w-full max-w-2xl rounded-lg border border-border bg-card p-6 shadow-lg max-h-[90vh] overflow-y-auto">
        <h2 className="mb-4 text-base font-semibold">{section ? 'Edit Section' : 'Add Section'}</h2>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Section Type *</label>
              <select
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...form.register('section_type')}
              >
                {SECTION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Theme</label>
              <select
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...form.register('theme')}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="stone">Stone</option>
                <option value="amber">Amber</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Title</label>
            <input
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...form.register('title')}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Subtitle</label>
            <input
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...form.register('subtitle')}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              rows={3}
              className="mt-1 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...form.register('description')}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Alignment</label>
              <select
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...form.register('alignment')}
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Primary CTA Label</label>
              <input
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...form.register('cta_label')}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Primary CTA URL</label>
              <input
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...form.register('cta_url')}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Secondary CTA Label</label>
              <input
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...form.register('cta_secondary_label')}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Secondary CTA URL</label>
              <input
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...form.register('cta_secondary_url')}
              />
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" className="rounded" {...form.register('is_visible')} />
            Visible on website
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? 'Saving…' : section ? 'Save Changes' : 'Add Section'}
            </Button>
          </div>
          {(createMutation.isError || updateMutation.isError) && (
            <p className="text-sm text-destructive">Failed to save section.</p>
          )}
        </form>
      </div>
    </div>
  );
}

export function CmsPageSectionsPage() {
  const { id: pageId } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const canWrite = profile?.role === 'admin' || profile?.role === 'manager';

  const { data: page } = useWebsitePage(pageId);
  const { data: sections, isLoading } = usePageSections(pageId);
  const deleteMutation = useDeletePageSection();
  const publishMutation = usePublishSection();
  const reorderMutation = useReorderSections();

  const [editingSection, setEditingSection] = useState<PageSection | null | undefined>(undefined);
  const [dragId, setDragId] = useState<string | null>(null);

  function handleDragStart(id: string) {
    setDragId(id);
  }

  function handleDrop(targetId: string) {
    if (!dragId || dragId === targetId || !sections || !pageId) return;
    const order = sections.map((s) => s.id);
    const from = order.indexOf(dragId);
    const to = order.indexOf(targetId);
    const reordered = [...order];
    reordered.splice(from, 1);
    reordered.splice(to, 0, dragId);
    reorderMutation.mutate({ pageId, orderedIds: reordered });
    setDragId(null);
  }

  return (
    <div className="space-y-5" aria-label="Page sections editor">
      <div className="flex items-center gap-3">
        <Link
          to="/cms/pages"
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Pages
        </Link>
        <span className="text-muted-foreground">/</span>
        <h1 className="text-base font-semibold">{page?.title ?? '…'}</h1>
        <span className="font-mono text-xs text-muted-foreground">{page?.slug}</span>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Manage sections for this page. Drag to reorder. Each section must be published
          individually.
        </p>
        {canWrite && (
          <Button size="sm" onClick={() => setEditingSection(null)} disabled={!pageId}>
            <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Add Section
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      )}

      {!isLoading && sections && sections.length === 0 && (
        <div className="rounded-lg border border-dashed border-border py-16 text-center text-muted-foreground">
          <p className="text-sm">No sections yet. Add your first section above.</p>
        </div>
      )}

      {!isLoading && sections && sections.length > 0 && (
        <div className="space-y-2" onDragOver={(e) => e.preventDefault()}>
          {sections.map((section) => (
            <div
              key={section.id}
              draggable={canWrite}
              onDragStart={() => handleDragStart(section.id)}
              onDrop={() => handleDrop(section.id)}
              className={cn(
                'flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-opacity',
                dragId === section.id && 'opacity-50'
              )}
            >
              {canWrite && (
                <GripVertical
                  className="h-4 w-4 cursor-grab shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">
                    {SECTION_TYPES.find((t) => t.value === section.section_type)?.label ??
                      section.section_type}
                  </span>
                  {section.title && (
                    <span className="text-sm text-muted-foreground">— {section.title}</span>
                  )}
                  <StatusBadge status={section.status} />
                  {!section.is_visible && (
                    <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                      <EyeOff className="h-3 w-3" aria-hidden="true" /> Hidden
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span>Theme: {section.theme}</span>
                  <span>·</span>
                  <span>Align: {section.alignment}</span>
                  {section.cta_label && (
                    <>
                      <span>·</span>
                      <span>CTA: {section.cta_label}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {canWrite && section.status === 'draft' && (
                  <button
                    type="button"
                    title="Publish section"
                    onClick={() => pageId && publishMutation.mutate({ id: section.id, pageId })}
                    disabled={publishMutation.isPending}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-green-50 hover:text-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Publish section"
                  >
                    <Check className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
                {section.is_visible ? (
                  <button
                    type="button"
                    title="Toggle visibility"
                    onClick={() => canWrite && pageId && undefined /* TODO: toggle */}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Section is visible"
                  >
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  </button>
                ) : (
                  <button
                    type="button"
                    title="Toggle visibility"
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Section is hidden"
                  >
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
                {canWrite && (
                  <button
                    type="button"
                    title="Edit section"
                    onClick={() => setEditingSection(section)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`Edit ${section.section_type} section`}
                  >
                    <Edit2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
                {canWrite && (
                  <button
                    type="button"
                    title="Delete section"
                    onClick={() => {
                      if (!pageId) return;
                      if (confirm('Delete this section? This cannot be undone.')) {
                        deleteMutation.mutate({ id: section.id, pageId });
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`Delete ${section.section_type} section`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {editingSection !== undefined && pageId && (
        <SectionFormDialog
          pageId={pageId}
          section={editingSection}
          onClose={() => setEditingSection(undefined)}
        />
      )}
    </div>
  );
}

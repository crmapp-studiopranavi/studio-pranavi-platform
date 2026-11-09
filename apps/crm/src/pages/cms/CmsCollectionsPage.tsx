import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  useCollectionsCms,
  useCreateCollection,
  useUpdateCollection,
  useDeleteCollection,
} from '@/lib/hooks/use-collections-cms';
import type { WebsiteCollection } from '@/lib/types/cms';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Badge,
} from '@platform/ui';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';

function toSlug(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function StatusBadge({ status }: { status: WebsiteCollection['status'] }) {
  if (status === 'published')
    return (
      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
        Published
      </Badge>
    );
  if (status === 'archived') return <Badge variant="secondary">Archived</Badge>;
  return <Badge variant="outline">Draft</Badge>;
}

type FormState = {
  title: string;
  slug: string;
  description: string;
  status: 'draft' | 'published';
  sort_order: number;
};

const DEFAULT_FORM: FormState = {
  title: '',
  slug: '',
  description: '',
  status: 'draft',
  sort_order: 0,
};

export function CmsCollectionsPage() {
  const { profile } = useAuth();
  const canWrite = profile?.role === 'admin' || profile?.role === 'manager';

  const { data: collections, isLoading, isError } = useCollectionsCms();
  const createCol = useCreateCollection();
  const updateCol = useUpdateCollection();
  const deleteCol = useDeleteCollection();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);

  function openCreate() {
    setEditId(null);
    setForm(DEFAULT_FORM);
    setShowForm(true);
  }

  function openEdit(col: WebsiteCollection) {
    setEditId(col.id);
    setForm({
      title: col.title,
      slug: col.slug,
      description: col.description ?? '',
      status: col.status === 'archived' ? 'draft' : col.status,
      sort_order: col.sort_order,
    });
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditId(null);
    setForm(DEFAULT_FORM);
  }

  function handleTitleChange(v: string) {
    setForm((f) => ({ ...f, title: v, slug: editId ? f.slug : toSlug(v) }));
  }

  function handleSubmit() {
    if (!form.title.trim() || !form.slug.trim()) return;
    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      description: form.description.trim() || null,
      status: form.status,
      sort_order: form.sort_order,
      seo_title: null,
      seo_description: null,
      cover_image_id: null,
    };
    if (editId) {
      updateCol.mutate({ id: editId, ...payload }, { onSuccess: cancelForm });
    } else {
      createCol.mutate(payload, { onSuccess: cancelForm });
    }
  }

  function handleDelete(col: WebsiteCollection) {
    if (!window.confirm(`Delete collection "${col.title}"? This cannot be undone.`)) return;
    deleteCol.mutate(col.id);
  }

  const isPending = createCol.isPending || updateCol.isPending;
  const hasError = createCol.isError || updateCol.isError;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Collections</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage curated design collections shown on the website.
          </p>
        </div>
        {canWrite && (
          <Button size="sm" onClick={openCreate} className="gap-1.5">
            <PlusCircle className="h-4 w-4" aria-hidden="true" />
            New Collection
          </Button>
        )}
      </div>

      {!canWrite && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Insufficient permissions — admin or manager role required to make changes.
        </div>
      )}

      {showForm && canWrite && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {editId ? 'Edit Collection' : 'New Collection'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="col_title">Title *</Label>
                <Input
                  id="col_title"
                  value={form.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Signature Pendants"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="col_slug">Slug *</Label>
                <Input
                  id="col_slug"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: toSlug(e.target.value) }))}
                  placeholder="signature-pendants"
                />
                <p className="text-[11px] text-muted-foreground">
                  URL: /collections/{form.slug || '…'}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="col_desc">Description</Label>
              <textarea
                id="col_desc"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Short description of this collection"
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="col_status">Status</Label>
                <select
                  id="col_status"
                  value={form.status}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, status: e.target.value as 'draft' | 'published' }))
                  }
                  className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="col_sort">Sort Order</Label>
                <Input
                  id="col_sort"
                  type="number"
                  value={form.sort_order}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))
                  }
                  className="w-full"
                />
              </div>
            </div>

            {hasError && (
              <p className="text-sm text-destructive">
                Save failed. The slug may already be in use.
              </p>
            )}

            <div className="flex gap-2">
              <Button size="sm" disabled={isPending || !form.title.trim()} onClick={handleSubmit}>
                {isPending ? 'Saving…' : editId ? 'Save Changes' : 'Create Collection'}
              </Button>
              <Button size="sm" variant="outline" onClick={cancelForm}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isError && (
        <p className="text-sm text-destructive">Failed to load collections. Please try again.</p>
      )}

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}

      {!isLoading && collections && collections.length === 0 && !showForm && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">No collections yet.</p>
            {canWrite && (
              <Button size="sm" variant="outline" className="mt-4" onClick={openCreate}>
                Create your first collection
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {!isLoading && collections && collections.length > 0 && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Collections">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Slug</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Order</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Created</th>
                  {canWrite && (
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {collections.map((col) => (
                  <tr key={col.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{col.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <code className="rounded bg-muted px-1 text-xs">{col.slug}</code>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={col.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{col.sort_order}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(col.created_at).toLocaleDateString('en-IN')}
                    </td>
                    {canWrite && (
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEdit(col)}
                            aria-label={`Edit ${col.title}`}
                          >
                            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                          </Button>
                          {col.status === 'draft' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(col)}
                              disabled={deleteCol.isPending}
                              aria-label={`Delete ${col.title}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

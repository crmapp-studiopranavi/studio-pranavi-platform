/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  useTestimonialsCms,
  useCreateTestimonial,
  useUpdateTestimonial,
  useDeleteTestimonial,
  useApproveTestimonial,
} from '@/lib/hooks/use-testimonials-cms';
import type { CmsTestimonial } from '@/lib/types/cms';
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
import { PlusCircle, Pencil, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';

type FormState = {
  display_name: string;
  location_label: string;
  project_type: string;
  quote: string;
  rating: number | null;
  source_type: 'direct' | 'google' | 'email' | 'other';
  status: 'draft' | 'published';
  sort_order: number;
};

const DEFAULT_FORM: FormState = {
  display_name: '',
  location_label: '',
  project_type: '',
  quote: '',
  rating: null,
  source_type: 'direct',
  status: 'draft',
  sort_order: 0,
};

function StatusBadge({ status }: { status: CmsTestimonial['status'] }) {
  if (status === 'published')
    return <Badge className="bg-green-100 text-green-800">Published</Badge>;
  if (status === 'archived') return <Badge variant="secondary">Archived</Badge>;
  return <Badge variant="outline">Draft</Badge>;
}

function RatingStars({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-muted-foreground text-xs">—</span>;
  return (
    <span className="text-amber-500 text-sm">
      {'★'.repeat(rating)}
      {'☆'.repeat(5 - rating)}
    </span>
  );
}

export function CmsTestimonialsPage() {
  const { profile } = useAuth();
  const canWrite = profile?.role === 'admin' || profile?.role === 'manager';

  const { data: testimonials = [], isLoading, isError } = useTestimonialsCms();
  const createT = useCreateTestimonial();
  const updateT = useUpdateTestimonial();
  const deleteT = useDeleteTestimonial();
  const approveT = useApproveTestimonial();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);

  function openCreate() {
    setEditId(null);
    setForm(DEFAULT_FORM);
    setShowForm(true);
  }
  function openEdit(t: CmsTestimonial) {
    setEditId(t.id);
    setShowForm(true);
    setForm({
      display_name: t.display_name,
      location_label: t.location_label ?? '',
      project_type: t.project_type ?? '',
      quote: t.quote,
      rating: t.rating,
      source_type: (t.source_type as FormState['source_type']) ?? 'direct',
      status: t.status === 'archived' ? 'draft' : t.status,
      sort_order: t.sort_order,
    });
  }
  function cancelForm() {
    setShowForm(false);
    setEditId(null);
    setForm(DEFAULT_FORM);
  }
  function handleSubmit() {
    if (!form.display_name.trim() || !form.quote.trim()) return;
    const payload = {
      display_name: form.display_name.trim(),
      location_label: form.location_label || null,
      project_type: form.project_type || null,
      quote: form.quote.trim(),
      rating: form.rating,
      source_type: form.source_type,
      status: form.status,
      sort_order: form.sort_order,
      photo_id: null,
      consent_recorded_at: null,
    };
    if (editId) updateT.mutate({ id: editId, ...payload }, { onSuccess: cancelForm });
    else createT.mutate(payload as any, { onSuccess: cancelForm });
  }
  function handleDelete(t: CmsTestimonial) {
    if (!window.confirm(`Delete testimonial from "${t.display_name}"?`)) return;
    deleteT.mutate(t.id);
  }
  function handleApprove(t: CmsTestimonial) {
    if (
      !window.confirm(
        `Approve and publish this testimonial from "${t.display_name}"? This records consent.`
      )
    )
      return;
    approveT.mutate(t.id);
  }

  const isPending = createT.isPending || updateT.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Testimonials</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage client testimonials and reviews.
          </p>
        </div>
        {canWrite && (
          <Button size="sm" onClick={openCreate} className="gap-1.5">
            <PlusCircle className="h-4 w-4" aria-hidden="true" />
            Add Testimonial
          </Button>
        )}
      </div>

      {/* Consent warning */}
      <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
        <p>
          <strong>Consent required.</strong> Only publish testimonials where the client has
          explicitly given permission for their words and name to appear on the public website. Use
          the "Approve &amp; Publish" button to record consent timestamp. Never invent or paraphrase
          testimonials.
        </p>
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
              {editId ? 'Edit Testimonial' : 'New Testimonial'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="t_name">Display Name *</Label>
                <Input
                  id="t_name"
                  value={form.display_name}
                  onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
                  placeholder="e.g. Priya S."
                />
                <p className="text-[11px] text-muted-foreground">
                  Use first name + last initial only. No full names without explicit consent.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t_location">Location</Label>
                <Input
                  id="t_location"
                  value={form.location_label}
                  onChange={(e) => setForm((f) => ({ ...f, location_label: e.target.value }))}
                  placeholder="e.g. Mumbai"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t_project">Project Type</Label>
                <Input
                  id="t_project"
                  value={form.project_type}
                  onChange={(e) => setForm((f) => ({ ...f, project_type: e.target.value }))}
                  placeholder="e.g. Residential Interior"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t_rating">Rating (1–5)</Label>
                <select
                  id="t_rating"
                  value={form.rating ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      rating: e.target.value ? parseInt(e.target.value) : null,
                    }))
                  }
                  className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">No rating</option>
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} star{n !== 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="t_quote">Quote *</Label>
              <textarea
                id="t_quote"
                value={form.quote}
                onChange={(e) => setForm((f) => ({ ...f, quote: e.target.value }))}
                rows={4}
                placeholder="The client's exact words. Do not paraphrase."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="t_source">Source</Label>
                <select
                  id="t_source"
                  value={form.source_type}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      source_type: e.target.value as FormState['source_type'],
                    }))
                  }
                  className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="direct">Direct (verbal)</option>
                  <option value="email">Email</option>
                  <option value="google">Google Review</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t_sort">Sort Order</Label>
                <Input
                  id="t_sort"
                  type="number"
                  value={form.sort_order}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))
                  }
                />
              </div>
            </div>

            {(createT.isError || updateT.isError) && (
              <p className="text-sm text-destructive">Save failed. Please try again.</p>
            )}
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={isPending || !form.display_name.trim() || !form.quote.trim()}
                onClick={handleSubmit}
              >
                {isPending ? 'Saving…' : editId ? 'Save Changes' : 'Create Testimonial'}
              </Button>
              <Button size="sm" variant="outline" onClick={cancelForm}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isError && (
        <p className="text-sm text-destructive">Failed to load testimonials. Please try again.</p>
      )}

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      )}

      {!isLoading && testimonials.length === 0 && !showForm && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">No testimonials yet.</p>
            {canWrite && (
              <Button size="sm" variant="outline" className="mt-4" onClick={openCreate}>
                Add first testimonial
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {!isLoading && testimonials.length > 0 && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Testimonials">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Project</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Rating</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Consent</th>
                  {canWrite && (
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {testimonials.map((t) => (
                  <tr key={t.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium">{t.display_name}</div>
                      {t.location_label && (
                        <div className="text-xs text-muted-foreground">{t.location_label}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{t.project_type ?? '—'}</td>
                    <td className="px-4 py-3">
                      <RatingStars rating={t.rating} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-4 py-3">
                      {t.consent_recorded_at ? (
                        <span className="flex items-center gap-1 text-xs text-green-700">
                          <CheckCircle className="h-3 w-3" aria-hidden="true" />
                          {new Date(t.consent_recorded_at).toLocaleDateString('en-IN')}
                        </span>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-xs border-amber-400 text-amber-700"
                        >
                          Pending
                        </Badge>
                      )}
                    </td>
                    {canWrite && (
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEdit(t)}
                            aria-label={`Edit ${t.display_name}`}
                          >
                            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                          </Button>
                          {t.status === 'draft' && !t.consent_recorded_at && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-700 hover:bg-green-50 border-green-400 text-xs px-2"
                              onClick={() => handleApprove(t)}
                              disabled={approveT.isPending}
                              aria-label={`Approve ${t.display_name}`}
                            >
                              Approve &amp; Publish
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(t)}
                            disabled={deleteT.isPending}
                            aria-label={`Delete ${t.display_name}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </Button>
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

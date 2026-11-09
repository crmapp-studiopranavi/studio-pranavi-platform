import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  useCatalogueCategories,
  useCatalogueItems,
  useCreateCatalogueCategory,
  useUpdateCatalogueCategory,
  useDeleteCatalogueCategory,
  useCreateCatalogueItem,
  useUpdateCatalogueItem,
  useDeleteCatalogueItem,
} from '@/lib/hooks/use-catalogue';
import type { CatalogueCategory, CatalogueItem } from '@/lib/types/cms';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Badge,
  cn,
} from '@platform/ui';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, Pencil, Trash2, ChevronRight } from 'lucide-react';

function toSlug(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

type KV = { key: string; value: string };

type ItemForm = {
  name: string;
  slug: string;
  model_number: string;
  short_description: string;
  description: string;
  specs: KV[];
  is_downloadable: boolean;
  status: 'draft' | 'published';
  sort_order: number;
};

const DEFAULT_ITEM: ItemForm = {
  name: '',
  slug: '',
  model_number: '',
  short_description: '',
  description: '',
  specs: [
    { key: '', value: '' },
    { key: '', value: '' },
  ],
  is_downloadable: false,
  status: 'draft',
  sort_order: 0,
};

type CatForm = { name: string; slug: string; description: string; sort_order: number };
const DEFAULT_CAT: CatForm = { name: '', slug: '', description: '', sort_order: 0 };

export function CmsCataloguePage() {
  const { profile } = useAuth();
  const canWrite = profile?.role === 'admin' || profile?.role === 'manager';

  const { data: categories = [], isLoading: catsLoading } = useCatalogueCategories();
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const { data: items = [], isLoading: itemsLoading } = useCatalogueItems(
    selectedCatId ?? undefined
  );

  const createCat = useCreateCatalogueCategory();
  const updateCat = useUpdateCatalogueCategory();
  const deleteCat = useDeleteCatalogueCategory();
  const createItem = useCreateCatalogueItem();
  const updateItem = useUpdateCatalogueItem();
  const deleteItem = useDeleteCatalogueItem();

  // Category form state
  const [showCatForm, setShowCatForm] = useState(false);
  const [editCatId, setEditCatId] = useState<string | null>(null);
  const [catForm, setCatForm] = useState<CatForm>(DEFAULT_CAT);

  // Item form state
  const [showItemForm, setShowItemForm] = useState(false);
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState<ItemForm>(DEFAULT_ITEM);

  // Category CRUD
  function openCreateCat() {
    setEditCatId(null);
    setCatForm(DEFAULT_CAT);
    setShowCatForm(true);
  }
  function openEditCat(cat: CatalogueCategory) {
    setEditCatId(cat.id);
    setShowCatForm(true);
    setCatForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? '',
      sort_order: cat.sort_order,
    });
  }
  function cancelCatForm() {
    setShowCatForm(false);
    setEditCatId(null);
    setCatForm(DEFAULT_CAT);
  }
  function submitCat() {
    if (!catForm.name.trim()) return;
    const payload = {
      name: catForm.name.trim(),
      slug: catForm.slug || toSlug(catForm.name),
      description: catForm.description || null,
      sort_order: catForm.sort_order,
      parent_id: null,
      cover_image_id: null,
    };
    if (editCatId) updateCat.mutate({ id: editCatId, ...payload }, { onSuccess: cancelCatForm });
    else createCat.mutate(payload, { onSuccess: cancelCatForm });
  }
  function handleDeleteCat(cat: CatalogueCategory) {
    if (
      !window.confirm(
        `Delete category "${cat.name}"? All items in this category will also be deleted.`
      )
    )
      return;
    deleteCat.mutate(cat.id, {
      onSuccess: () => {
        if (selectedCatId === cat.id) setSelectedCatId(null);
      },
    });
  }

  // Item CRUD
  function openCreateItem() {
    if (!selectedCatId) return;
    setEditItemId(null);
    setItemForm(DEFAULT_ITEM);
    setShowItemForm(true);
  }
  function openEditItem(item: CatalogueItem) {
    setEditItemId(item.id);
    setShowItemForm(true);
    const specs: KV[] = Object.entries(item.specifications as Record<string, string>).map(
      ([k, v]) => ({ key: k, value: v })
    );
    if (specs.length === 0) specs.push({ key: '', value: '' }, { key: '', value: '' });
    setItemForm({
      name: item.name,
      slug: item.slug,
      model_number: item.model_number ?? '',
      short_description: item.short_description ?? '',
      description: item.description ?? '',
      specs,
      is_downloadable: item.is_downloadable,
      status: item.status === 'archived' ? 'draft' : item.status,
      sort_order: item.sort_order,
    });
  }
  function cancelItemForm() {
    setShowItemForm(false);
    setEditItemId(null);
    setItemForm(DEFAULT_ITEM);
  }
  function addSpecRow() {
    setItemForm((f) => ({ ...f, specs: [...f.specs, { key: '', value: '' }] }));
  }
  function updateSpec(i: number, field: 'key' | 'value', val: string) {
    setItemForm((f) => {
      const specs = [...f.specs];
      specs[i] = { ...specs[i], [field]: val };
      return { ...f, specs };
    });
  }
  function submitItem() {
    if (!itemForm.name.trim() || !selectedCatId) return;
    const specifications: Record<string, string> = {};
    itemForm.specs
      .filter((s) => s.key.trim())
      .forEach((s) => {
        specifications[s.key.trim()] = s.value.trim();
      });
    const payload = {
      category_id: selectedCatId,
      slug: itemForm.slug || toSlug(itemForm.name),
      name: itemForm.name.trim(),
      model_number: itemForm.model_number || null,
      short_description: itemForm.short_description || null,
      description: itemForm.description || null,
      specifications,
      cover_image_id: null,
      gallery_media_ids: [],
      catalogue_pdf_id: null,
      is_downloadable: itemForm.is_downloadable,
      status: itemForm.status,
      sort_order: itemForm.sort_order,
    };
    if (editItemId)
      updateItem.mutate({ id: editItemId, ...payload }, { onSuccess: cancelItemForm });
    else createItem.mutate(payload, { onSuccess: cancelItemForm });
  }
  function handleDeleteItem(item: CatalogueItem) {
    if (!window.confirm(`Delete "${item.name}"?`)) return;
    deleteItem.mutate(item.id);
  }

  const selectedCat = categories.find((c) => c.id === selectedCatId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Catalogue</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage product categories and catalogue items.
        </p>
      </div>

      {!canWrite && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Insufficient permissions — admin or manager role required to make changes.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Categories panel */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Categories</h2>
            {canWrite && (
              <Button
                size="sm"
                variant="outline"
                onClick={openCreateCat}
                className="h-7 gap-1 px-2 text-xs"
              >
                <PlusCircle className="h-3.5 w-3.5" aria-hidden="true" />
                Add
              </Button>
            )}
          </div>

          {showCatForm && canWrite && (
            <Card>
              <CardContent className="space-y-3 pt-4">
                <div className="space-y-1.5">
                  <Label htmlFor="cat_name" className="text-xs">
                    Name *
                  </Label>
                  <Input
                    id="cat_name"
                    value={catForm.name}
                    onChange={(e) =>
                      setCatForm((f) => ({
                        ...f,
                        name: e.target.value,
                        slug: f.slug || toSlug(e.target.value),
                      }))
                    }
                    placeholder="e.g. Pendants"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cat_slug" className="text-xs">
                    Slug
                  </Label>
                  <Input
                    id="cat_slug"
                    value={catForm.slug}
                    onChange={(e) => setCatForm((f) => ({ ...f, slug: toSlug(e.target.value) }))}
                    placeholder="pendants"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cat_sort" className="text-xs">
                    Sort Order
                  </Label>
                  <Input
                    id="cat_sort"
                    type="number"
                    value={catForm.sort_order}
                    onChange={(e) =>
                      setCatForm((f) => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))
                    }
                    className="w-20"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={createCat.isPending || updateCat.isPending || !catForm.name.trim()}
                    onClick={submitCat}
                  >
                    {createCat.isPending || updateCat.isPending
                      ? 'Saving…'
                      : editCatId
                        ? 'Save'
                        : 'Create'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={cancelCatForm}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {catsLoading && (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          )}

          {!catsLoading && categories.length === 0 && !showCatForm && (
            <p className="text-sm text-muted-foreground py-4">No categories yet.</p>
          )}

          <ul className="space-y-1" role="list" aria-label="Catalogue categories">
            {categories.map((cat) => (
              <li key={cat.id}>
                <div
                  className={cn(
                    'flex items-center justify-between rounded-md border px-3 py-2 cursor-pointer transition-colors',
                    selectedCatId === cat.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:bg-muted/40'
                  )}
                  onClick={() => setSelectedCatId(cat.id === selectedCatId ? null : cat.id)}
                  aria-selected={selectedCatId === cat.id}
                  role="option"
                >
                  <span className="text-sm font-medium flex items-center gap-1.5">
                    <ChevronRight
                      className={cn(
                        'h-3.5 w-3.5 transition-transform',
                        selectedCatId === cat.id && 'rotate-90'
                      )}
                      aria-hidden="true"
                    />
                    {cat.name}
                  </span>
                  {canWrite && (
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => openEditCat(cat)}
                        className="p-1 text-muted-foreground hover:text-foreground"
                        aria-label={`Edit ${cat.name}`}
                      >
                        <Pencil className="h-3 w-3" aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => handleDeleteCat(cat)}
                        className="p-1 text-muted-foreground hover:text-destructive"
                        aria-label={`Delete ${cat.name}`}
                      >
                        <Trash2 className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Items panel */}
        <div className="lg:col-span-2 space-y-4">
          {!selectedCatId ? (
            <div className="rounded-lg border border-dashed border-border p-12 text-center">
              <p className="text-sm text-muted-foreground">Select a category to view its items.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">
                  Items in <span className="text-primary">{selectedCat?.name}</span>
                </h2>
                {canWrite && (
                  <Button size="sm" onClick={openCreateItem} className="gap-1.5">
                    <PlusCircle className="h-4 w-4" aria-hidden="true" />
                    Add Item
                  </Button>
                )}
              </div>

              {showItemForm && canWrite && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {editItemId ? 'Edit Item' : 'New Item'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="item_name">Name *</Label>
                        <Input
                          id="item_name"
                          value={itemForm.name}
                          onChange={(e) =>
                            setItemForm((f) => ({
                              ...f,
                              name: e.target.value,
                              slug: f.slug || toSlug(e.target.value),
                            }))
                          }
                          placeholder="e.g. Lotus Pendant"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="item_model">Model Number</Label>
                        <Input
                          id="item_model"
                          value={itemForm.model_number}
                          onChange={(e) =>
                            setItemForm((f) => ({ ...f, model_number: e.target.value }))
                          }
                          placeholder="e.g. LP-001"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="item_slug">Slug</Label>
                      <Input
                        id="item_slug"
                        value={itemForm.slug}
                        onChange={(e) =>
                          setItemForm((f) => ({ ...f, slug: toSlug(e.target.value) }))
                        }
                        placeholder="auto-generated"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="item_short_desc">Short Description</Label>
                      <Input
                        id="item_short_desc"
                        value={itemForm.short_description}
                        onChange={(e) =>
                          setItemForm((f) => ({ ...f, short_description: e.target.value }))
                        }
                        placeholder="Brief listing description"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="item_desc">Description</Label>
                      <textarea
                        id="item_desc"
                        value={itemForm.description}
                        onChange={(e) =>
                          setItemForm((f) => ({ ...f, description: e.target.value }))
                        }
                        rows={3}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                        placeholder="Full product description"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Specifications</Label>
                      <div className="space-y-2">
                        {itemForm.specs.map((spec, i) => (
                          <div key={i} className="grid grid-cols-2 gap-2">
                            <Input
                              value={spec.key}
                              onChange={(e) => updateSpec(i, 'key', e.target.value)}
                              placeholder="e.g. Height"
                            />
                            <Input
                              value={spec.value}
                              onChange={(e) => updateSpec(i, 'value', e.target.value)}
                              placeholder="e.g. 450mm"
                            />
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={addSpecRow}
                        className="text-xs text-primary hover:underline"
                      >
                        + Add row
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="item_status">Status</Label>
                        <select
                          id="item_status"
                          value={itemForm.status}
                          onChange={(e) =>
                            setItemForm((f) => ({
                              ...f,
                              status: e.target.value as 'draft' | 'published',
                            }))
                          }
                          className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="item_sort">Sort Order</Label>
                        <Input
                          id="item_sort"
                          type="number"
                          value={itemForm.sort_order}
                          onChange={(e) =>
                            setItemForm((f) => ({
                              ...f,
                              sort_order: parseInt(e.target.value) || 0,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1.5 flex items-end pb-0.5">
                        <label className="flex cursor-pointer items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={itemForm.is_downloadable}
                            onChange={(e) =>
                              setItemForm((f) => ({ ...f, is_downloadable: e.target.checked }))
                            }
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          Downloadable PDF
                        </label>
                      </div>
                    </div>

                    {(createItem.isError || updateItem.isError) && (
                      <p className="text-sm text-destructive">
                        Save failed. Slug may already exist.
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={
                          createItem.isPending || updateItem.isPending || !itemForm.name.trim()
                        }
                        onClick={submitItem}
                      >
                        {createItem.isPending || updateItem.isPending
                          ? 'Saving…'
                          : editItemId
                            ? 'Save Changes'
                            : 'Create Item'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelItemForm}>
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {itemsLoading && (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              )}

              {!itemsLoading && items.length === 0 && !showItemForm && (
                <Card>
                  <CardContent className="py-10 text-center">
                    <p className="text-sm text-muted-foreground">No items in this category yet.</p>
                    {canWrite && (
                      <Button size="sm" variant="outline" className="mt-3" onClick={openCreateItem}>
                        Add first item
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}

              {!itemsLoading && items.length > 0 && (
                <Card>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm" aria-label="Catalogue items">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                            Name
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                            Model
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                            PDF
                          </th>
                          {canWrite && (
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                              Actions
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => (
                          <tr key={item.id} className="border-b border-border last:border-0">
                            <td className="px-4 py-3 font-medium">{item.name}</td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {item.model_number ?? '—'}
                            </td>
                            <td className="px-4 py-3">
                              {item.status === 'published' ? (
                                <Badge className="bg-green-100 text-green-800">Published</Badge>
                              ) : (
                                <Badge variant="outline">Draft</Badge>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {item.is_downloadable ? (
                                <Badge variant="secondary">Yes</Badge>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                            {canWrite && (
                              <td className="px-4 py-3">
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openEditItem(item)}
                                    aria-label={`Edit ${item.name}`}
                                  >
                                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-destructive hover:bg-destructive/10"
                                    onClick={() => handleDeleteItem(item)}
                                    disabled={deleteItem.isPending}
                                    aria-label={`Delete ${item.name}`}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}

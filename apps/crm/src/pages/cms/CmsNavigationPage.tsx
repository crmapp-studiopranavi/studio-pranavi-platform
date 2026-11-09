import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  useNavigationCms,
  useCreateNavItem,
  useUpdateNavItem,
  useDeleteNavItem,
} from '@/lib/hooks/use-navigation-cms';
import type { NavigationItem, NavGroup } from '@/lib/types/cms';
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
import { PlusCircle, Pencil, Trash2, AlertTriangle } from 'lucide-react';

const NAV_GROUPS: { value: NavGroup; label: string }[] = [
  { value: 'main', label: 'Main Nav' },
  { value: 'footer', label: 'Footer' },
  { value: 'mobile', label: 'Mobile' },
];

type FormState = {
  label: string;
  url: string;
  nav_group: NavGroup;
  sort_order: number;
  opens_in_new_tab: boolean;
  is_visible: boolean;
  parent_id: string | null;
};

const DEFAULT_FORM: FormState = {
  label: '',
  url: '',
  nav_group: 'main',
  sort_order: 0,
  opens_in_new_tab: false,
  is_visible: true,
  parent_id: null,
};

function NavTable({
  group,
  canWrite,
  onEdit,
  onDelete,
}: {
  group: NavGroup;
  canWrite: boolean;
  onEdit: (item: NavigationItem) => void;
  onDelete: (item: NavigationItem) => void;
}) {
  const { data: items = [], isLoading, isError } = useNavigationCms(group);
  if (isLoading)
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  if (isError) return <p className="text-sm text-destructive">Failed to load navigation items.</p>;
  if (items.length === 0)
    return <p className="py-4 text-sm text-muted-foreground">No items in this group yet.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" aria-label={`${group} navigation items`}>
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Label</th>
            <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Href</th>
            <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Order</th>
            <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Visible</th>
            {canWrite && (
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Actions</th>
            )}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-border last:border-0">
              <td className="px-4 py-2.5 font-medium">
                {item.parent_id && <span className="mr-1 text-muted-foreground">↳</span>}
                {item.label}
                {item.opens_in_new_tab && (
                  <Badge variant="outline" className="ml-1.5 text-[10px]">
                    ext
                  </Badge>
                )}
              </td>
              <td className="px-4 py-2.5 text-muted-foreground">
                <code className="rounded bg-muted px-1 text-xs">{item.url}</code>
              </td>
              <td className="px-4 py-2.5 text-muted-foreground">{item.sort_order}</td>
              <td className="px-4 py-2.5">
                {item.is_visible ? (
                  <Badge className="bg-green-100 text-green-800">Yes</Badge>
                ) : (
                  <Badge variant="outline">Hidden</Badge>
                )}
              </td>
              {canWrite && (
                <td className="px-4 py-2.5">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(item)}
                      aria-label={`Edit ${item.label}`}
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => onDelete(item)}
                      aria-label={`Delete ${item.label}`}
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
  );
}

export function CmsNavigationPage() {
  const { profile } = useAuth();
  const canWrite = profile?.role === 'admin' || profile?.role === 'manager';

  const [activeGroup, setActiveGroup] = useState<NavGroup>('main');
  const createNav = useCreateNavItem();
  const updateNav = useUpdateNavItem();
  const deleteNav = useDeleteNavItem();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);

  function openCreate() {
    setEditId(null);
    setForm({ ...DEFAULT_FORM, nav_group: activeGroup });
    setShowForm(true);
  }
  function openEdit(item: NavigationItem) {
    setEditId(item.id);
    setForm({
      label: item.label,
      url: item.url,
      nav_group: item.nav_group,
      sort_order: item.sort_order,
      opens_in_new_tab: item.opens_in_new_tab,
      is_visible: item.is_visible,
      parent_id: item.parent_id,
    });
    setShowForm(true);
  }
  function cancelForm() {
    setShowForm(false);
    setEditId(null);
    setForm(DEFAULT_FORM);
  }
  function handleSubmit() {
    if (!form.label.trim() || !form.url.trim()) return;
    const payload = {
      label: form.label.trim(),
      url: form.url.trim(),
      nav_group: form.nav_group,
      sort_order: form.sort_order,
      opens_in_new_tab: form.opens_in_new_tab,
      is_visible: form.is_visible,
      parent_id: form.parent_id,
    };
    if (editId) updateNav.mutate({ id: editId, ...payload }, { onSuccess: cancelForm });
    else createNav.mutate(payload, { onSuccess: cancelForm });
  }
  function handleDelete(item: NavigationItem) {
    if (!window.confirm(`Delete navigation item "${item.label}"?`)) return;
    deleteNav.mutate(item.id);
  }

  const isPending = createNav.isPending || updateNav.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Navigation</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage website navigation menus.</p>
        </div>
        {canWrite && (
          <Button size="sm" onClick={openCreate} className="gap-1.5">
            <PlusCircle className="h-4 w-4" aria-hidden="true" />
            Add Item
          </Button>
        )}
      </div>

      <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />
        <p>
          The live website header uses a hardcoded navigation component (
          <code className="bg-blue-100 px-1 rounded text-xs">SiteHeader.tsx</code>). Items you add
          here update the database but will only appear on the public site once the website is
          updated to read navigation dynamically from this table.
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
              {editId ? 'Edit Navigation Item' : 'New Navigation Item'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="nav_label">Label *</Label>
                <Input
                  id="nav_label"
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                  placeholder="e.g. About"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nav_url">Href *</Label>
                <Input
                  id="nav_url"
                  value={form.url}
                  onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                  placeholder="e.g. /about"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nav_group">Group</Label>
                <select
                  id="nav_group"
                  value={form.nav_group}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, nav_group: e.target.value as NavGroup }))
                  }
                  className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {NAV_GROUPS.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nav_sort">Sort Order</Label>
                <Input
                  id="nav_sort"
                  type="number"
                  value={form.sort_order}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))
                  }
                />
              </div>
            </div>
            <div className="flex gap-6">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.opens_in_new_tab}
                  onChange={(e) => setForm((f) => ({ ...f, opens_in_new_tab: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300"
                />
                External link
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_visible}
                  onChange={(e) => setForm((f) => ({ ...f, is_visible: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300"
                />
                Visible
              </label>
            </div>
            {(createNav.isError || updateNav.isError) && (
              <p className="text-sm text-destructive">Save failed. Please try again.</p>
            )}
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={isPending || !form.label.trim() || !form.url.trim()}
                onClick={handleSubmit}
              >
                {isPending ? 'Saving…' : editId ? 'Save Changes' : 'Add Item'}
              </Button>
              <Button size="sm" variant="outline" onClick={cancelForm}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div>
        <div
          className="flex gap-1 border-b border-border mb-4"
          role="tablist"
          aria-label="Navigation groups"
        >
          {NAV_GROUPS.map((g) => (
            <button
              key={g.value}
              role="tab"
              aria-selected={activeGroup === g.value}
              onClick={() => setActiveGroup(g.value)}
              className={cn(
                'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
                activeGroup === g.value
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {g.label}
            </button>
          ))}
        </div>
        <Card>
          <CardContent className="pt-0">
            <NavTable
              group={activeGroup}
              canWrite={canWrite}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

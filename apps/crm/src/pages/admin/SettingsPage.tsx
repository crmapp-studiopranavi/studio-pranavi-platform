/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useTeamMembers, useUpdateProfile } from '@/lib/hooks/use-team';
import {
  useServicesAdmin,
  useCreateService,
  useUpdateService,
} from '@/lib/hooks/use-services-admin';
import { formatDate, formatDateTime } from '@/lib/format';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Badge,
} from '@platform/ui';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@platform/ui';

// ── Tabs ──────────────────────────────────────────────────────────────────────

type Tab = 'general' | 'team' | 'services' | 'activity';

const TABS: { id: Tab; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'team', label: 'Team Members' },
  { id: 'services', label: 'Services' },
  { id: 'activity', label: 'Activity Log' },
];

// ── General tab ───────────────────────────────────────────────────────────────

const settingsSchema = z.object({
  business_name: z.string().min(1, 'Business name is required'),
  legal_name: z.string().nullable().optional(),
  gstin: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email('Invalid email').nullable().or(z.literal('')).optional(),
  whatsapp_number: z.string().nullable().optional(),
  default_currency: z.string().length(3, 'Must be 3 letters').default('INR'),
  timezone: z.string().min(1, 'Required').default('Asia/Kolkata'),
  quotation_prefix: z.string().min(1, 'Required').default('QT'),
  order_prefix: z.string().min(1, 'Required').default('ORD'),
  invoice_prefix: z.string().min(1, 'Required').default('INV'),
  default_tax_rate: z.coerce.number().min(0).max(1).default(0.18),
  quote_validity_days: z.coerce.number().int().min(1).default(15),
});

type SettingsForm = z.infer<typeof settingsSchema>;

function useBusinessSettings() {
  return useQuery({
    queryKey: ['business-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_settings')
        .select('*')
        .limit(1)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

function useUpdateBusinessSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: SettingsForm) => {
      const { error } = await supabase
        .from('business_settings')
        .update({
          business_name: values.business_name,
          legal_name: values.legal_name ?? null,
          gstin: values.gstin ?? null,
          phone: values.phone ?? null,
          email: values.email || null,
          whatsapp_number: values.whatsapp_number ?? null,
          default_currency: values.default_currency,
          timezone: values.timezone,
          quotation_prefix: values.quotation_prefix,
          order_prefix: values.order_prefix,
          invoice_prefix: values.invoice_prefix,
          default_tax_rate: values.default_tax_rate,
          quote_validity_days: values.quote_validity_days,
        })
        .eq(
          'id',
          (await supabase.from('business_settings').select('id').limit(1).single()).data!.id
        );
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['business-settings'] });
    },
  });
}

function GeneralTab() {
  const { data: settings, isLoading, isError } = useBusinessSettings();
  const update = useUpdateBusinessSettings();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<SettingsForm>({ resolver: zodResolver(settingsSchema) });

  useEffect(() => {
    if (settings) {
      reset({
        business_name: settings.business_name,
        legal_name: settings.legal_name ?? '',
        gstin: settings.gstin ?? '',
        phone: settings.phone ?? '',
        email: settings.email ?? '',
        whatsapp_number: settings.whatsapp_number ?? '',
        default_currency: settings.default_currency,
        timezone: settings.timezone,
        quotation_prefix: settings.quotation_prefix,
        order_prefix: settings.order_prefix,
        invoice_prefix: settings.invoice_prefix,
        default_tax_rate: settings.default_tax_rate,
        quote_validity_days: settings.quote_validity_days,
      });
    }
  }, [settings, reset]);

  if (isLoading) {
    return (
      <div className="max-w-2xl space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }
  if (isError) {
    return <p className="text-sm text-destructive">Failed to load settings.</p>;
  }

  return (
    <form onSubmit={handleSubmit((v) => update.mutate(v))} className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Business Identity</CardTitle>
          <CardDescription>Name and registration details shown on documents.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="business_name">Business Name *</Label>
            <Input id="business_name" {...register('business_name')} />
            {errors.business_name && (
              <p className="text-xs text-destructive">{errors.business_name.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="legal_name">Legal / Registered Name</Label>
            <Input id="legal_name" {...register('legal_name')} placeholder="Optional" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gstin">GSTIN</Label>
            <Input
              id="gstin"
              {...register('gstin')}
              placeholder="Optional — not used for GST filing"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...register('phone')} placeholder="+91 XXXXX XXXXX" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
              <Input
                id="whatsapp_number"
                {...register('whatsapp_number')}
                placeholder="91XXXXXXXXXX"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Document Numbers</CardTitle>
          <CardDescription>
            Prefix for new quotes, orders, and invoices. Existing documents are not affected.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="quotation_prefix">Quote Prefix</Label>
              <Input id="quotation_prefix" {...register('quotation_prefix')} placeholder="QT" />
              {errors.quotation_prefix && (
                <p className="text-xs text-destructive">{errors.quotation_prefix.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="order_prefix">Order Prefix</Label>
              <Input id="order_prefix" {...register('order_prefix')} placeholder="ORD" />
              {errors.order_prefix && (
                <p className="text-xs text-destructive">{errors.order_prefix.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invoice_prefix">Invoice Prefix</Label>
              <Input id="invoice_prefix" {...register('invoice_prefix')} placeholder="INV" />
              {errors.invoice_prefix && (
                <p className="text-xs text-destructive">{errors.invoice_prefix.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Defaults</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="default_currency">Currency</Label>
              <Input
                id="default_currency"
                {...register('default_currency')}
                placeholder="INR"
                maxLength={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="default_tax_rate">Default Tax Rate</Label>
              <Input
                id="default_tax_rate"
                type="number"
                step="0.01"
                min="0"
                max="1"
                {...register('default_tax_rate')}
                placeholder="0.18"
              />
              <p className="text-[11px] text-muted-foreground">0.18 = 18% GST</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="quote_validity_days">Quote Valid (days)</Label>
              <Input
                id="quote_validity_days"
                type="number"
                min="1"
                {...register('quote_validity_days')}
                placeholder="15"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="timezone">Timezone</Label>
            <Input id="timezone" {...register('timezone')} placeholder="Asia/Kolkata" />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={update.isPending || !isDirty}>
          {update.isPending ? 'Saving…' : 'Save Changes'}
        </Button>
        {update.isSuccess && <p className="text-sm text-green-600">Settings saved.</p>}
        {update.isError && (
          <p className="text-sm text-destructive">Save failed. Please try again.</p>
        )}
      </div>
    </form>
  );
}

// ── Team tab ──────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  manager: 'Manager',
  sales: 'Sales',
  operations: 'Operations',
  viewer: 'Viewer (Read Only)',
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  admin: 'Full access, manage users',
  manager: 'Manage operations and approvals',
  sales: 'Leads, customers, quotes',
  operations: 'Orders, projects, installation',
  viewer: 'Read-only access',
};

const ALL_ROLES = ['admin', 'manager', 'sales', 'operations', 'viewer'] as const;

function TeamTab() {
  const { profile: currentProfile } = useAuth();
  const { data: members, isLoading, isError } = useTeamMembers();
  const updateProfile = useUpdateProfile();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }
  if (isError) {
    return <p className="text-sm text-destructive">Failed to load team members.</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Team Members</h2>
        <p className="text-sm text-muted-foreground">Manage your team's access and roles.</p>
      </div>

      {/* Add user notice */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
          Adding a new team member
        </p>
        <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
          Create their account in <strong>Supabase Authentication → Users → Add user</strong>. Once
          they sign in for the first time, they'll appear here and you can assign their role and
          activate their account.
        </p>
      </div>

      {members && members.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-foreground">No team members yet.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Last Seen
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members?.map((member) => {
                  const isSelf = member.id === currentProfile?.id;
                  return (
                    <tr key={member.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-medium">{member.full_name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{member.email}</td>
                      <td className="px-4 py-3">
                        <select
                          value={member.role}
                          disabled={isSelf || updateProfile.isPending}
                          onChange={(e) =>
                            updateProfile.mutate({
                              userId: member.id,
                              update: { role: e.target.value as any },
                            })
                          }
                          className="rounded border border-border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label={`Role for ${member.full_name}`}
                        >
                          {ALL_ROLES.map((r) => (
                            <option key={r} value={r} title={ROLE_DESCRIPTIONS[r]}>
                              {ROLE_LABELS[r]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        {member.is_active ? (
                          <Badge
                            variant="default"
                            className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                          >
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {member.last_seen_at ? formatDate(member.last_seen_at) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant={member.is_active ? 'outline' : 'default'}
                          disabled={isSelf || updateProfile.isPending}
                          onClick={() =>
                            updateProfile.mutate({
                              userId: member.id,
                              update: { is_active: !member.is_active },
                            })
                          }
                        >
                          {member.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

// ── Services tab ──────────────────────────────────────────────────────────────

const SERVICE_CATEGORIES = [
  'Glass',
  'Lighting',
  'Service',
  'Installation',
  'Consultation',
  'Other',
];

function ServicesTab() {
  const { data: services, isLoading, isError } = useServicesAdmin();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Glass');
  const [newDescription, setNewDescription] = useState('');
  const [newSortOrder, setNewSortOrder] = useState(0);

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    const slug = newTitle
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    createService.mutate(
      {
        slug,
        title: newTitle.trim(),
        category: newCategory,
        short_description: newDescription.trim() || newTitle.trim(),
        status: 'draft',
        sort_order: newSortOrder,
        features: [],
        faqs: [],
      },
      {
        onSuccess: () => {
          setShowForm(false);
          setNewTitle('');
          setNewDescription('');
          setNewSortOrder(0);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }
  if (isError) {
    return <p className="text-sm text-destructive">Failed to load services.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Services</h2>
          <p className="text-sm text-muted-foreground">
            Manage the services shown on your public website.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add Service'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New Service</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="svc_title">Title *</Label>
                <Input
                  id="svc_title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Decorative Glass"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="svc_category">Category *</Label>
                <select
                  id="svc_category"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {SERVICE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="svc_desc">Short Description</Label>
              <Input
                id="svc_desc"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Brief description for listings"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="svc_sort">Sort Order</Label>
              <Input
                id="svc_sort"
                type="number"
                value={newSortOrder}
                onChange={(e) => setNewSortOrder(parseInt(e.target.value) || 0)}
                className="w-24"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Slug:{' '}
              <code className="rounded bg-muted px-1">
                {newTitle
                  .toLowerCase()
                  .replace(/\s+/g, '-')
                  .replace(/[^a-z0-9-]/g, '') || 'auto-generated'}
              </code>
              . New services are saved as <strong>Draft</strong> — publish from this table.
            </p>
            <Button
              size="sm"
              disabled={!newTitle.trim() || createService.isPending}
              onClick={handleCreate}
            >
              {createService.isPending ? 'Creating…' : 'Create Service'}
            </Button>
            {createService.isError && (
              <p className="text-xs text-destructive">Failed to create. Slug may already exist.</p>
            )}
          </CardContent>
        </Card>
      )}

      {services && services.length === 0 && !showForm ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-foreground">No services yet. Add one above.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Sort Order
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {services?.map((svc) => (
                  <tr key={svc.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{svc.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">{svc.category}</td>
                    <td className="px-4 py-3">
                      {svc.status === 'published' ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                          Published
                        </Badge>
                      ) : svc.status === 'archived' ? (
                        <Badge variant="secondary">Archived</Badge>
                      ) : (
                        <Badge variant="outline">Draft</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{svc.sort_order}</td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={updateService.isPending}
                        onClick={() =>
                          updateService.mutate({
                            id: svc.id,
                            update: {
                              status: svc.status === 'published' ? 'draft' : 'published',
                            },
                          })
                        }
                      >
                        {svc.status === 'published' ? 'Unpublish' : 'Publish'}
                      </Button>
                    </td>
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

// ── Activity tab ──────────────────────────────────────────────────────────────

const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  note: 'Note',
  call: 'Call',
  email: 'Email',
  meeting: 'Meeting',
  task: 'Task',
  site_visit: 'Site Visit',
  status_change: 'Status Change',
  quote_sent: 'Quote Sent',
  payment: 'Payment',
  system: 'System',
};

function useRecentActivity() {
  return useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activities')
        .select('id, activity_type, subject, occurred_at, actor:profiles!actor_id(full_name)')
        .order('occurred_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
}

function ActivityTab() {
  const { data: activities, isLoading, isError } = useRecentActivity();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }
  if (isError) {
    return <p className="text-sm text-destructive">Failed to load activity log.</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Activity Log</h2>
        <p className="text-sm text-muted-foreground">
          Recent system activity across all records (last 50 entries).
        </p>
      </div>

      {activities && activities.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Date / Time
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actor</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody>
                {activities?.map((act) => {
                  const actor = (act as any).actor as { full_name: string } | null;
                  return (
                    <tr key={act.id} className="border-b border-border last:border-0">
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {formatDateTime(act.occurred_at)}
                      </td>
                      <td className="px-4 py-3">{actor?.full_name ?? '—'}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="whitespace-nowrap">
                          {ACTIVITY_TYPE_LABELS[act.activity_type] ?? act.activity_type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{act.subject ?? '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

// ── Page shell ────────────────────────────────────────────────────────────────

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('general');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your business, team, services, and activity.
        </p>
      </div>

      {/* Tab bar */}
      <div className="border-b border-border">
        <nav className="-mb-px flex gap-6" aria-label="Settings sections">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'whitespace-nowrap border-b-2 pb-3 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
              )}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'general' && <GeneralTab />}
        {activeTab === 'team' && <TeamTab />}
        {activeTab === 'services' && <ServicesTab />}
        {activeTab === 'activity' && <ActivityTab />}
      </div>
    </div>
  );
}

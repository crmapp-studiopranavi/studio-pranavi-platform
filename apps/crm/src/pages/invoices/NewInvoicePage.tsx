/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateInvoice } from '@/lib/hooks/use-invoices';
import { supabase } from '@/lib/supabase';

const today = new Date().toISOString().split('T')[0];

const schema = z
  .object({
    customerId: z.string().uuid('Customer is required'),
    orderId: z.string().optional(),
    projectId: z.string().optional(),
    issueDate: z.string().min(1, 'Issue date is required'),
    dueDate: z.string().min(1, 'Due date is required'),
    notes: z.string().optional(),
  })
  .refine((d) => d.dueDate >= d.issueDate, {
    message: 'Due date must be on or after issue date',
    path: ['dueDate'],
  });

type FormValues = z.infer<typeof schema>;

export function NewInvoicePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const createInvoice = useCreateInvoice();

  const preCustomerId = searchParams.get('customerId') ?? '';
  const preOrderId = searchParams.get('orderId') ?? '';
  const preProjectId = searchParams.get('projectId') ?? '';

  const [customers, setCustomers] = useState<{ id: string; display_name: string }[]>([]);
  const [orders, setOrders] = useState<{ id: string; order_number: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string; project_number: string; name: string }[]>(
    []
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      issueDate: today,
      dueDate: today,
      customerId: preCustomerId,
      orderId: preOrderId,
      projectId: preProjectId,
    },
  });

  const selectedCustomerId = watch('customerId');

  useEffect(() => {
    void supabase
      .from('customers')
      .select('id, display_name')
      .is('archived_at', null)
      .order('display_name')
      .then(({ data }) => setCustomers(data ?? []));
  }, []);

  useEffect(() => {
    const cid = selectedCustomerId || preCustomerId;
    if (!cid) {
      setOrders([]);
      setProjects([]);
      return;
    }
    void supabase
      .from('orders')
      .select('id, order_number')
      .eq('customer_id', cid)
      .is('archived_at', null)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setOrders(data ?? []);
        if (preOrderId && data?.some((o) => o.id === preOrderId)) {
          setValue('orderId', preOrderId);
        }
      });
    void supabase
      .from('projects')
      .select('id, project_number, name')
      .eq('customer_id', cid)
      .is('archived_at', null)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setProjects(data ?? []);
        if (preProjectId && data?.some((p) => p.id === preProjectId)) {
          setValue('projectId', preProjectId);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCustomerId]);

  const onSubmit = async (values: FormValues) => {
    const result = await createInvoice.mutateAsync({
      customerId: values.customerId,
      orderId: values.orderId || undefined,
      projectId: values.projectId || undefined,
      issueDate: values.issueDate,
      dueDate: values.dueDate,
      notes: values.notes || undefined,
    });
    navigate(`/invoices/${result.invoice_id}`);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link to="/invoices" className="hover:underline">
            Invoices
          </Link>
          <span>/</span>
          <span>New Invoice</span>
        </div>
        <h1 className="text-2xl font-semibold">New Invoice</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Customer */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Customer <span className="text-destructive">*</span>
          </label>
          <select
            {...register('customerId')}
            className="w-full rounded border border-border px-3 py-2 text-sm bg-background"
          >
            <option value="">Select customer…</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.display_name}
              </option>
            ))}
          </select>
          {errors.customerId && (
            <p className="mt-1 text-xs text-destructive">{errors.customerId.message}</p>
          )}
        </div>

        {/* Linked Order */}
        <div>
          <label className="block text-sm font-medium mb-1">Linked Order (optional)</label>
          <select
            {...register('orderId')}
            disabled={!selectedCustomerId}
            className="w-full rounded border border-border px-3 py-2 text-sm bg-background disabled:opacity-50"
          >
            <option value="">None</option>
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.order_number}
              </option>
            ))}
          </select>
        </div>

        {/* Linked Project */}
        <div>
          <label className="block text-sm font-medium mb-1">Linked Project (optional)</label>
          <select
            {...register('projectId')}
            disabled={!selectedCustomerId}
            className="w-full rounded border border-border px-3 py-2 text-sm bg-background disabled:opacity-50"
          >
            <option value="">None</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.project_number} — {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Issue Date <span className="text-destructive">*</span>
            </label>
            <input
              type="date"
              {...register('issueDate')}
              className="w-full rounded border border-border px-3 py-2 text-sm bg-background"
            />
            {errors.issueDate && (
              <p className="mt-1 text-xs text-destructive">{errors.issueDate.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Due Date <span className="text-destructive">*</span>
            </label>
            <input
              type="date"
              {...register('dueDate')}
              className="w-full rounded border border-border px-3 py-2 text-sm bg-background"
            />
            {errors.dueDate && (
              <p className="mt-1 text-xs text-destructive">{errors.dueDate.message}</p>
            )}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-1">Notes (optional)</label>
          <textarea
            {...register('notes')}
            rows={3}
            className="w-full rounded border border-border px-3 py-2 text-sm bg-background resize-none"
            placeholder="Payment terms, special instructions…"
          />
        </div>

        {createInvoice.error && (
          <p className="text-sm text-destructive">
            {(createInvoice.error as any)?.message ?? 'Failed to create invoice'}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting || createInvoice.isPending}
            className="rounded bg-primary px-5 py-2 text-sm text-primary-foreground disabled:opacity-50"
          >
            {createInvoice.isPending ? 'Creating…' : 'Create Invoice'}
          </button>
          <Link
            to="/invoices"
            className="rounded border border-border px-5 py-2 text-sm hover:bg-muted"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

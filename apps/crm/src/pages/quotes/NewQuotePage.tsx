import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateQuote } from '@/lib/hooks/use-quotes';
import { useCustomers } from '@/lib/hooks/use-customers';
import { useAuth } from '@/lib/auth-context';

const schema = z.object({
  customerId: z.string().uuid('Select a customer'),
  issueDate: z.string().min(1, 'Issue date required'),
  validUntil: z.string().min(1, 'Validity date required'),
  terms: z.string().optional(),
  customerNotes: z.string().optional(),
  internalNotes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function NewQuotePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile } = useAuth();
  const createQuote = useCreateQuote();
  const [customerSearch, setCustomerSearch] = useState('');
  const { data: customersData } = useCustomers({ search: customerSearch });

  const prefilledCustomerId = searchParams.get('customerId') ?? '';
  const prefilledLeadId = searchParams.get('leadId') ?? '';

  const today = new Date().toISOString().slice(0, 10);
  const thirtyDays = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerId: prefilledCustomerId,
      issueDate: today,
      validUntil: thirtyDays,
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const result = await createQuote.mutateAsync({
        customerId: data.customerId,
        leadId: prefilledLeadId || null,
        issueDate: data.issueDate,
        validUntil: data.validUntil,
        ownerId: profile?.id ?? null,
        terms: data.terms || null,
        customerNotes: data.customerNotes || null,
        internalNotes: data.internalNotes || null,
      });
      navigate(`/quotes/${result.quote_id}`);
    } catch (err) {
      setError('root', { message: err instanceof Error ? err.message : 'Failed to create quote' });
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/quotes" className="hover:underline">
          Quotations
        </Link>
        <span>/</span>
        <span>New Quote</span>
      </div>

      <h1 className="mb-6 text-2xl font-semibold">New Quotation</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Customer */}
        <div>
          <label className="mb-1 block text-sm font-medium">Customer</label>
          {prefilledCustomerId ? (
            <div className="rounded border border-border bg-muted/30 px-3 py-2 text-sm">
              {(customersData?.customers ?? []).find((c) => c.id === prefilledCustomerId)
                ?.display_name ?? prefilledCustomerId}
              <input type="hidden" {...register('customerId')} value={prefilledCustomerId} />
            </div>
          ) : (
            <>
              <input
                type="search"
                placeholder="Search customers…"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="mb-1 block w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
              />
              <select
                {...register('customerId')}
                size={4}
                className="block w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
              >
                <option value="">— Select a customer —</option>
                {(customersData?.customers ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.display_name}
                  </option>
                ))}
              </select>
            </>
          )}
          {errors.customerId && (
            <p className="mt-1 text-xs text-destructive">{errors.customerId.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Issue Date</label>
            <input
              type="date"
              {...register('issueDate')}
              className="block w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
            />
            {errors.issueDate && (
              <p className="mt-1 text-xs text-destructive">{errors.issueDate.message}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Valid Until</label>
            <input
              type="date"
              {...register('validUntil')}
              className="block w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
            />
            {errors.validUntil && (
              <p className="mt-1 text-xs text-destructive">{errors.validUntil.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Terms & Conditions</label>
          <textarea
            {...register('terms')}
            rows={3}
            placeholder="Payment terms, delivery conditions…"
            className="block w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Customer Notes</label>
          <textarea
            {...register('customerNotes')}
            rows={2}
            placeholder="Notes visible on the customer-facing quote…"
            className="block w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Internal Notes{' '}
            <span className="text-muted-foreground font-normal">(not shown to customer)</span>
          </label>
          <textarea
            {...register('internalNotes')}
            rows={2}
            placeholder="Internal comments for the team…"
            className="block w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
          />
        </div>

        {errors.root && (
          <p className="rounded bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errors.root.message}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded bg-primary px-5 py-2 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting ? 'Creating…' : 'Create Quote'}
          </button>
          <Link
            to="/quotes"
            className="rounded border border-border px-5 py-2 text-sm hover:bg-muted"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

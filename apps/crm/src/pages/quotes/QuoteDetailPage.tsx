import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useQuoteDetail,
  useQuoteVersions,
  useQuoteItems,
  useQuoteActivities,
  useAddQuoteItem,
  useDeleteQuoteItem,
  useRecalculateVersionTotals,
} from '@/lib/hooks/use-quote-detail';
import {
  useSendQuote,
  useAcceptQuote,
  useRejectQuote,
  useReviseQuote,
} from '@/lib/hooks/use-quotes';
import { useCreateOrderFromQuote } from '@/lib/hooks/use-orders';
import { QuoteStatusBadge } from '@/components/quotes/QuoteStatusBadge';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format';
import { calcLineItem, pctToRate, inrToMinor } from '@/lib/quote-calculations';

/* eslint-disable @typescript-eslint/no-explicit-any */

// ---- Add item form schema ----
const itemSchema = z.object({
  itemType: z.enum(['material', 'labour', 'installation', 'transport', 'discount', 'other']),
  title: z.string().min(1, 'Title required'),
  description: z.string().optional(),
  quantity: z.coerce.number().positive('Must be > 0'),
  unit: z.string().min(1, 'Unit required'),
  unitPriceInr: z.coerce.number().min(0),
  discountPct: z.coerce.number().min(0).max(100),
  taxPct: z.coerce.number().min(0).max(100),
});
type ItemFormData = z.infer<typeof itemSchema>;

// ---- Action confirm helpers ----
function useConfirm() {
  const [pending, setPending] = useState<(() => Promise<void>) | null>(null);
  const ask = (fn: () => Promise<void>) => setPending(() => fn);
  const confirm = async () => {
    if (pending) await pending();
    setPending(null);
  };
  const cancel = () => setPending(null);
  return { confirming: !!pending, ask, confirm, cancel };
}

export function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: quote, isLoading, error } = useQuoteDetail(id ?? '');
  const { data: versions } = useQuoteVersions(id ?? '');
  const { data: activities } = useQuoteActivities(id ?? '');

  const cv = (quote as any)?.current_version as {
    id: string;
    version_number: number;
    sent_at: string | null;
    issue_date: string;
    valid_until: string;
    subtotal_minor: number;
    discount_minor: number;
    tax_minor: number;
    total_minor: number;
    terms: string | null;
    customer_notes: string | null;
    internal_notes: string | null;
  } | null;

  const { data: items } = useQuoteItems(cv?.id);
  const isSent = !!cv?.sent_at;
  const isDraftable =
    !isSent && ['draft', 'internal_review'].includes((quote as any)?.status ?? '');

  const addItem = useAddQuoteItem();
  const deleteItem = useDeleteQuoteItem();
  const recalculate = useRecalculateVersionTotals();
  const sendQuote = useSendQuote();
  const acceptQuote = useAcceptQuote();
  const rejectQuote = useRejectQuote();
  const reviseQuote = useReviseQuote();
  const createOrder = useCreateOrderFromQuote();

  const [showAddItem, setShowAddItem] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const sendConfirm = useConfirm();
  const acceptConfirm = useConfirm();
  const rejectConfirm = useConfirm();
  const reviseConfirm = useConfirm();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors: itemErrors },
  } = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      itemType: 'material',
      quantity: 1,
      unit: 'nos',
      discountPct: 0,
      taxPct: 18,
    },
  });

  const watchedFields = watch();
  const preview = (() => {
    const qty = Number(watchedFields.quantity) || 0;
    const price = inrToMinor(Number(watchedFields.unitPriceInr) || 0);
    const disc = pctToRate(Number(watchedFields.discountPct) || 0);
    const tax = pctToRate(Number(watchedFields.taxPct) || 0);
    return calcLineItem(qty, price, disc, tax);
  })();

  const onAddItem = async (data: ItemFormData) => {
    if (!cv || !id) return;
    const lineNumber = (items?.length ?? 0) + 1;
    const unitPriceMinor = inrToMinor(data.unitPriceInr);
    const discRate = pctToRate(data.discountPct);
    const taxRate = pctToRate(data.taxPct);
    const calc = calcLineItem(data.quantity, unitPriceMinor, discRate, taxRate);
    await addItem.mutateAsync({
      versionId: cv.id,
      quoteId: id,
      lineNumber,
      itemType: data.itemType,
      title: data.title,
      description: data.description || null,
      quantity: data.quantity,
      unit: data.unit,
      unitPriceMinor,
      discountRate: discRate,
      taxRate,
      sortOrder: lineNumber,
      lineSubtotalMinor: calc.lineSubtotalMinor,
      lineDiscountMinor: calc.lineDiscountMinor,
      lineTaxMinor: calc.lineTaxMinor,
      lineTotalMinor: calc.lineTotalMinor,
    });
    await recalculate.mutateAsync({ versionId: cv.id, quoteId: id });
    reset();
    setShowAddItem(false);
  };

  const doDeleteItem = async (itemId: string) => {
    if (!cv || !id) return;
    await deleteItem.mutateAsync({ itemId, versionId: cv.id, quoteId: id });
    await recalculate.mutateAsync({ versionId: cv.id, quoteId: id });
  };

  const doSend = async () => {
    if (!id) return;
    setActionError(null);
    try {
      await sendQuote.mutateAsync(id);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Send failed');
    }
  };

  const doAccept = async () => {
    if (!id) return;
    setActionError(null);
    try {
      await acceptQuote.mutateAsync({ quoteId: id });
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Accept failed');
    }
  };

  const doReject = async () => {
    if (!id) return;
    setActionError(null);
    try {
      await rejectQuote.mutateAsync({ quoteId: id });
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Reject failed');
    }
  };

  const doRevise = async () => {
    if (!id) return;
    setActionError(null);
    try {
      const result = await reviseQuote.mutateAsync(id);
      navigate(`/quotes/${result.quote_id}`);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Revision failed');
    }
  };

  const doCreateOrder = async () => {
    if (!id) return;
    setActionError(null);
    try {
      const result = await createOrder.mutateAsync(id);
      navigate(`/orders/${result.order_id}`);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Order creation failed');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground text-sm">
        Loading quote…
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="flex h-64 items-center justify-center text-destructive text-sm">
        Quote not found.{' '}
        <Link to="/quotes" className="ml-2 underline">
          Back
        </Link>
      </div>
    );
  }

  const customer = (quote as any).customer as {
    id: string;
    display_name: string;
    gstin?: string;
  } | null;

  const owner = (quote as any).owner as { id: string; full_name: string } | null;

  const sourceLead = (quote as any).source_lead as {
    id: string;
    lead_number: string;
    full_name: string;
  } | null;
  const status = (quote as any).status as string;

  const canSend = ['draft', 'internal_review'].includes(status);
  const canAccept = ['sent', 'viewed'].includes(status);
  const canReject = !['accepted', 'cancelled', 'archived'].includes(status);
  const canRevise = ['sent', 'viewed', 'accepted', 'rejected', 'expired'].includes(status);
  const canCreateOrder = status === 'accepted';

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/quotes" className="hover:underline">
          Quotations
        </Link>
        <span>/</span>
        <span className="font-mono">{(quote as any).quote_number}</span>
      </div>

      {/* Header row */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold font-mono">{(quote as any).quote_number}</h1>
            <QuoteStatusBadge status={status} />
            {cv && <span className="text-sm text-muted-foreground">v{cv.version_number}</span>}
          </div>
          {customer && (
            <p className="mt-1 text-sm text-muted-foreground">
              Customer:{' '}
              <Link to={`/customers/${customer.id}`} className="text-primary hover:underline">
                {customer.display_name}
              </Link>
              {customer.gstin && ` · GSTIN: ${customer.gstin}`}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          {cv && (
            <Link
              to={`/quotes/${id}/preview`}
              target="_blank"
              className="rounded border border-border px-3 py-1.5 text-sm hover:bg-muted"
            >
              Preview / Print
            </Link>
          )}
          {canSend && (
            <button
              onClick={() => sendConfirm.ask(doSend)}
              className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
            >
              Send to Customer
            </button>
          )}
          {canAccept && (
            <button
              onClick={() => acceptConfirm.ask(doAccept)}
              className="rounded bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700"
            >
              Mark Accepted
            </button>
          )}
          {canReject && (
            <button
              onClick={() => rejectConfirm.ask(doReject)}
              className="rounded border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
            >
              Reject
            </button>
          )}
          {canRevise && (
            <button
              onClick={() => reviseConfirm.ask(doRevise)}
              className="rounded border border-border px-3 py-1.5 text-sm hover:bg-muted"
            >
              Create Revision
            </button>
          )}
          {canCreateOrder && (
            <button
              onClick={doCreateOrder}
              disabled={createOrder.isPending}
              className="rounded bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700 disabled:opacity-50"
            >
              {createOrder.isPending ? 'Creating Order…' : 'Create Order'}
            </button>
          )}
        </div>
      </div>

      {/* Confirm dialogs */}
      {sendConfirm.confirming && (
        <ConfirmBanner
          message="Send this quote to the customer? The current version will become immutable."
          onConfirm={sendConfirm.confirm}
          onCancel={sendConfirm.cancel}
        />
      )}
      {acceptConfirm.confirming && (
        <ConfirmBanner
          message="Mark this quote as accepted?"
          onConfirm={acceptConfirm.confirm}
          onCancel={acceptConfirm.cancel}
        />
      )}
      {rejectConfirm.confirming && (
        <ConfirmBanner
          message="Mark this quote as rejected?"
          onConfirm={rejectConfirm.confirm}
          onCancel={rejectConfirm.cancel}
        />
      )}
      {reviseConfirm.confirming && (
        <ConfirmBanner
          message="Create a new revision? A new draft version will be created from the current version."
          onConfirm={reviseConfirm.confirm}
          onCancel={reviseConfirm.cancel}
        />
      )}

      {actionError && (
        <div className="mb-3 rounded bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {actionError}
        </div>
      )}

      {isSent && (
        <div className="mb-4 rounded border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
          This version was sent on {formatDateTime(cv?.sent_at)} and is now immutable.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Line items */}
          <section className="rounded border border-border">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h2 className="font-medium">Line Items</h2>
              {isDraftable && !showAddItem && (
                <button
                  onClick={() => setShowAddItem(true)}
                  className="rounded bg-primary px-3 py-1 text-xs text-primary-foreground hover:opacity-90"
                >
                  + Add Item
                </button>
              )}
            </div>

            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-left">#</th>
                  <th className="px-4 py-2 text-left">Description</th>
                  <th className="px-4 py-2 text-right">Qty</th>
                  <th className="px-4 py-2 text-right">Unit Price</th>
                  <th className="px-4 py-2 text-right">Disc</th>
                  <th className="px-4 py-2 text-right">Tax</th>
                  <th className="px-4 py-2 text-right">Total</th>
                  {isDraftable && <th className="px-4 py-2" />}
                </tr>
              </thead>
              <tbody>
                {(items ?? []).map((item) => (
                  <tr key={item.id} className="border-t border-border">
                    <td className="px-4 py-2 text-muted-foreground">{item.line_number}</td>
                    <td className="px-4 py-2">
                      <p className="font-medium">{item.title}</p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      )}
                      <span className="text-xs text-muted-foreground capitalize">
                        {item.item_type}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {formatCurrency(item.unit_price_minor)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {item.discount_rate > 0 ? `${(item.discount_rate * 100).toFixed(0)}%` : '—'}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {item.tax_rate > 0 ? `${(item.tax_rate * 100).toFixed(0)}%` : '—'}
                    </td>
                    <td className="px-4 py-2 text-right font-medium">
                      {formatCurrency(item.line_total_minor)}
                    </td>
                    {isDraftable && (
                      <td className="px-4 py-2">
                        <button
                          onClick={() => void doDeleteItem(item.id)}
                          className="text-xs text-destructive hover:underline"
                        >
                          Del
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {(items ?? []).length === 0 && (
                  <tr>
                    <td
                      colSpan={isDraftable ? 8 : 7}
                      className="px-4 py-6 text-center text-muted-foreground text-xs"
                    >
                      No items yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Add item form */}
            {showAddItem && (
              <form
                onSubmit={handleSubmit(onAddItem)}
                className="border-t border-border px-4 py-4 space-y-3"
              >
                <h3 className="text-sm font-medium">Add Line Item</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Type</label>
                    <select
                      {...register('itemType')}
                      className="block w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
                    >
                      <option value="material">Material</option>
                      <option value="labour">Labour</option>
                      <option value="installation">Installation</option>
                      <option value="transport">Transport</option>
                      <option value="discount">Discount</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Title</label>
                    <input
                      {...register('title')}
                      className="block w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
                      placeholder="Item title"
                    />
                    {itemErrors.title && (
                      <p className="text-xs text-destructive">{itemErrors.title.message}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Description</label>
                  <input
                    {...register('description')}
                    className="block w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
                    placeholder="Optional details"
                  />
                </div>
                <div className="grid grid-cols-5 gap-2">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Qty</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('quantity')}
                      className="block w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Unit</label>
                    <input
                      {...register('unit')}
                      className="block w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
                      placeholder="nos"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('unitPriceInr')}
                      className="block w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Disc %</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('discountPct')}
                      className="block w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Tax %</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('taxPct')}
                      className="block w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
                    />
                  </div>
                </div>

                {/* Live preview */}
                <div className="rounded bg-muted/50 px-3 py-2 text-xs flex gap-4 text-muted-foreground">
                  <span>Subtotal: {formatCurrency(preview.lineSubtotalMinor)}</span>
                  <span>Discount: −{formatCurrency(preview.lineDiscountMinor)}</span>
                  <span>Tax: {formatCurrency(preview.lineTaxMinor)}</span>
                  <span className="font-semibold text-foreground">
                    Total: {formatCurrency(preview.lineTotalMinor)}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={addItem.isPending}
                    className="rounded bg-primary px-4 py-1.5 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-50"
                  >
                    {addItem.isPending ? 'Adding…' : 'Add'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddItem(false);
                      reset();
                    }}
                    className="rounded border border-border px-4 py-1.5 text-sm hover:bg-muted"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Totals */}
            {cv && (
              <div className="border-t border-border px-4 py-3 flex justify-end">
                <div className="w-64 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(cv.subtotal_minor)}</span>
                  </div>
                  {cv.discount_minor > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Discount</span>
                      <span>−{formatCurrency(cv.discount_minor)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{formatCurrency(cv.tax_minor)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2 font-semibold">
                    <span>Total</span>
                    <span className="text-lg">{formatCurrency(cv.total_minor)}</span>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Version history */}
          {(versions ?? []).length > 1 && (
            <section className="rounded border border-border">
              <div className="px-4 py-3 border-b border-border">
                <h2 className="font-medium text-sm">Version History</h2>
              </div>
              <div className="divide-y divide-border text-sm">
                {(versions ?? []).map((v) => (
                  <div key={v.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <span className="font-medium">v{v.version_number}</span>
                      {v.sent_at ? (
                        <span className="ml-2 text-muted-foreground text-xs">
                          Sent {formatDate(v.sent_at)}
                        </span>
                      ) : (
                        <span className="ml-2 text-muted-foreground text-xs">Draft</span>
                      )}
                    </div>
                    <span>{formatCurrency(v.total_minor)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Activity timeline */}
          <section className="rounded border border-border">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="font-medium text-sm">Activity</h2>
            </div>
            <div className="divide-y divide-border text-sm">
              {(activities ?? []).length === 0 && (
                <p className="px-4 py-4 text-muted-foreground text-xs">No activity yet.</p>
              )}
              {(activities ?? []).map((a) => {
                const actor = (a as any).actor as { full_name: string } | null;
                return (
                  <div key={a.id} className="px-4 py-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-xs">{a.activity_type}</p>
                        {a.body && (
                          <p className="mt-0.5 text-muted-foreground whitespace-pre-wrap">
                            {a.body}
                          </p>
                        )}
                      </div>
                      <div className="text-right text-xs text-muted-foreground ml-4 shrink-0">
                        <p>{actor?.full_name ?? '—'}</p>
                        <p>{formatDateTime(a.occurred_at)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded border border-border p-4 text-sm space-y-3">
            <h3 className="font-medium">Quote Details</h3>
            <div>
              <p className="text-xs text-muted-foreground">Owner</p>
              <p>{owner?.full_name ?? '—'}</p>
            </div>
            {sourceLead && (
              <div>
                <p className="text-xs text-muted-foreground">Source Lead</p>
                <Link to={`/leads/${sourceLead.id}`} className="text-primary hover:underline">
                  {sourceLead.lead_number} — {sourceLead.full_name}
                </Link>
              </div>
            )}
            {cv && (
              <>
                <div>
                  <p className="text-xs text-muted-foreground">Issue Date</p>
                  <p>{formatDate(cv.issue_date)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Valid Until</p>
                  <p>{formatDate(cv.valid_until)}</p>
                </div>
              </>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Created</p>
              <p>{formatDate((quote as any).created_at)}</p>
            </div>
          </div>

          {/* Terms / notes sidebar cards */}
          {cv?.terms && (
            <div className="rounded border border-border p-4 text-sm">
              <p className="text-xs text-muted-foreground mb-1">Terms & Conditions</p>
              <p className="whitespace-pre-wrap text-sm">{cv.terms}</p>
            </div>
          )}
          {cv?.customer_notes && (
            <div className="rounded border border-border p-4 text-sm">
              <p className="text-xs text-muted-foreground mb-1">Customer Notes</p>
              <p className="whitespace-pre-wrap text-sm">{cv.customer_notes}</p>
            </div>
          )}
          {cv?.internal_notes && (
            <div className="rounded border border-amber-200 bg-amber-50 p-4 text-sm">
              <p className="text-xs text-amber-700 font-medium mb-1">Internal Notes</p>
              <p className="whitespace-pre-wrap text-sm text-amber-900">{cv.internal_notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ConfirmBanner({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="mb-3 flex items-center justify-between rounded border border-amber-300 bg-amber-50 px-4 py-2 text-sm">
      <span className="text-amber-800">{message}</span>
      <div className="flex gap-2 ml-4">
        <button
          onClick={onConfirm}
          className="rounded bg-amber-600 px-3 py-1 text-white text-xs hover:bg-amber-700"
        >
          Confirm
        </button>
        <button
          onClick={onCancel}
          className="rounded border border-amber-300 px-3 py-1 text-amber-700 text-xs hover:bg-amber-100"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

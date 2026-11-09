/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import {
  useInvoiceDetail,
  useInvoiceItems,
  useInvoicePayments,
  useAddInvoiceItem,
  useRecordPayment,
  useReversePayment,
} from '@/lib/hooks/use-invoice-detail';
import { useIssueInvoice, useVoidInvoice } from '@/lib/hooks/use-invoices';
import { formatCurrency, formatDate } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  issued: 'bg-blue-100 text-blue-700',
  partially_paid: 'bg-orange-100 text-orange-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
  void: 'bg-slate-100 text-slate-500',
};

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  issued: 'Issued',
  partially_paid: 'Partially Paid',
  paid: 'Paid',
  overdue: 'Overdue',
  void: 'Void',
};

const METHOD_LABEL: Record<string, string> = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  upi: 'UPI',
  card: 'Card',
  cheque: 'Cheque',
  other: 'Other',
};

const today = new Date().toISOString().split('T')[0];

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const role = (profile as any)?.role as string | undefined;

  const { data: invoice, isLoading } = useInvoiceDetail(id!);
  const { data: items = [] } = useInvoiceItems(id!);
  const { data: payments = [] } = useInvoicePayments(id!);

  const issueInvoice = useIssueInvoice();
  const voidInvoice = useVoidInvoice();
  const addItem = useAddInvoiceItem();
  const recordPayment = useRecordPayment();
  const reversePayment = useReversePayment();

  // Add item form
  const [showAddItem, setShowAddItem] = useState(false);
  const [itemTitle, setItemTitle] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemQty, setItemQty] = useState('1');
  const [itemUnit, setItemUnit] = useState('unit');
  const [itemPrice, setItemPrice] = useState('');
  const [itemDiscount, setItemDiscount] = useState('0');
  const [itemTax, setItemTax] = useState('0');

  // Payment form
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(today);
  const [payMethod, setPayMethod] = useState('bank_transfer');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [payError, setPayError] = useState('');

  // Reversal
  const [reversingId, setReversingId] = useState<string | null>(null);
  const [reversalReason, setReversalReason] = useState('');

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-6 text-muted-foreground">
        Invoice not found.{' '}
        <Link to="/invoices" className="text-primary hover:underline">
          Back to invoices
        </Link>
      </div>
    );
  }

  const inv = invoice as any;
  const customer = inv.customer as { id: string; display_name: string } | null;
  const order = inv.order as { id: string; order_number: string } | null;
  const project = inv.project as { id: string; project_number: string; name: string } | null;

  const canEdit = inv.status === 'draft';
  const canRecord = ['issued', 'partially_paid', 'overdue'].includes(inv.status);
  const canVoid = role === 'admin' && !['void', 'paid'].includes(inv.status);
  const canIssue = inv.status === 'draft';
  const canReverse = role === 'admin' || role === 'manager';

  const handleAddItem = () => {
    if (!itemTitle.trim() || !itemPrice) return;
    const priceMinor = Math.round(parseFloat(itemPrice) * 100);
    void addItem
      .mutateAsync({
        invoiceId: id!,
        title: itemTitle.trim(),
        description: itemDesc || undefined,
        quantity: parseFloat(itemQty) || 1,
        unit: itemUnit || 'unit',
        unitPriceMinor: priceMinor,
        discountRate: parseFloat(itemDiscount) / 100 || 0,
        taxRate: parseFloat(itemTax) / 100 || 0,
      })
      .then(() => {
        setItemTitle('');
        setItemDesc('');
        setItemQty('1');
        setItemUnit('unit');
        setItemPrice('');
        setItemDiscount('0');
        setItemTax('0');
        setShowAddItem(false);
      });
  };

  const handleRecordPayment = () => {
    setPayError('');
    const amountMinor = Math.round(parseFloat(payAmount) * 100);
    if (!amountMinor || amountMinor <= 0) {
      setPayError('Enter a valid amount');
      return;
    }
    if (amountMinor > inv.balance_minor) {
      setPayError('Amount exceeds outstanding balance');
      return;
    }
    void recordPayment
      .mutateAsync({
        invoiceId: id!,
        amountMinor,
        method: payMethod,
        paymentDate: payDate,
        reference: payRef || undefined,
        notes: payNotes || undefined,
      })
      .then(() => {
        setPayAmount('');
        setPayDate(today);
        setPayRef('');
        setPayNotes('');
      });
  };

  const handleIssue = () => {
    if (!confirm('Issue this invoice? It will no longer be editable.')) return;
    void issueInvoice.mutateAsync(id!);
  };

  const handleVoid = () => {
    if (!confirm('Void this invoice? This cannot be undone.')) return;
    void voidInvoice.mutateAsync(id!);
  };

  const handleReverse = (paymentId: string) => {
    void reversePayment
      .mutateAsync({ paymentId, invoiceId: id!, reason: reversalReason || undefined })
      .then(() => {
        setReversingId(null);
        setReversalReason('');
      });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Link to="/invoices" className="hover:underline">
          Invoices
        </Link>
        <span>/</span>
        <span className="font-mono">{inv.invoice_number}</span>
      </div>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold font-mono">{inv.invoice_number}</h1>
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[inv.status] ?? 'bg-gray-100 text-gray-600'}`}
            >
              {STATUS_LABEL[inv.status] ?? inv.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{customer?.display_name}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/invoices/${id}/preview`}
            target="_blank"
            className="rounded border border-border px-3 py-1.5 text-sm hover:bg-muted"
          >
            Preview / Print
          </Link>
          {canIssue && (
            <button
              onClick={handleIssue}
              disabled={issueInvoice.isPending || items.length === 0}
              className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Issue Invoice
            </button>
          )}
          {canVoid && (
            <button
              onClick={handleVoid}
              disabled={voidInvoice.isPending}
              className="rounded border border-destructive px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-50"
            >
              Void
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice info */}
          <section className="rounded-lg border border-border p-4">
            <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs text-muted-foreground">Customer</dt>
                <dd>
                  <Link to={`/customers/${customer?.id}`} className="text-primary hover:underline">
                    {customer?.display_name ?? '—'}
                  </Link>
                </dd>
              </div>
              {order && (
                <div>
                  <dt className="text-xs text-muted-foreground">Order</dt>
                  <dd>
                    <Link
                      to={`/orders/${order.id}`}
                      className="text-primary hover:underline font-mono text-xs"
                    >
                      {order.order_number}
                    </Link>
                  </dd>
                </div>
              )}
              {project && (
                <div>
                  <dt className="text-xs text-muted-foreground">Project</dt>
                  <dd>
                    <Link
                      to={`/projects/${project.id}`}
                      className="text-primary hover:underline text-xs"
                    >
                      {project.project_number} {project.name}
                    </Link>
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-muted-foreground">Issue Date</dt>
                <dd>{formatDate(inv.issue_date)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Due Date</dt>
                <dd className={inv.status === 'overdue' ? 'text-red-600 font-medium' : ''}>
                  {formatDate(inv.due_date)}
                </dd>
              </div>
            </dl>
          </section>

          {/* Line items */}
          <section className="rounded-lg border border-border p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-medium">Line Items</h2>
              {canEdit && (
                <button
                  onClick={() => setShowAddItem((v) => !v)}
                  className="text-xs text-primary hover:underline"
                >
                  + Add Item
                </button>
              )}
            </div>

            {showAddItem && canEdit && (
              <div className="mb-4 rounded border border-border p-3 bg-muted/20 space-y-2">
                <input
                  placeholder="Title *"
                  value={itemTitle}
                  onChange={(e) => setItemTitle(e.target.value)}
                  className="w-full rounded border border-border px-2 py-1.5 text-sm"
                />
                <input
                  placeholder="Description"
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  className="w-full rounded border border-border px-2 py-1.5 text-sm"
                />
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  <input
                    placeholder="Qty"
                    type="number"
                    min="0.001"
                    step="any"
                    value={itemQty}
                    onChange={(e) => setItemQty(e.target.value)}
                    className="rounded border border-border px-2 py-1.5 text-sm"
                  />
                  <input
                    placeholder="Unit"
                    value={itemUnit}
                    onChange={(e) => setItemUnit(e.target.value)}
                    className="rounded border border-border px-2 py-1.5 text-sm"
                  />
                  <input
                    placeholder="Unit Price (₹)"
                    type="number"
                    min="0"
                    step="any"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    className="rounded border border-border px-2 py-1.5 text-sm col-span-2 sm:col-span-1"
                  />
                  <input
                    placeholder="Disc %"
                    type="number"
                    min="0"
                    max="100"
                    value={itemDiscount}
                    onChange={(e) => setItemDiscount(e.target.value)}
                    className="rounded border border-border px-2 py-1.5 text-sm"
                  />
                  <input
                    placeholder="Tax %"
                    type="number"
                    min="0"
                    value={itemTax}
                    onChange={(e) => setItemTax(e.target.value)}
                    className="rounded border border-border px-2 py-1.5 text-sm"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowAddItem(false)}
                    className="rounded border border-border px-3 py-1 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddItem}
                    disabled={!itemTitle.trim() || !itemPrice || addItem.isPending}
                    className="rounded bg-primary px-3 py-1 text-sm text-primary-foreground disabled:opacity-50"
                  >
                    {addItem.isPending ? 'Adding…' : 'Add Item'}
                  </button>
                </div>
              </div>
            )}

            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No items yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="pb-2 pr-3">#</th>
                      <th className="pb-2 pr-3">Item</th>
                      <th className="pb-2 pr-3 text-right">Qty</th>
                      <th className="pb-2 pr-3">Unit</th>
                      <th className="pb-2 pr-3 text-right">Unit Price</th>
                      <th className="pb-2 pr-3 text-right hidden sm:table-cell">Disc</th>
                      <th className="pb-2 pr-3 text-right hidden sm:table-cell">Tax</th>
                      <th className="pb-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(items as any[]).map((item) => (
                      <tr key={item.id}>
                        <td className="py-2 pr-3 text-muted-foreground text-xs">
                          {item.line_number}
                        </td>
                        <td className="py-2 pr-3">
                          <p className="font-medium">{item.title}</p>
                          {item.description && (
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                          )}
                        </td>
                        <td className="py-2 pr-3 text-right">{item.quantity}</td>
                        <td className="py-2 pr-3 text-muted-foreground">{item.unit}</td>
                        <td className="py-2 pr-3 text-right font-mono">
                          {formatCurrency(item.unit_price_minor)}
                        </td>
                        <td className="py-2 pr-3 text-right text-muted-foreground hidden sm:table-cell">
                          {item.discount_rate > 0
                            ? `${(item.discount_rate * 100).toFixed(1)}%`
                            : '—'}
                        </td>
                        <td className="py-2 pr-3 text-right text-muted-foreground hidden sm:table-cell">
                          {item.tax_rate > 0 ? `${(item.tax_rate * 100).toFixed(1)}%` : '—'}
                        </td>
                        <td className="py-2 text-right font-mono font-medium">
                          {formatCurrency(item.line_total_minor)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Totals */}
            {items.length > 0 && (
              <div className="mt-4 border-t border-border pt-4 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-mono">{formatCurrency(inv.subtotal_minor)}</span>
                </div>
                {inv.discount_minor > 0 && (
                  <div className="flex justify-between text-orange-600">
                    <span>Discount</span>
                    <span className="font-mono">− {formatCurrency(inv.discount_minor)}</span>
                  </div>
                )}
                {inv.tax_minor > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="font-mono">+ {formatCurrency(inv.tax_minor)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-base border-t border-border pt-2">
                  <span>Total</span>
                  <span className="font-mono">{formatCurrency(inv.total_minor)}</span>
                </div>
              </div>
            )}
          </section>

          {/* Payment history */}
          <section className="rounded-lg border border-border p-4">
            <h2 className="mb-3 font-medium">Payment History</h2>

            {payments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payments recorded.</p>
            ) : (
              <div className="space-y-3">
                {(payments as any[]).map((pmt) => {
                  const recorder = pmt.recorder as { id: string; full_name: string | null } | null;
                  const isReversed = !!pmt.reversed_at || pmt.status === 'reversed';
                  return (
                    <div
                      key={pmt.id}
                      className={`rounded border border-border p-3 text-sm ${isReversed ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className={isReversed ? 'line-through text-muted-foreground' : ''}>
                          <p className="font-mono font-medium">{pmt.payment_number}</p>
                          <p className="text-muted-foreground text-xs">
                            {formatDate(pmt.payment_date)} ·{' '}
                            {METHOD_LABEL[pmt.method] ?? pmt.method}
                            {pmt.reference && ` · Ref: ${pmt.reference}`}
                            {recorder?.full_name && ` · by ${recorder.full_name}`}
                          </p>
                          {pmt.notes && (
                            <p className="text-muted-foreground text-xs mt-1">{pmt.notes}</p>
                          )}
                          {isReversed && (
                            <p className="text-red-600 text-xs mt-1 no-underline">Reversed</p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-mono font-semibold">
                            {formatCurrency(pmt.amount_minor)}
                          </p>
                          {!isReversed && canReverse && (
                            <button
                              onClick={() => setReversingId(reversingId === pmt.id ? null : pmt.id)}
                              className="text-xs text-destructive hover:underline mt-1"
                            >
                              Reverse
                            </button>
                          )}
                        </div>
                      </div>
                      {reversingId === pmt.id && (
                        <div className="mt-2 flex gap-2 items-center">
                          <input
                            placeholder="Reason (optional)"
                            value={reversalReason}
                            onChange={(e) => setReversalReason(e.target.value)}
                            className="flex-1 rounded border border-border px-2 py-1 text-xs"
                          />
                          <button
                            onClick={() => handleReverse(pmt.id)}
                            disabled={reversePayment.isPending}
                            className="rounded bg-destructive px-2 py-1 text-xs text-destructive-foreground disabled:opacity-50"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setReversingId(null)}
                            className="rounded border border-border px-2 py-1 text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Payment summary */}
            <div className="mt-4 border-t border-border pt-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Paid</span>
                <span className="font-mono text-green-600">
                  {formatCurrency(inv.amount_paid_minor)}
                </span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Outstanding Balance</span>
                <span
                  className={`font-mono ${inv.balance_minor > 0 ? 'text-red-600' : 'text-green-600'}`}
                >
                  {formatCurrency(inv.balance_minor)}
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Record payment */}
          {canRecord && (
            <section className="rounded-lg border border-border p-4">
              <h2 className="mb-3 font-medium text-sm">Record Payment</h2>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">
                    Amount (₹) — max {formatCurrency(inv.balance_minor)}
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full rounded border border-border px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full rounded border border-border px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Method</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full rounded border border-border px-2 py-1.5 text-sm bg-background"
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="upi">UPI</option>
                    <option value="cash">Cash</option>
                    <option value="cheque">Cheque</option>
                    <option value="card">Card</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">
                    Reference (optional)
                  </label>
                  <input
                    placeholder="UTR / cheque number…"
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    className="w-full rounded border border-border px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">
                    Notes (optional)
                  </label>
                  <input
                    placeholder="Notes…"
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    className="w-full rounded border border-border px-2 py-1.5 text-sm"
                  />
                </div>
                {payError && <p className="text-xs text-destructive">{payError}</p>}
                {recordPayment.error && (
                  <p className="text-xs text-destructive">
                    {(recordPayment.error as any)?.message ?? 'Failed to record payment'}
                  </p>
                )}
                <button
                  onClick={handleRecordPayment}
                  disabled={!payAmount || recordPayment.isPending}
                  className="w-full rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-50"
                >
                  {recordPayment.isPending ? 'Recording…' : 'Record Payment'}
                </button>
              </div>
            </section>
          )}

          {/* Invoice details */}
          <section className="rounded-lg border border-border p-4">
            <h2 className="mb-3 font-medium text-sm">Invoice Details</h2>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Status</dt>
                <dd>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[inv.status]}`}
                  >
                    {STATUS_LABEL[inv.status]}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Currency</dt>
                <dd>{inv.currency}</dd>
              </div>
              {inv.issued_at && (
                <div>
                  <dt className="text-xs text-muted-foreground">Issued At</dt>
                  <dd className="text-xs">{new Date(inv.issued_at).toLocaleDateString('en-IN')}</dd>
                </div>
              )}
            </dl>
          </section>

          {/* Notes */}
          {inv.notes && (
            <section className="rounded-lg border border-border p-4">
              <h2 className="mb-2 font-medium text-sm">Notes</h2>
              <p className="text-sm whitespace-pre-wrap text-muted-foreground">{inv.notes}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

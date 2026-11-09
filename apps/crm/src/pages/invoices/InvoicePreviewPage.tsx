/* eslint-disable @typescript-eslint/no-explicit-any */
import { useParams, Link } from 'react-router-dom';
import { useInvoiceDetail, useInvoiceItems } from '@/lib/hooks/use-invoice-detail';
import { formatCurrency, formatDate } from '@/lib/format';

export function InvoicePreviewPage() {
  const { id } = useParams<{ id: string }>();
  const { data: invoice, isLoading, error } = useInvoiceDetail(id ?? '');
  const { data: items = [] } = useInvoiceItems(id ?? '');

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500 text-sm">
        Loading invoice…
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex h-64 items-center justify-center text-red-600 text-sm">
        Invoice not found.{' '}
        <Link to="/invoices" className="ml-2 underline">
          Back to invoices
        </Link>
      </div>
    );
  }

  const inv = invoice as any;
  const customer = inv.customer as { id: string; display_name: string } | null;
  const order = inv.order as { id: string; order_number: string } | null;

  return (
    <div className="min-h-screen bg-white text-gray-900 print:bg-white">
      {/* Print toolbar */}
      <div className="print:hidden mb-6 flex items-center justify-between border-b border-gray-200 px-6 py-3 bg-gray-50">
        <Link to={`/invoices/${id}`} className="text-sm text-blue-600 hover:underline">
          ← Back to invoice
        </Link>
        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            className="rounded bg-blue-600 px-4 py-1.5 text-sm text-white hover:bg-blue-700"
          >
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* Invoice document */}
      <div className="mx-auto max-w-3xl px-8 py-8 print:max-w-none print:px-12 print:py-10">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              [Business Name — update in settings]
            </p>
            <p className="text-xs text-gray-400">[Address line 1]</p>
            <p className="text-xs text-gray-400">[City, State, PIN]</p>
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-bold text-gray-900">INVOICE</h1>
            <p className="font-mono text-sm font-semibold text-gray-700 mt-1">
              {inv.invoice_number}
            </p>
          </div>
        </div>

        {/* Billing info */}
        <div className="mb-8 grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Bill To</p>
            <p className="font-medium text-gray-900">{customer?.display_name ?? '—'}</p>
            {order && <p className="text-xs text-gray-500 mt-1">Order: {order.order_number}</p>}
          </div>
          <div className="text-right">
            <div className="space-y-1 text-sm">
              <div className="flex justify-end gap-4">
                <span className="text-gray-500">Issue Date</span>
                <span>{formatDate(inv.issue_date)}</span>
              </div>
              <div className="flex justify-end gap-4">
                <span className="text-gray-500">Due Date</span>
                <span className="font-medium">{formatDate(inv.due_date)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Line items */}
        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="pb-2 text-left text-gray-600 font-medium">#</th>
              <th className="pb-2 text-left text-gray-600 font-medium">Description</th>
              <th className="pb-2 text-right text-gray-600 font-medium">Qty</th>
              <th className="pb-2 text-right text-gray-600 font-medium">Unit Price</th>
              <th className="pb-2 text-right text-gray-600 font-medium">Disc</th>
              <th className="pb-2 text-right text-gray-600 font-medium">Tax</th>
              <th className="pb-2 text-right text-gray-600 font-medium">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(items as any[]).map((item) => (
              <tr key={item.id}>
                <td className="py-2 pr-2 text-gray-400 text-xs">{item.line_number}</td>
                <td className="py-2 pr-2">
                  <p className="font-medium">{item.title}</p>
                  {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
                </td>
                <td className="py-2 pr-2 text-right text-gray-700">
                  {item.quantity} {item.unit}
                </td>
                <td className="py-2 pr-2 text-right font-mono text-gray-700">
                  {formatCurrency(item.unit_price_minor)}
                </td>
                <td className="py-2 pr-2 text-right text-gray-500 text-xs">
                  {item.discount_rate > 0 ? `${(item.discount_rate * 100).toFixed(1)}%` : '—'}
                </td>
                <td className="py-2 pr-2 text-right text-gray-500 text-xs">
                  {item.tax_rate > 0 ? `${(item.tax_rate * 100).toFixed(1)}%` : '—'}
                </td>
                <td className="py-2 text-right font-mono font-medium">
                  {formatCurrency(item.line_total_minor)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-64 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-mono">{formatCurrency(inv.subtotal_minor)}</span>
            </div>
            {inv.discount_minor > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Discount</span>
                <span className="font-mono text-orange-600">
                  − {formatCurrency(inv.discount_minor)}
                </span>
              </div>
            )}
            {inv.tax_minor > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Tax</span>
                <span className="font-mono">+ {formatCurrency(inv.tax_minor)}</span>
              </div>
            )}
            <div className="flex justify-between border-t-2 border-gray-900 pt-2 font-bold text-base">
              <span>TOTAL DUE</span>
              <span className="font-mono">{formatCurrency(inv.total_minor)}</span>
            </div>
            {inv.amount_paid_minor > 0 && (
              <>
                <div className="flex justify-between text-green-700">
                  <span>Amount Paid</span>
                  <span className="font-mono">{formatCurrency(inv.amount_paid_minor)}</span>
                </div>
                <div className="flex justify-between font-bold border-t border-gray-300 pt-1">
                  <span>OUTSTANDING BALANCE</span>
                  <span className="font-mono">{formatCurrency(inv.balance_minor)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Notes */}
        {inv.notes && (
          <div className="mb-8 border-t border-gray-200 pt-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Notes</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{inv.notes}</p>
          </div>
        )}

        {/* Footer disclaimer */}
        <div className="border-t border-gray-200 pt-4">
          <p className="text-xs text-gray-400 text-center">
            This is an operational invoice document. Not certified accounting software.
          </p>
        </div>
      </div>
    </div>
  );
}

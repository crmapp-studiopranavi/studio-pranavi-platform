import { useParams, Link } from 'react-router-dom';
import { useQuoteDetail } from '@/lib/hooks/use-quote-detail';
import { useQuoteItems } from '@/lib/hooks/use-quote-detail';
import { formatCurrency, formatDate } from '@/lib/format';

export function QuotePreviewPage() {
  const { id } = useParams<{ id: string }>();
  const { data: quote, isLoading, error } = useQuoteDetail(id ?? '');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cv = (quote as any)?.current_version as {
    id: string;
    version_number: number;
    issue_date: string;
    valid_until: string;
    subtotal_minor: number;
    discount_minor: number;
    tax_minor: number;
    total_minor: number;
    terms: string | null;
    customer_notes: string | null;
    // internal_notes intentionally omitted — never shown to customer
  } | null;

  const { data: items } = useQuoteItems(cv?.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const snapshotRaw = (quote as any)?.current_version?.snapshot_customer;
  const snapshot = snapshotRaw as {
    display_name?: string;
    gstin?: string;
    contact_name?: string;
    contact_email?: string;
    contact_phone?: string;
    address?: { line1?: string; line2?: string; city?: string; state?: string; pincode?: string };
  } | null;

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
          Back to quotes
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 print:bg-white">
      {/* Print toolbar — hidden when printing */}
      <div className="print:hidden mb-6 flex items-center justify-between border-b border-gray-200 px-6 py-3 bg-gray-50">
        <Link to={`/quotes/${id}`} className="text-sm text-blue-600 hover:underline">
          ← Back to Quote
        </Link>
        <button
          onClick={() => window.print()}
          className="rounded bg-gray-800 px-4 py-2 text-sm text-white hover:bg-gray-700"
        >
          Print / Save as PDF
        </button>
      </div>

      {/* Quote document */}
      <div className="mx-auto max-w-3xl px-8 py-10 print:px-0 print:py-0">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">QUOTATION</h1>
            <p className="mt-1 text-sm text-gray-500">
              Quote #{quote.quote_number} {cv ? `· Version ${cv.version_number}` : ''}
            </p>
          </div>
          <div className="text-right text-sm text-gray-600">
            {cv && (
              <>
                <p>
                  <span className="font-medium">Issue Date:</span> {formatDate(cv.issue_date)}
                </p>
                <p>
                  <span className="font-medium">Valid Until:</span> {formatDate(cv.valid_until)}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Bill To */}
        {snapshot && (
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
              Bill To
            </p>
            <p className="font-semibold text-base">{snapshot.display_name}</p>
            {snapshot.gstin && <p className="text-sm text-gray-600">GSTIN: {snapshot.gstin}</p>}
            {snapshot.contact_name && (
              <p className="text-sm text-gray-600">Attn: {snapshot.contact_name}</p>
            )}
            {snapshot.contact_email && (
              <p className="text-sm text-gray-600">{snapshot.contact_email}</p>
            )}
            {snapshot.contact_phone && (
              <p className="text-sm text-gray-600">{snapshot.contact_phone}</p>
            )}
            {snapshot.address && (
              <div className="text-sm text-gray-600">
                {snapshot.address.line1 && <p>{snapshot.address.line1}</p>}
                {snapshot.address.line2 && <p>{snapshot.address.line2}</p>}
                {(snapshot.address.city || snapshot.address.state || snapshot.address.pincode) && (
                  <p>
                    {[snapshot.address.city, snapshot.address.state, snapshot.address.pincode]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Line items */}
        <table className="w-full text-sm mb-6 border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="py-2 text-left font-semibold text-gray-700">#</th>
              <th className="py-2 text-left font-semibold text-gray-700">Description</th>
              <th className="py-2 text-right font-semibold text-gray-700">Qty</th>
              <th className="py-2 text-right font-semibold text-gray-700">Unit Price</th>
              <th className="py-2 text-right font-semibold text-gray-700">Discount</th>
              <th className="py-2 text-right font-semibold text-gray-700">Tax</th>
              <th className="py-2 text-right font-semibold text-gray-700">Amount</th>
            </tr>
          </thead>
          <tbody>
            {(items ?? []).map((item) => (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="py-2 text-gray-500">{item.line_number}</td>
                <td className="py-2">
                  <p className="font-medium">{item.title}</p>
                  {item.description && (
                    <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                  )}
                </td>
                <td className="py-2 text-right">
                  {item.quantity} {item.unit}
                </td>
                <td className="py-2 text-right">{formatCurrency(item.unit_price_minor)}</td>
                <td className="py-2 text-right">
                  {item.discount_rate > 0 ? `${(item.discount_rate * 100).toFixed(0)}%` : '—'}
                </td>
                <td className="py-2 text-right">
                  {item.tax_rate > 0 ? `${(item.tax_rate * 100).toFixed(0)}%` : '—'}
                </td>
                <td className="py-2 text-right font-medium">
                  {formatCurrency(item.line_total_minor)}
                </td>
              </tr>
            ))}
            {(items ?? []).length === 0 && (
              <tr>
                <td colSpan={7} className="py-6 text-center text-gray-400 text-xs">
                  No line items
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Totals */}
        {cv && (
          <div className="flex justify-end mb-8">
            <div className="w-72 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatCurrency(cv.subtotal_minor)}</span>
              </div>
              {cv.discount_minor > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount</span>
                  <span>−{formatCurrency(cv.discount_minor)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span>{formatCurrency(cv.tax_minor)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-300 pt-2 font-semibold text-base">
                <span>Total</span>
                <span>{formatCurrency(cv.total_minor)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Customer notes */}
        {cv?.customer_notes && (
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
              Notes
            </p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{cv.customer_notes}</p>
          </div>
        )}

        {/* Terms */}
        {cv?.terms && (
          <div className="mb-6 border-t border-gray-200 pt-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
              Terms & Conditions
            </p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{cv.terms}</p>
          </div>
        )}

        <p className="mt-8 text-center text-xs text-gray-400">
          This quotation was generated electronically and is valid until{' '}
          {formatDate(cv?.valid_until)}.
        </p>
      </div>
    </div>
  );
}

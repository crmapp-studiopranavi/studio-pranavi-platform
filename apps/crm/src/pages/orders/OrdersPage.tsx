/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useOrders } from '@/lib/hooks/use-orders';
import { formatCurrency, formatDate } from '@/lib/format';

const ORDER_STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmed',
  design_or_measurement: 'Design / Measurement',
  production: 'Production',
  ready_for_installation: 'Ready for Installation',
  installation_scheduled: 'Installation Scheduled',
  installed: 'Installed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  on_hold: 'On Hold',
};

const ORDER_STATUS_COLORS: Record<string, string> = {
  confirmed: 'bg-blue-100 text-blue-700',
  design_or_measurement: 'bg-purple-100 text-purple-700',
  production: 'bg-orange-100 text-orange-700',
  ready_for_installation: 'bg-yellow-100 text-yellow-700',
  installation_scheduled: 'bg-cyan-100 text-cyan-700',
  installed: 'bg-teal-100 text-teal-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  on_hold: 'bg-gray-100 text-gray-600',
};

function OrderStatusBadge({ status }: { status: string }) {
  const cls = ORDER_STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {ORDER_STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);

  const { data, isLoading, isError } = useOrders({ status: statusFilter || undefined, page });
  const orders = data?.orders ?? [];
  const total = data?.total ?? 0;
  const pageSize = data?.pageSize ?? 20;
  const totalPages = Math.ceil(total / pageSize);

  if (isError) {
    return (
      <div className="flex h-40 items-center justify-center p-8 text-center">
        <p className="text-sm text-destructive">
          Failed to load orders. Please refresh and try again.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Orders</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} order{total !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(0);
          }}
          className="rounded border border-border bg-background px-3 py-1.5 text-sm"
        >
          <option value="">All Statuses</option>
          {Object.entries(ORDER_STATUS_LABELS).map(([val, label]) => (
            <option key={val} value={val}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
          Loading orders…
        </div>
      ) : orders.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
          <p>No orders found.</p>
          <p className="text-xs">Orders are created when a quote is accepted.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Order #</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Customer</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Total</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Order Date
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Target Completion
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((order) => {
                const customer = (order as any).customer as {
                  id: string;
                  display_name: string;
                } | null;
                return (
                  <tr key={order.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Link
                        to={`/orders/${order.id}`}
                        className="font-mono text-primary hover:underline"
                      >
                        {order.order_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {customer ? (
                        <Link to={`/customers/${customer.id}`} className="hover:underline">
                          {customer.display_name}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={order.status ?? ''} />
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {formatCurrency(order.total_minor)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(order.order_date)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(order.target_completion_date)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded border border-border px-3 py-1 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="rounded border border-border px-3 py-1 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

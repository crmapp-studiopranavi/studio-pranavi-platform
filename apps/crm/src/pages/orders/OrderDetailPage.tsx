/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  useOrderDetail,
  useOrderActivities,
  useUpdateOrder,
  useProjectByOrderId,
} from '@/lib/hooks/use-order-detail';
import { useUpdateOrderStatus } from '@/lib/hooks/use-orders';
import { useCreateProject } from '@/lib/hooks/use-projects';
import { useInvoicesByOrder } from '@/lib/hooks/use-invoices';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format';

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

const ORDER_NEXT_STATUS: Record<string, string> = {
  confirmed: 'design_or_measurement',
  design_or_measurement: 'production',
  production: 'ready_for_installation',
  ready_for_installation: 'installation_scheduled',
  installation_scheduled: 'installed',
  installed: 'completed',
};

function OrderStatusBadge({ status }: { status: string }) {
  const cls = ORDER_STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {ORDER_STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: order, isLoading, error } = useOrderDetail(id ?? '');
  const { data: project, isLoading: projectLoading } = useProjectByOrderId(id ?? '');
  const { data: activities } = useOrderActivities(id ?? '');
  const { data: orderInvoices } = useInvoicesByOrder(id ?? '');

  const updateStatus = useUpdateOrderStatus();
  const updateOrder = useUpdateOrder();
  const createProject = useCreateProject();

  const [actionError, setActionError] = useState<string | null>(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectStartDate, setProjectStartDate] = useState('');
  const [editNotes, setEditNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground text-sm">
        Loading order…
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex h-64 items-center justify-center text-destructive text-sm">
        Order not found.{' '}
        <Link to="/orders" className="ml-2 underline">
          Back
        </Link>
      </div>
    );
  }

  const status = order.status as string;
  const customer = (order as any).customer as { id: string; display_name: string } | null;
  const quote = (order as any).quote as {
    id: string;
    quote_number: string;
    status: string;
  } | null;
  const owner = (order as any).owner as { id: string; full_name: string } | null;

  const nextStatus = ORDER_NEXT_STATUS[status];
  const canAdvance = !!nextStatus;
  const canHold = !['completed', 'cancelled', 'on_hold'].includes(status);
  const canCancel = !['completed', 'cancelled'].includes(status);

  const doAdvance = async () => {
    if (!id || !nextStatus) return;
    setActionError(null);
    try {
      await updateStatus.mutateAsync({ orderId: id, status: nextStatus });
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Status update failed');
    }
  };

  const doSetStatus = async (s: string) => {
    if (!id) return;
    setActionError(null);
    try {
      await updateStatus.mutateAsync({ orderId: id, status: s });
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Status update failed');
    }
  };

  const doSaveNotes = async () => {
    if (!id) return;
    await updateOrder.mutateAsync({ orderId: id, update: { notes: notesValue } });
    setEditNotes(false);
  };

  const doCreateProject = async () => {
    if (!id || !projectName.trim()) return;
    setActionError(null);
    try {
      const result = await createProject.mutateAsync({
        name: projectName.trim(),
        customerId: order.customer_id,
        orderId: id,
        startDate: projectStartDate || undefined,
      });
      setShowCreateProject(false);
      navigate(`/projects/${result.project_id}`);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Project creation failed');
    }
  };

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/orders" className="hover:underline">
          Orders
        </Link>
        <span>/</span>
        <span className="font-mono">{order.order_number}</span>
      </div>

      {/* Header */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold font-mono">{order.order_number}</h1>
            <OrderStatusBadge status={status} />
          </div>
          {customer && (
            <p className="mt-1 text-sm text-muted-foreground">
              Customer:{' '}
              <Link to={`/customers/${customer.id}`} className="text-primary hover:underline">
                {customer.display_name}
              </Link>
            </p>
          )}
          <p className="mt-0.5 text-sm font-medium">{formatCurrency(order.total_minor)}</p>
        </div>

        {/* Status action buttons */}
        <div className="flex flex-wrap gap-2">
          {canAdvance && (
            <button
              onClick={doAdvance}
              disabled={updateStatus.isPending}
              className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Advance → {ORDER_STATUS_LABELS[nextStatus]}
            </button>
          )}
          {canHold && (
            <button
              onClick={() => doSetStatus('on_hold')}
              disabled={updateStatus.isPending}
              className="rounded border border-border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50"
            >
              Put On Hold
            </button>
          )}
          {status === 'on_hold' && (
            <button
              onClick={() => doSetStatus('confirmed')}
              disabled={updateStatus.isPending}
              className="rounded border border-blue-300 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 disabled:opacity-50"
            >
              Resume
            </button>
          )}
          {canCancel && (
            <button
              onClick={() => doSetStatus('cancelled')}
              disabled={updateStatus.isPending}
              className="rounded border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {actionError && (
        <div className="mb-4 rounded bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {actionError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main left column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Order details */}
          <div className="rounded border border-border p-4">
            <h2 className="mb-3 font-medium">Order Details</h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Order Date</dt>
              <dd>{formatDate(order.order_date)}</dd>
              <dt className="text-muted-foreground">Target Completion</dt>
              <dd>{formatDate(order.target_completion_date) ?? '—'}</dd>
              <dt className="text-muted-foreground">Currency</dt>
              <dd>{order.currency}</dd>
            </dl>
          </div>

          {/* Linked quote */}
          {quote && (
            <div className="rounded border border-border p-4">
              <h2 className="mb-2 font-medium">Linked Quote</h2>
              <Link
                to={`/quotes/${quote.id}`}
                className="font-mono text-sm text-primary hover:underline"
              >
                {quote.quote_number}
              </Link>
              <span className="ml-2 text-xs text-muted-foreground capitalize">{quote.status}</span>
            </div>
          )}

          {/* Project */}
          <div className="rounded border border-border p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-medium">Project</h2>
              {!project && !projectLoading && !showCreateProject && (
                <button
                  onClick={() => setShowCreateProject(true)}
                  className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
                >
                  Create Project
                </button>
              )}
            </div>

            {projectLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

            {project && (
              <div className="flex items-center gap-2 text-sm">
                <Link
                  to={`/projects/${project.id}`}
                  className="font-mono text-primary hover:underline"
                >
                  {project.project_number}
                </Link>
                <span className="text-muted-foreground">{project.name}</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize">
                  {project.status}
                </span>
              </div>
            )}

            {!project && !projectLoading && !showCreateProject && (
              <p className="text-sm text-muted-foreground">No project linked yet.</p>
            )}

            {showCreateProject && (
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium">Project Name *</label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
                    placeholder="e.g. Glass Partition — Office Block A"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium">Start Date</label>
                  <input
                    type="date"
                    value={projectStartDate}
                    onChange={(e) => setProjectStartDate(e.target.value)}
                    className="rounded border border-border bg-background px-3 py-1.5 text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={doCreateProject}
                    disabled={!projectName.trim() || createProject.isPending}
                    className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {createProject.isPending ? 'Creating…' : 'Create Project'}
                  </button>
                  <button
                    onClick={() => setShowCreateProject(false)}
                    className="rounded border border-border px-3 py-1.5 text-sm hover:bg-muted"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Invoices */}
          <div className="rounded border border-border p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-medium">Invoices</h2>
              {order && (
                <Link
                  to={`/invoices/new?customerId=${order.customer_id}&orderId=${id}`}
                  className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
                >
                  + Create Invoice
                </Link>
              )}
            </div>
            {!orderInvoices || orderInvoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">No invoices yet.</p>
            ) : (
              <ul className="space-y-2">
                {orderInvoices.map((inv: any) => (
                  <li key={inv.id} className="flex items-center justify-between text-sm">
                    <Link
                      to={`/invoices/${inv.id}`}
                      className="font-mono text-primary hover:underline"
                    >
                      {inv.invoice_number}
                    </Link>
                    <div className="flex items-center gap-3 text-muted-foreground text-xs">
                      <span className="capitalize">{inv.status?.replace(/_/g, ' ')}</span>
                      <span>{formatCurrency(inv.total_minor)}</span>
                      {inv.balance_minor > 0 && (
                        <span className="text-amber-600">
                          Due: {formatCurrency(inv.balance_minor)}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Notes */}
          <div className="rounded border border-border p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-medium">Notes</h2>
              {!editNotes && (
                <button
                  onClick={() => {
                    setNotesValue(order.notes ?? '');
                    setEditNotes(true);
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Edit
                </button>
              )}
            </div>
            {editNotes ? (
              <div className="space-y-2">
                <textarea
                  value={notesValue}
                  onChange={(e) => setNotesValue(e.target.value)}
                  rows={4}
                  className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                />
                <div className="flex gap-2">
                  <button
                    onClick={doSaveNotes}
                    disabled={updateOrder.isPending}
                    className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditNotes(false)}
                    className="rounded border border-border px-3 py-1 text-xs hover:bg-muted"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {order.notes || 'No notes.'}
              </p>
            )}
          </div>

          {/* Activity timeline */}
          <div className="rounded border border-border p-4">
            <h2 className="mb-3 font-medium">Activity</h2>
            {!activities || activities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              <ul className="space-y-3">
                {activities.map((a: any) => (
                  <li key={a.id} className="flex gap-3 text-sm">
                    <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-muted-foreground/40 ring-4 ring-background" />
                    <div className="min-w-0">
                      <p className="font-medium">{a.subject}</p>
                      {a.body && <p className="text-muted-foreground text-xs mt-0.5">{a.body}</p>}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {a.actor?.full_name ?? 'System'} · {formatDateTime(a.occurred_at)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {owner && (
            <div className="rounded border border-border p-4">
              <h3 className="mb-2 text-sm font-medium">Owner</h3>
              <p className="text-sm">{owner.full_name}</p>
            </div>
          )}
          <div className="rounded border border-border p-4">
            <h3 className="mb-3 text-sm font-medium">Key Dates</h3>
            <dl className="space-y-2 text-sm">
              <dt className="text-muted-foreground">Order Date</dt>
              <dd>{formatDate(order.order_date)}</dd>
              <dt className="text-muted-foreground">Target Completion</dt>
              <dd>{formatDate(order.target_completion_date) ?? '—'}</dd>
              <dt className="text-muted-foreground">Created</dt>
              <dd>{formatDate(order.created_at)}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

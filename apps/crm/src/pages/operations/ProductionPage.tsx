/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { formatDate } from '@/lib/format';

// ── Types ─────────────────────────────────────────────────────────────────────

type ProductionStatus = 'design_or_measurement' | 'production' | 'ready_for_installation';

interface ProductionOrder {
  id: string;
  order_number: string | null;
  status: ProductionStatus;
  target_completion_date: string | null;
  created_at: string;
  customer: { id: string; display_name: string } | null;
  project: { id: string; project_number: string | null; name: string | null } | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STAGES: { status: ProductionStatus; label: string; next: ProductionStatus | null }[] = [
  { status: 'design_or_measurement', label: 'Design / Measurement', next: 'production' },
  { status: 'production', label: 'In Production', next: 'ready_for_installation' },
  { status: 'ready_for_installation', label: 'Ready for Install', next: null },
];

const CAN_ADVANCE_ROLES = new Set(['admin', 'manager', 'operations']);

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonSection() {
  return (
    <div className="mb-8">
      <div className="mb-3 h-6 w-48 animate-pulse rounded bg-muted" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-lg border border-border p-4 space-y-2">
            <div className="h-4 w-32 rounded bg-muted" />
            <div className="h-3 w-48 rounded bg-muted" />
            <div className="h-3 w-40 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Order Card ────────────────────────────────────────────────────────────────

interface OrderCardProps {
  order: ProductionOrder;
  nextStatus: ProductionStatus | null;
  canAdvance: boolean;
  onAdvance: (id: string, next: ProductionStatus) => void;
  advancing: string | null;
}

function OrderCard({ order, nextStatus, canAdvance, onAdvance, advancing }: OrderCardProps) {
  const customer = order.customer;
  const project = order.project;
  const projectLabel = [project?.project_number, project?.name].filter(Boolean).join(' — ');
  const isAdvancing = advancing === order.id;

  return (
    <div className="rounded-lg border border-border bg-card p-4 flex flex-col gap-2 shadow-sm">
      {/* Order number */}
      <div className="flex items-start justify-between gap-2">
        <Link
          to={`/orders/${order.id}`}
          className="font-mono text-sm font-semibold text-primary hover:underline"
        >
          {order.order_number ?? order.id.slice(0, 8)}
        </Link>
      </div>

      {/* Customer */}
      <p className="text-sm text-foreground">
        {customer ? (
          <Link to={`/customers/${customer.id}`} className="hover:underline">
            {customer.display_name}
          </Link>
        ) : (
          <span className="text-muted-foreground">No customer</span>
        )}
      </p>

      {/* Project */}
      {project && (
        <p className="text-xs text-muted-foreground">
          <Link to={`/projects/${project.id}`} className="hover:underline">
            {projectLabel || 'Unnamed project'}
          </Link>
        </p>
      )}

      {/* Delivery date */}
      <p className="text-xs text-muted-foreground">
        {order.target_completion_date
          ? `Delivery: ${formatDate(order.target_completion_date)}`
          : 'No delivery date'}
      </p>

      {/* Advance button + Create Invoice shortcut */}
      <div className="mt-1 pt-2 border-t border-border flex flex-wrap gap-2">
        {canAdvance && nextStatus && (
          <button
            onClick={() => onAdvance(order.id, nextStatus)}
            disabled={isAdvancing}
            className="rounded bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isAdvancing ? 'Moving…' : 'Move to next stage'}
          </button>
        )}
        {order.status === 'ready_for_installation' && customer && (
          <Link
            to={`/invoices/new?customerId=${customer.id}&orderId=${order.id}`}
            className="rounded border border-border px-3 py-1 text-xs hover:bg-muted"
          >
            + Invoice
          </Link>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProductionPage() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [advancing, setAdvancing] = useState<string | null>(null);

  const canAdvance = profile?.role ? CAN_ADVANCE_ROLES.has(profile.role) : false;

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('orders')
      .select(
        `
        id, order_number, status, target_completion_date, created_at,
        customer:customers!customer_id(id, display_name),
        project:projects!order_id(id, project_number, name)
      `
      )
      .in('status', ['design_or_measurement', 'production', 'ready_for_installation'])
      .order('created_at', { ascending: false })
      .limit(100);

    if (err) {
      setError(err.message);
    } else {
      setOrders((data as any[]) ?? []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  const handleAdvance = async (orderId: string, nextStatus: ProductionStatus) => {
    setAdvancing(orderId);
    const { error: err } = await supabase
      .from('orders')
      .update({ status: nextStatus })
      .eq('id', orderId)
      .select()
      .single();

    if (err) {
      console.error('[ProductionPage] Failed to advance order:', err.message);
    } else {
      // Optimistically update local state
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o)));
    }
    setAdvancing(null);
  };

  if (error) {
    return (
      <div className="flex h-40 items-center justify-center p-8 text-center">
        <p className="text-sm text-destructive">Failed to load production orders: {error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Production</h1>
        </div>
        <SkeletonSection />
        <SkeletonSection />
        <SkeletonSection />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Production</h1>
        </div>
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <p className="text-muted-foreground">No orders currently in production.</p>
          <Link to="/orders" className="text-sm text-primary hover:underline">
            View all orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Production</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {orders.length} order{orders.length !== 1 ? 's' : ''} in pipeline
        </p>
      </div>

      {/* Sections */}
      {STAGES.map(({ status, label, next }) => {
        const stageOrders = orders.filter((o) => o.status === status);
        return (
          <section key={status} className="mb-8">
            {/* Section header */}
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-base font-semibold">{label}</h2>
              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {stageOrders.length}
              </span>
            </div>

            {/* Cards grid */}
            {stageOrders.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border px-4 py-6 text-sm text-center text-muted-foreground">
                No orders in this stage
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {stageOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    nextStatus={next}
                    canAdvance={canAdvance}
                    onAdvance={handleAdvance}
                    advancing={advancing}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

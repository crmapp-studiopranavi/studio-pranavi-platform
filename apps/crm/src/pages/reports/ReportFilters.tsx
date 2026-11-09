import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { ReportFiltersState } from '@/lib/reports/report-types';

interface Props {
  filters: ReportFiltersState;
  onChange: (f: ReportFiltersState) => void;
  show: {
    source?: boolean;
    service?: boolean;
    owner?: boolean;
    projectStatus?: boolean;
    customer?: boolean;
  };
}

interface SelectOption {
  value: string;
  label: string;
}

const PROJECT_STATUSES = ['planned', 'active', 'blocked', 'on_hold', 'completed', 'cancelled'];

export function ReportFilters({ filters, onChange, show }: Props) {
  const [services, setServices] = useState<SelectOption[]>([]);
  const [owners, setOwners] = useState<SelectOption[]>([]);
  const [customers, setCustomers] = useState<SelectOption[]>([]);

  useEffect(() => {
    if (show.service) {
      supabase
        .from('services')
        .select('id, title')
        .eq('status', 'published')
        .order('title')
        .then(({ data }) =>
          setServices((data ?? []).map((s) => ({ value: s.id, label: s.title })))
        );
    }
    if (show.owner) {
      supabase
        .from('profiles')
        .select('id, full_name')
        .eq('is_active', true)
        .order('full_name')
        .then(({ data }) =>
          setOwners((data ?? []).map((p) => ({ value: p.id, label: p.full_name })))
        );
    }
    if (show.customer) {
      supabase
        .from('customers')
        .select('id, display_name')
        .order('display_name')
        .limit(200)
        .then(({ data }) =>
          setCustomers((data ?? []).map((c) => ({ value: c.id, label: c.display_name })))
        );
    }
  }, [show.service, show.owner, show.customer]);

  function set(key: keyof ReportFiltersState, value: string) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="flex flex-wrap gap-3 rounded-lg border bg-card px-4 py-3">
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">From</label>
        <input
          type="date"
          value={filters.from}
          onChange={(e) => set('from', e.target.value)}
          className="rounded border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">To</label>
        <input
          type="date"
          value={filters.to}
          onChange={(e) => set('to', e.target.value)}
          className="rounded border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {show.source && (
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-muted-foreground">Source</label>
          <select
            value={filters.source}
            onChange={(e) => set('source', e.target.value)}
            className="rounded border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All sources</option>
            {[
              'website',
              'referral',
              'social_media',
              'cold_outreach',
              'exhibition',
              'partner',
              'other',
            ].map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
      )}

      {show.service && services.length > 0 && (
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-muted-foreground">Service</label>
          <select
            value={filters.serviceId}
            onChange={(e) => set('serviceId', e.target.value)}
            className="rounded border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All services</option>
            {services.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {show.owner && owners.length > 0 && (
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-muted-foreground">Owner</label>
          <select
            value={filters.ownerId}
            onChange={(e) => set('ownerId', e.target.value)}
            className="rounded border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All owners</option>
            {owners.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {show.projectStatus && (
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-muted-foreground">Status</label>
          <select
            value={filters.projectStatus}
            onChange={(e) => set('projectStatus', e.target.value)}
            className="rounded border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All statuses</option>
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
      )}

      {show.customer && customers.length > 0 && (
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-muted-foreground">Customer</label>
          <select
            value={filters.customerId}
            onChange={(e) => set('customerId', e.target.value)}
            className="rounded border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All customers</option>
            {customers.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <button
        onClick={() =>
          onChange({
            from: '',
            to: '',
            source: '',
            serviceId: '',
            ownerId: '',
            projectStatus: '',
            customerId: '',
          })
        }
        className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        Clear filters
      </button>
    </div>
  );
}

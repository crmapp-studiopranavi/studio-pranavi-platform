import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

function useGlobalSearch(query: string) {
  return useQuery({
    queryKey: ['global-search', query],
    queryFn: async () => {
      if (query.length < 2)
        return { leads: [], customers: [], quotes: [], orders: [], projects: [] };
      const q = `%${query}%`;
      const [leads, customers, quotes, orders, projects] = await Promise.all([
        supabase.from('leads').select('id, full_name, status').ilike('full_name', q).limit(5),
        supabase.from('customers').select('id, display_name').ilike('display_name', q).limit(5),
        supabase
          .from('quotes')
          .select('id, quote_number, status')
          .ilike('quote_number', q)
          .limit(5),
        supabase
          .from('orders')
          .select('id, order_number, status')
          .ilike('order_number', q)
          .limit(5),
        supabase
          .from('projects')
          .select('id, project_number, name')
          .or(`name.ilike.${q},project_number.ilike.${q}`)
          .limit(5),
      ]);
      return {
        leads: leads.data ?? [],
        customers: customers.data ?? [],
        quotes: quotes.data ?? [],
        orders: orders.data ?? [],
        projects: projects.data ?? [],
      };
    },
    enabled: query.length >= 2,
    staleTime: 30_000,
  });
}

interface SearchResult {
  id: string;
  label: string;
  sublabel?: string;
  to: string;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { data, isFetching } = useGlobalSearch(query);

  // Cmd+K / Ctrl+K to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const groups: { label: string; items: SearchResult[] }[] = [];
  if (data) {
    if (data.leads.length)
      groups.push({
        label: 'Leads',
        items: data.leads.map((l) => ({
          id: l.id,
          label: l.full_name,
          sublabel: l.status,
          to: `/leads/${l.id}`,
        })),
      });
    if (data.customers.length)
      groups.push({
        label: 'Customers',
        items: data.customers.map((c) => ({
          id: c.id,
          label: c.display_name,
          to: `/customers/${c.id}`,
        })),
      });
    if (data.quotes.length)
      groups.push({
        label: 'Quotes',
        items: data.quotes.map((q) => ({
          id: q.id,
          label: q.quote_number,
          sublabel: q.status,
          to: `/quotes/${q.id}`,
        })),
      });
    if (data.orders.length)
      groups.push({
        label: 'Orders',
        items: data.orders.map((o) => ({
          id: o.id,
          label: o.order_number,
          sublabel: o.status,
          to: `/orders/${o.id}`,
        })),
      });
    if (data.projects.length)
      groups.push({
        label: 'Projects',
        items: data.projects.map((p) => ({
          id: p.id,
          label: p.name,
          sublabel: p.project_number,
          to: `/projects/${p.id}`,
        })),
      });
  }

  const go = useCallback(
    (to: string) => {
      navigate(to);
      setOpen(false);
      setQuery('');
    },
    [navigate]
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24"
      onClick={() => setOpen(false)}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg bg-background rounded-lg shadow-xl border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Search leads, customers, quotes, orders, projects..."
            className="flex-1 bg-transparent outline-none text-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {isFetching && <span className="text-xs text-muted-foreground">Searching…</span>}
          <button onClick={() => setOpen(false)}>
            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {query.length < 2 && (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Type at least 2 characters to search.
            </p>
          )}
          {query.length >= 2 && groups.length === 0 && !isFetching && (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No results for "{query}".
            </p>
          )}
          {groups.map((group) => (
            <div key={group.label}>
              <div className="px-4 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50">
                {group.label}
              </div>
              {group.items.map((item) => (
                <button
                  key={item.id}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-accent transition-colors"
                  onClick={() => go(item.to)}
                >
                  <span className="text-sm font-medium">{item.label}</span>
                  {item.sublabel && (
                    <span className="text-xs text-muted-foreground">{item.sublabel}</span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

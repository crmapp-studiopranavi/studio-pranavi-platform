import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCustomers } from '@/lib/hooks/use-customers';
import { formatDate } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';

export function CustomersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const { data, isLoading } = useCustomers({ search, page });

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Customers</h1>
      </div>

      <div className="mb-4">
        <input
          type="search"
          placeholder="Search by name…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          className="rounded border border-border bg-background px-3 py-1.5 text-sm w-64"
        />
      </div>

      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="px-4 py-2 text-left">#</th>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Type</th>
              <th className="px-4 py-2 text-left">Primary Contact</th>
              <th className="px-4 py-2 text-left">Owner</th>
              <th className="px-4 py-2 text-left">Created</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t border-border">
                  {Array.from({ length: 7 }).map((__, j) => (
                    <td key={j} className="px-4 py-2">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  ))}
                </tr>
              ))}
            {!isLoading &&
              (data?.customers ?? []).map((customer) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const contact = (customer as any).primary_contact as {
                  full_name: string | null;
                  email: string | null;
                  phone: string | null;
                } | null;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const owner = (customer as any).owner as { full_name: string | null } | null;
                return (
                  <tr key={customer.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-4 py-2 text-muted-foreground">{customer.customer_number}</td>
                    <td className="px-4 py-2 font-medium">
                      <Link
                        to={`/customers/${customer.id}`}
                        className="hover:underline text-primary"
                      >
                        {customer.display_name}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground capitalize">
                      {customer.customer_type ?? '—'}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {contact ? (
                        <span>
                          {contact.full_name}
                          {contact.phone && <span className="ml-1 text-xs">· {contact.phone}</span>}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{owner?.full_name ?? '—'}</td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {formatDate(customer.created_at)}
                    </td>
                    <td className="px-4 py-2">
                      <Link
                        to={`/customers/${customer.id}`}
                        className="text-xs text-primary hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            {!isLoading && data?.customers.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  No customers yet. Convert a lead to create your first customer.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-3 flex items-center gap-3 text-sm">
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="rounded border border-border px-3 py-1 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            className="rounded border border-border px-3 py-1 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

import { Link, useMatches } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export type BreadcrumbHandle = { crumb: string };

export function Breadcrumbs() {
  const matches = useMatches();
  const crumbs = matches
    .filter((m) => (m.handle as BreadcrumbHandle | undefined)?.crumb)
    .map((m) => ({
      to: m.pathname,
      label: (m.handle as BreadcrumbHandle).crumb,
    }));

  if (crumbs.length <= 1) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-4 flex items-center gap-1 text-sm text-muted-foreground"
    >
      {crumbs.map((c, i) => (
        <span key={c.to} className="flex items-center gap-1">
          {i < crumbs.length - 1 ? (
            <Link to={c.to} className="hover:text-foreground transition-colors">
              {c.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">{c.label}</span>
          )}
          {i < crumbs.length - 1 && <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />}
        </span>
      ))}
    </nav>
  );
}

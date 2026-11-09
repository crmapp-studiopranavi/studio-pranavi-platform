import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface ExpertiseTileProps {
  slug: string;
  title: string;
  description?: string | null;
  className?: string;
}

export function ExpertiseTile({ slug, title, description, className }: ExpertiseTileProps) {
  return (
    <Link
      to={`/expertise/${slug}`}
      className={cn(
        'group flex flex-col rounded-[var(--sp-radius-ui)] border border-[var(--sp-border)] bg-white p-6 shadow-[var(--sp-shadow-card)] transition-shadow duration-[200ms] hover:shadow-[var(--sp-shadow-elevated)]',
        className
      )}
    >
      <h3 className="font-display text-[var(--sp-text-h3)] font-semibold leading-snug tracking-[-0.01em] text-brand-charcoal">
        {title}
      </h3>
      {description && (
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-[var(--sp-text-muted)]">
          {description}
        </p>
      )}
      <span
        className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-brand-amber transition-gap group-hover:gap-2.5"
        aria-hidden="true"
      >
        Learn More
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path
            d="M2 6h8M6 2l4 4-4 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </Link>
  );
}

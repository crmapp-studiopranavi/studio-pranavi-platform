import { Link } from 'react-router-dom';
import { ImagePlaceholder } from './image-placeholder';
import { cn } from '@/lib/utils';

interface ProjectCardProps {
  slug: string;
  title: string;
  summary?: string | null;
  category?: string | null;
  coverImagePath?: string | null;
  className?: string;
  size?: 'default' | 'large';
}

export function ProjectCard({
  slug,
  title,
  summary,
  category,
  coverImagePath,
  className,
  size = 'default',
}: ProjectCardProps) {
  return (
    <Link
      to={`/projects/${slug}`}
      className={cn(
        'group block overflow-hidden rounded-[var(--sp-radius-img)] bg-brand-stone',
        className
      )}
      aria-label={`View project: ${title}`}
    >
      <div
        className={cn(
          'relative overflow-hidden',
          size === 'large' ? 'aspect-[4/3]' : 'aspect-[3/2]'
        )}
      >
        <ImagePlaceholder
          src={coverImagePath}
          alt={title}
          className="transition-transform duration-[600ms] ease-out group-hover:scale-[1.03]"
          loading="lazy"
        />
        {category && (
          <span
            className="absolute left-4 top-4 rounded-[var(--sp-radius-badge)] bg-brand-charcoal/80 px-2.5 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-brand-ivory backdrop-blur-sm"
            aria-hidden="true"
          >
            {category}
          </span>
        )}
      </div>

      <div className="px-1 pb-1 pt-4">
        <h3 className="font-display text-[var(--sp-text-h3)] font-semibold leading-snug tracking-[-0.01em] text-brand-charcoal">
          {title}
        </h3>
        {summary && (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-[var(--sp-text-muted)]">
            {summary}
          </p>
        )}
        <span
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-brand-amber"
          aria-hidden="true"
        >
          View Project
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
      </div>
    </Link>
  );
}

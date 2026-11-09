import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageMeta } from '@/components/ui/page-meta';
import { Skeleton } from '@/components/ui/skeleton';
import { usePortfolioProjects } from '@/lib/hooks/use-portfolio';
import { cn } from '@/lib/utils';

export function PortfolioPage() {
  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined);
  const { data: allProjects } = usePortfolioProjects();
  const { data: filteredProjects, isLoading, isError } = usePortfolioProjects(activeCategory);

  // Derive unique categories from unfiltered data
  const categories = allProjects
    ? Array.from(new Set(allProjects.map((p) => p.category).filter(Boolean)))
    : [];

  return (
    <>
      <PageMeta
        title="Portfolio"
        description="Browse our portfolio of custom decorative glass and lighting installations."
        path="/portfolio"
      />

      {/* Page header */}
      <section className="bg-brand-charcoal py-16 text-brand-ivory">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl font-semibold">Our Portfolio</h1>
          <p className="mt-4 max-w-2xl text-brand-ivory/70">
            Every piece tells a story. Explore our completed projects.
          </p>
        </div>
      </section>

      <section className="bg-brand-ivory py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Category filter pills */}
          {categories.length > 0 && (
            <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
              <button
                type="button"
                onClick={() => setActiveCategory(undefined)}
                className={cn(
                  'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                  activeCategory === undefined
                    ? 'bg-brand-charcoal text-brand-ivory'
                    : 'bg-card border border-border text-muted-foreground hover:bg-secondary'
                )}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat ?? undefined)}
                  className={cn(
                    'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                    activeCategory === cat
                      ? 'bg-brand-charcoal text-brand-ivory'
                      : 'bg-card border border-border text-muted-foreground hover:bg-secondary'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {isError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              Unable to load portfolio. Please try again later.
            </div>
          )}

          {isLoading && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
                >
                  <Skeleton className="h-56 w-full rounded-none" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && filteredProjects && filteredProjects.length === 0 && (
            <div className="py-16 text-center text-muted-foreground">
              {activeCategory
                ? `No projects in the "${activeCategory}" category yet.`
                : 'No portfolio projects have been published yet. Check back soon.'}
            </div>
          )}

          {!isLoading && filteredProjects && filteredProjects.length > 0 && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map((project) => (
                <Link
                  key={project.id}
                  to={`/portfolio/${project.slug}`}
                  className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="relative h-56 overflow-hidden bg-muted">
                    {project.cover_image_path ? (
                      <img
                        src={project.cover_image_path}
                        alt={project.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                        No image
                      </div>
                    )}
                    {project.category && (
                      <span className="absolute top-3 left-3 rounded-full bg-background/90 px-2.5 py-0.5 text-xs font-medium">
                        {project.category}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h2 className="font-display text-base font-semibold">{project.title}</h2>
                    {project.summary && (
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                        {project.summary}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

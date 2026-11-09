import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageMeta } from '@/components/ui/page-meta';
import { SectionReveal } from '@/components/ui/section-reveal';
import { ProjectCard } from '@/components/ui/project-card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePortfolioProjects } from '@/lib/hooks/use-portfolio';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { value: undefined, label: 'All' },
  { value: 'Residential', label: 'Residential' },
  { value: 'Hospitality', label: 'Hospitality' },
  { value: 'Commercial', label: 'Commercial' },
  { value: 'Decorative Lighting', label: 'Decorative Lighting' },
  { value: 'Custom Glass', label: 'Custom Glass' },
];

export function ProjectsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const paramCategory = searchParams.get('category') ?? undefined;
  const [activeCategory, setActiveCategory] = useState<string | undefined>(paramCategory);

  const { data: allProjects } = usePortfolioProjects();
  const { data: filteredProjects, isLoading, isError } = usePortfolioProjects(activeCategory);

  // Derive categories present in data, merged with curated list
  const dataCategories = allProjects
    ? Array.from(new Set(allProjects.map((p) => p.category).filter(Boolean) as string[]))
    : [];

  const visibleCategories = CATEGORIES.filter(
    (c) => c.value === undefined || dataCategories.includes(c.value)
  );

  useEffect(() => {
    setActiveCategory(paramCategory);
  }, [paramCategory]);

  function handleCategory(cat: string | undefined) {
    setActiveCategory(cat);
    if (cat) {
      setSearchParams({ category: cat }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }

  return (
    <>
      <PageMeta
        title="Projects"
        description="Explore Studio Pranavi's portfolio of bespoke architectural lighting and custom glass installations."
        path="/projects"
      />

      {/* Page header */}
      <section className="bg-brand-charcoal sp-section-sm" aria-label="Projects header">
        <div className="sp-container">
          <SectionReveal>
            <p className="sp-label-upper mb-3 text-brand-amber">Projects</p>
            <h1
              className="font-display font-semibold tracking-[-0.02em] text-brand-ivory"
              style={{ fontSize: 'var(--sp-text-display-lg)', lineHeight: '1.15' }}
            >
              Every piece tells a story.
            </h1>
            <p
              className="mt-4 max-w-xl text-brand-ivory/65"
              style={{ fontSize: 'var(--sp-text-body-lg)' }}
            >
              A selection of completed installations — each shaped by the space it inhabits and the
              people who live or work within it.
            </p>
          </SectionReveal>
        </div>
      </section>

      {/* Projects grid */}
      <section className="bg-brand-ivory sp-section" aria-label="Projects listing">
        <div className="sp-container">
          {/* Category filter */}
          {visibleCategories.length > 1 && (
            <div
              className="mb-12 flex flex-wrap gap-2"
              role="group"
              aria-label="Filter projects by category"
            >
              {visibleCategories.map((cat) => (
                <button
                  key={cat.label}
                  type="button"
                  onClick={() => handleCategory(cat.value)}
                  aria-pressed={activeCategory === cat.value}
                  className={cn(
                    'rounded-[var(--sp-radius-badge)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] transition-colors duration-150',
                    activeCategory === cat.value
                      ? 'bg-brand-charcoal text-brand-ivory'
                      : 'border border-[var(--sp-border)] bg-white text-[var(--sp-text-muted)] hover:border-brand-charcoal/40 hover:text-brand-charcoal'
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}

          {isError && (
            <div className="rounded-[var(--sp-radius-ui)] border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              Unable to load projects. Please try again later.
            </div>
          )}

          {isLoading && (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="aspect-[3/2] w-full rounded-[var(--sp-radius-img)]" />
                  <div className="mt-4 space-y-2 px-1">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && filteredProjects && filteredProjects.length === 0 && (
            <div className="py-20 text-center text-[var(--sp-text-muted)]">
              {activeCategory
                ? `No projects in "${activeCategory}" yet.`
                : 'No projects have been published yet. Check back soon.'}
            </div>
          )}

          {!isLoading && filteredProjects && filteredProjects.length > 0 && (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map((project, i) => (
                <SectionReveal key={project.id} delay={Math.min(i, 5) * 60}>
                  <ProjectCard
                    slug={project.slug}
                    title={project.title}
                    summary={project.summary}
                    category={project.category}
                    coverImagePath={project.cover_image_path}
                  />
                </SectionReveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

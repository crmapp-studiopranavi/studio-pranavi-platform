import { Link, useParams, Navigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Calendar } from 'lucide-react';
import { Button } from '@platform/ui';
import { PageMeta } from '@/components/ui/page-meta';
import { Skeleton } from '@/components/ui/skeleton';
import { SectionReveal } from '@/components/ui/section-reveal';
import { ImagePlaceholder } from '@/components/ui/image-placeholder';
import { useProjectBySlug } from '@/lib/hooks/use-portfolio';

type GalleryImage = {
  id: string;
  storage_path: string;
  alt_text: string;
  caption: string | null;
  sort_order: number;
};

export function ProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: project, isLoading, isError } = useProjectBySlug(slug);

  if (!isLoading && !isError && project === null) {
    return <Navigate to="/projects" replace />;
  }

  return (
    <>
      {project && (
        <PageMeta
          title={project.title}
          description={project.summary ?? undefined}
          path={`/projects/${project.slug}`}
        />
      )}

      {isLoading && (
        <>
          <div className="bg-brand-charcoal" style={{ height: '60vh' }}>
            <Skeleton className="h-full w-full rounded-none" />
          </div>
          <div className="sp-container sp-section-sm">
            <Skeleton className="mb-4 h-8 w-64" />
            <Skeleton className="h-5 w-full max-w-xl" />
            <Skeleton className="mt-2 h-5 w-full max-w-lg" />
          </div>
        </>
      )}

      {isError && (
        <div className="sp-container sp-section">
          <div className="rounded-[var(--sp-radius-ui)] border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            Unable to load project details. Please try again later.
          </div>
        </div>
      )}

      {!isLoading && project && (
        <>
          {/* Full-screen hero */}
          <section
            className="relative flex min-h-[65vh] items-end bg-brand-charcoal pb-12"
            aria-label={`${project.title} hero`}
          >
            <div className="absolute inset-0 overflow-hidden">
              <ImagePlaceholder
                src={project.cover_image_path}
                alt={project.title}
                className="opacity-60"
                loading="eager"
                fetchpriority="high"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-charcoal/80 via-brand-charcoal/20 to-transparent" />
            </div>

            <div className="sp-container relative z-10">
              <Link
                to="/projects"
                className="mb-8 inline-flex items-center gap-1.5 text-sm text-brand-ivory/60 hover:text-brand-ivory transition-colors"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                All Projects
              </Link>

              {project.category && (
                <p className="sp-label-upper mb-3 text-brand-amber">{project.category}</p>
              )}
              <h1
                className="font-display font-semibold tracking-[-0.02em] text-brand-ivory"
                style={{ fontSize: 'var(--sp-text-display-lg)', lineHeight: '1.15' }}
              >
                {project.title}
              </h1>
              {project.summary && (
                <p
                  className="mt-4 max-w-2xl text-brand-ivory/70"
                  style={{ fontSize: 'var(--sp-text-body-lg)' }}
                >
                  {project.summary}
                </p>
              )}
            </div>
          </section>

          {/* Project brief */}
          {project.description && (
            <section className="bg-brand-ivory sp-section" aria-label="Project description">
              <div className="sp-container">
                <div className="grid grid-cols-1 gap-16 lg:grid-cols-3">
                  <SectionReveal className="lg:col-span-2">
                    <p className="sp-label-upper mb-5 text-brand-amber">The Brief</p>
                    <p
                      className="leading-relaxed text-brand-charcoal"
                      style={{ fontSize: 'var(--sp-text-body-lg)' }}
                    >
                      {project.description}
                    </p>
                  </SectionReveal>

                  <aside aria-label="Project details">
                    <SectionReveal
                      delay={120}
                      className="rounded-[var(--sp-radius-ui)] border border-[var(--sp-border)] bg-white p-6 shadow-[var(--sp-shadow-card)]"
                    >
                      <h2 className="sp-label-upper mb-5 text-[var(--sp-text-muted)]">
                        Project Details
                      </h2>
                      <dl className="space-y-4 text-sm">
                        {project.category && (
                          <div>
                            <dt className="text-[var(--sp-text-muted)]">Category</dt>
                            <dd className="mt-0.5 font-medium text-brand-charcoal">
                              {project.category}
                            </dd>
                          </div>
                        )}
                        {project.completed_on && (
                          <div>
                            <dt className="text-[var(--sp-text-muted)]">Completed</dt>
                            <dd className="mt-0.5 flex items-center gap-1.5 font-medium text-brand-charcoal">
                              <Calendar
                                className="h-3.5 w-3.5 text-brand-amber"
                                aria-hidden="true"
                              />
                              {new Date(project.completed_on).toLocaleDateString('en-IN', {
                                year: 'numeric',
                                month: 'long',
                              })}
                            </dd>
                          </div>
                        )}
                      </dl>

                      <div className="mt-8 border-t border-[var(--sp-border)] pt-6">
                        <p className="text-sm font-semibold text-brand-charcoal">
                          Like what you see?
                        </p>
                        <p className="mt-1.5 text-xs leading-relaxed text-[var(--sp-text-muted)]">
                          We can create something similar — or entirely unique — for your space.
                        </p>
                        <Button
                          asChild
                          className="mt-4 w-full bg-brand-amber text-brand-charcoal hover:bg-brand-brass"
                        >
                          <Link to="/start-a-project">
                            Start a Project
                            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                          </Link>
                        </Button>
                      </div>
                    </SectionReveal>
                  </aside>
                </div>
              </div>
            </section>
          )}

          {/* Gallery */}
          {Array.isArray(project.portfolio_images) && project.portfolio_images.length > 0 && (
            <section className="bg-[var(--sp-stone)] sp-section" aria-label="Project gallery">
              <div className="sp-container">
                <SectionReveal>
                  <p className="sp-label-upper mb-5 text-brand-amber">Gallery</p>
                </SectionReveal>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {(project.portfolio_images as GalleryImage[])
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map((img, i) => (
                      <SectionReveal
                        key={img.id}
                        delay={Math.min(i, 5) * 60}
                        className="aspect-square overflow-hidden rounded-[var(--sp-radius-img)]"
                      >
                        <ImagePlaceholder
                          src={img.storage_path}
                          alt={img.alt_text || img.caption || project.title}
                          loading="lazy"
                        />
                      </SectionReveal>
                    ))}
                </div>
              </div>
            </section>
          )}

          {/* Bottom CTA */}
          <section className="bg-brand-charcoal sp-section" aria-label="Project CTA">
            <div className="sp-container">
              <SectionReveal className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2
                    className="font-display font-semibold tracking-[-0.01em] text-brand-ivory"
                    style={{ fontSize: 'var(--sp-text-h1)' }}
                  >
                    Ready to start your own project?
                  </h2>
                  <p className="mt-2 text-brand-ivory/60">
                    Tell us about your space and we'll begin a conversation.
                  </p>
                </div>
                <Button
                  asChild
                  size="lg"
                  className="shrink-0 bg-brand-amber text-brand-charcoal hover:bg-brand-brass"
                >
                  <Link to="/start-a-project">
                    Start a Project
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              </SectionReveal>
            </div>
          </section>
        </>
      )}
    </>
  );
}

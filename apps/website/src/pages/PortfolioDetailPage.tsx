import { Link, useParams, Navigate } from 'react-router-dom';
import { Button } from '@platform/ui';
import { ArrowLeft, ArrowRight, Calendar } from 'lucide-react';
import { PageMeta } from '@/components/ui/page-meta';
import { Skeleton } from '@/components/ui/skeleton';
import { useProjectBySlug } from '@/lib/hooks/use-portfolio';

export function PortfolioDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: project, isLoading, isError } = useProjectBySlug(slug);

  if (!isLoading && !isError && project === null) {
    return <Navigate to="/portfolio" replace />;
  }

  return (
    <>
      {project && (
        <PageMeta
          title={project.title}
          description={project.summary ?? undefined}
          path={`/portfolio/${project.slug}`}
        />
      )}

      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <Link
          to="/portfolio"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-8"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          All Projects
        </Link>

        {isError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            Unable to load project details. Please try again later.
          </div>
        )}

        {isLoading && (
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-72 w-full rounded-xl" />
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
            <div className="rounded-xl border border-border bg-card p-6 space-y-3 h-fit">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        )}

        {!isLoading && project && (
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
            {/* Main content */}
            <div className="lg:col-span-2">
              {/* Cover image */}
              {project.cover_image_path && (
                <div className="mb-8 overflow-hidden rounded-xl h-72 bg-muted">
                  <img
                    src={project.cover_image_path}
                    alt={project.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              <h1 className="font-display text-3xl font-semibold sm:text-4xl">{project.title}</h1>
              {project.summary && (
                <p className="mt-4 text-lg text-muted-foreground">{project.summary}</p>
              )}
              {project.description && (
                <div className="mt-6 text-foreground text-sm leading-relaxed">
                  <p>{project.description}</p>
                </div>
              )}

              {/* Gallery */}
              {Array.isArray(project.portfolio_images) && project.portfolio_images.length > 0 && (
                <div className="mt-10">
                  <h2 className="font-display text-xl font-semibold mb-4">Gallery</h2>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {(
                      project.portfolio_images as Array<{
                        id: string;
                        storage_path: string;
                        alt_text: string;
                        caption: string | null;
                        sort_order: number;
                      }>
                    )
                      .sort((a, b) => a.sort_order - b.sort_order)
                      .map((img) => (
                        <div
                          key={img.id}
                          className="overflow-hidden rounded-lg aspect-square bg-muted"
                        >
                          <img
                            src={img.storage_path}
                            alt={img.alt_text || img.caption || project.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              {/* Project details */}
              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="font-display text-base font-semibold mb-4">Project Details</h2>
                <dl className="space-y-3 text-sm">
                  {project.category && (
                    <div>
                      <dt className="text-muted-foreground">Category</dt>
                      <dd className="font-medium mt-0.5">{project.category}</dd>
                    </div>
                  )}
                  {project.completed_on && (
                    <div className="flex items-start gap-2">
                      <Calendar
                        className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <div>
                        <dt className="sr-only">Completed</dt>
                        <dd className="font-medium">
                          {new Date(project.completed_on).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'long',
                          })}
                        </dd>
                      </div>
                    </div>
                  )}
                </dl>
              </div>

              {/* CTA */}
              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="font-display text-base font-semibold">Like what you see?</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  We can create something similar — or completely unique — for your space.
                </p>
                <Button
                  asChild
                  className="mt-4 w-full bg-brand-amber text-white hover:bg-brand-brass"
                >
                  <Link to="/get-a-quote">
                    Get a Quote
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </aside>
          </div>
        )}
      </div>
    </>
  );
}

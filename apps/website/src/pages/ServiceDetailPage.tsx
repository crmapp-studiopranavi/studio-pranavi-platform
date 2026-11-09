import { Link, useParams, Navigate } from 'react-router-dom';
import { Button } from '@platform/ui';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { PageMeta } from '@/components/ui/page-meta';
import { Skeleton } from '@/components/ui/skeleton';
import { useServiceBySlug } from '@/lib/hooks/use-services';

export function ServiceDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: service, isLoading, isError } = useServiceBySlug(slug);

  if (!isLoading && !isError && service === null) {
    return <Navigate to="/services" replace />;
  }

  return (
    <>
      {service && (
        <PageMeta
          title={service.title}
          description={service.short_description ?? undefined}
          path={`/services/${service.slug}`}
        />
      )}

      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <Link
          to="/services"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-8"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          All Services
        </Link>

        {isError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            Unable to load service details. Please try again later.
          </div>
        )}

        {isLoading && (
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
            <div className="rounded-xl border border-border bg-card p-6 space-y-4 h-fit">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        )}

        {!isLoading && service && (
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
            {/* Main content */}
            <div className="lg:col-span-2">
              {service.hero_image_path && (
                <div className="mb-8 overflow-hidden rounded-xl h-64 bg-muted">
                  <img
                    src={service.hero_image_path}
                    alt={service.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <h1 className="font-display text-3xl font-semibold sm:text-4xl">{service.title}</h1>
              {service.short_description && (
                <p className="mt-4 text-lg text-muted-foreground">{service.short_description}</p>
              )}
              {service.description && (
                <div className="mt-6 prose prose-sm max-w-none text-foreground">
                  <p>{service.description}</p>
                </div>
              )}

              {/* Features list */}
              {Array.isArray(service.features) && service.features.length > 0 && (
                <div className="mt-8">
                  <h2 className="font-display text-xl font-semibold mb-4">What&apos;s Included</h2>
                  <ul className="space-y-2">
                    {(service.features as string[]).map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2
                          className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-amber"
                          aria-hidden="true"
                        />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* CTA sidebar */}
            <aside className="rounded-xl border border-border bg-card p-6 h-fit sticky top-24">
              <h2 className="font-display text-lg font-semibold">Interested in this service?</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Request a free, no-obligation quote tailored to your project.
              </p>
              <Button
                asChild
                className="mt-4 w-full bg-brand-amber text-white hover:bg-brand-brass"
              >
                <Link to={`/get-a-quote?service=${service.id}`}>
                  Get a Quote
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="mt-3 w-full">
                <Link to="/contact">Ask a Question</Link>
              </Button>
            </aside>
          </div>
        )}
      </div>
    </>
  );
}

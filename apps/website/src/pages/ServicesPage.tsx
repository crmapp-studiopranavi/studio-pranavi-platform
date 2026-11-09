import { Link } from 'react-router-dom';
import { Button } from '@platform/ui';
import { ArrowRight } from 'lucide-react';
import { PageMeta } from '@/components/ui/page-meta';
import { Skeleton } from '@/components/ui/skeleton';
import { useServices } from '@/lib/hooks/use-services';

export function ServicesPage() {
  const { data: services, isLoading, isError } = useServices();

  return (
    <>
      <PageMeta
        title="Our Services"
        description="Explore our range of custom decorative glass and lighting services."
        path="/services"
      />

      {/* Page header */}
      <section className="bg-brand-charcoal py-16 text-brand-ivory">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl font-semibold">Our Services</h1>
          <p className="mt-4 max-w-2xl text-brand-ivory/70">
            Every project is unique. We offer a complete range of custom decorative glass and
            lighting services tailored to your space.
          </p>
        </div>
      </section>

      {/* Services grid */}
      <section className="bg-brand-ivory py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {isError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              Unable to load services. Please try again later.
            </div>
          )}

          {isLoading && (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <Skeleton className="h-6 w-48 mb-3" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-5/6 mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-6" />
                  <Skeleton className="h-9 w-28" />
                </div>
              ))}
            </div>
          )}

          {!isLoading && services && services.length === 0 && (
            <div className="py-16 text-center text-muted-foreground">
              No services have been published yet. Check back soon.
            </div>
          )}

          {!isLoading && services && services.length > 0 && (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  {service.hero_image_path && (
                    <div className="mb-4 overflow-hidden rounded-lg h-40 bg-muted">
                      <img
                        src={service.hero_image_path}
                        alt={service.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <h2 className="font-display text-xl font-semibold">{service.title}</h2>
                  {service.short_description && (
                    <p className="mt-2 flex-1 text-sm text-muted-foreground">
                      {service.short_description}
                    </p>
                  )}
                  <Button asChild variant="outline" size="sm" className="mt-4 self-start">
                    <Link to={`/services/${service.slug}`}>
                      Learn More
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-amber py-14 text-white">
        <div className="container mx-auto px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-semibold">Not sure which service fits?</h2>
          <p className="mt-2 text-white/80">
            Describe your project and we&apos;ll guide you to the right solution.
          </p>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="mt-6 border-white text-white hover:bg-white/10"
          >
            <Link to="/get-a-quote">Get a Free Quote</Link>
          </Button>
        </div>
      </section>
    </>
  );
}

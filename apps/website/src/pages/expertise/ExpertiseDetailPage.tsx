import { Link, useParams, Navigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@platform/ui';
import { PageMeta } from '@/components/ui/page-meta';
import { Skeleton } from '@/components/ui/skeleton';
import { SectionReveal } from '@/components/ui/section-reveal';
import { ImagePlaceholder } from '@/components/ui/image-placeholder';
import { useServiceBySlug } from '@/lib/hooks/use-services';

export function ExpertiseDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: service, isLoading, isError } = useServiceBySlug(slug);

  if (!isLoading && !isError && service === null) {
    return <Navigate to="/expertise" replace />;
  }

  return (
    <>
      {service && (
        <PageMeta
          title={service.title}
          description={service.short_description ?? undefined}
          path={`/expertise/${service.slug}`}
        />
      )}

      {isLoading && (
        <div className="sp-container sp-section-sm">
          <Skeleton className="mb-4 h-10 w-72" />
          <Skeleton className="h-5 w-full max-w-xl" />
          <Skeleton className="mt-2 h-5 w-full max-w-lg" />
        </div>
      )}

      {isError && (
        <div className="sp-container sp-section">
          <div className="rounded-[var(--sp-radius-ui)] border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            Unable to load this page. Please try again later.
          </div>
        </div>
      )}

      {!isLoading && service && (
        <>
          {/* Header */}
          <section
            className="bg-brand-charcoal sp-section-sm"
            aria-label={`${service.title} header`}
          >
            <div className="sp-container">
              <Link
                to="/expertise"
                className="mb-8 inline-flex items-center gap-1.5 text-sm text-brand-ivory/50 hover:text-brand-ivory transition-colors"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                All Expertise
              </Link>
              <SectionReveal>
                <p className="sp-label-upper mb-3 text-brand-amber">Expertise</p>
                <h1
                  className="font-display font-semibold tracking-[-0.02em] text-brand-ivory"
                  style={{ fontSize: 'var(--sp-text-display-lg)', lineHeight: '1.15' }}
                >
                  {service.title}
                </h1>
                {service.short_description && (
                  <p
                    className="mt-4 max-w-2xl text-brand-ivory/65"
                    style={{ fontSize: 'var(--sp-text-body-lg)' }}
                  >
                    {service.short_description}
                  </p>
                )}
              </SectionReveal>
            </div>
          </section>

          {/* Hero image */}
          {service.hero_image_path && (
            <div className="bg-brand-charcoal" style={{ height: '45vh', overflow: 'hidden' }}>
              <ImagePlaceholder
                src={service.hero_image_path}
                alt={service.title}
                className="opacity-70"
                loading="eager"
                fetchpriority="high"
              />
            </div>
          )}

          {/* Description + Features */}
          <section className="bg-brand-ivory sp-section" aria-label="Service details">
            <div className="sp-container">
              <div className="grid grid-cols-1 gap-16 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  {service.description && (
                    <SectionReveal>
                      <p className="sp-label-upper mb-5 text-brand-amber">Overview</p>
                      <p
                        className="leading-relaxed text-brand-charcoal"
                        style={{ fontSize: 'var(--sp-text-body-lg)' }}
                      >
                        {service.description}
                      </p>
                    </SectionReveal>
                  )}

                  {Array.isArray(service.features) && service.features.length > 0 && (
                    <SectionReveal delay={100} className="mt-12">
                      <p className="sp-label-upper mb-5 text-brand-amber">What&apos;s Included</p>
                      <ul className="space-y-3">
                        {(service.features as string[]).map((feature, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-3 text-sm leading-relaxed text-brand-charcoal"
                          >
                            <CheckCircle2
                              className="mt-0.5 h-4 w-4 shrink-0 text-brand-amber"
                              aria-hidden="true"
                            />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </SectionReveal>
                  )}
                </div>

                <aside aria-label="Service CTA" className="lg:sticky lg:top-24 h-fit">
                  <SectionReveal
                    delay={120}
                    className="rounded-[var(--sp-radius-ui)] border border-[var(--sp-border)] bg-white p-6 shadow-[var(--sp-shadow-card)]"
                  >
                    <h2 className="font-display text-[var(--sp-text-h3)] font-semibold text-brand-charcoal">
                      Interested in this service?
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--sp-text-muted)]">
                      Request a free, no-obligation quote tailored to your project.
                    </p>
                    <Button
                      asChild
                      className="mt-4 w-full bg-brand-amber text-brand-charcoal hover:bg-brand-brass"
                    >
                      <Link to={`/start-a-project?service=${service.id}`}>
                        Start a Project
                        <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="mt-2.5 w-full">
                      <Link to="/contact">Ask a Question</Link>
                    </Button>
                  </SectionReveal>
                </aside>
              </div>
            </div>
          </section>
        </>
      )}
    </>
  );
}

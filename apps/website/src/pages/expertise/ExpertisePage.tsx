import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@platform/ui';
import { PageMeta } from '@/components/ui/page-meta';
import { SectionReveal } from '@/components/ui/section-reveal';
import { ExpertiseTile } from '@/components/ui/expertise-tile';
import { Skeleton } from '@/components/ui/skeleton';
import { useServices } from '@/lib/hooks/use-services';

export function ExpertisePage() {
  const { data: services, isLoading, isError } = useServices();

  return (
    <>
      <PageMeta
        title="Expertise"
        description="Studio Pranavi's areas of expertise: bespoke lighting, architectural lighting, decorative lighting, custom glass and installation."
        path="/expertise"
      />

      {/* Header */}
      <section className="bg-brand-charcoal sp-section-sm" aria-label="Expertise header">
        <div className="sp-container">
          <SectionReveal>
            <p className="sp-label-upper mb-3 text-brand-amber">Expertise</p>
            <h1
              className="font-display font-semibold tracking-[-0.02em] text-brand-ivory"
              style={{ fontSize: 'var(--sp-text-display-lg)', lineHeight: '1.15' }}
            >
              Where craft meets intention.
            </h1>
            <p
              className="mt-4 max-w-xl text-brand-ivory/65"
              style={{ fontSize: 'var(--sp-text-body-lg)' }}
            >
              We offer a focused set of disciplines — each practised deeply, not broadly. Our work
              spans architectural lighting design, decorative commissions and bespoke glass
              fabrication.
            </p>
          </SectionReveal>
        </div>
      </section>

      {/* Services grid */}
      <section className="bg-brand-ivory sp-section" aria-label="Expertise listing">
        <div className="sp-container">
          {isError && (
            <div className="rounded-[var(--sp-radius-ui)] border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              Unable to load expertise. Please try again later.
            </div>
          )}

          {isLoading && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-[var(--sp-radius-ui)] border border-[var(--sp-border)] p-6"
                >
                  <Skeleton className="mb-3 h-5 w-40" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="mt-1.5 h-4 w-5/6" />
                  <Skeleton className="mt-1.5 h-4 w-3/4" />
                </div>
              ))}
            </div>
          )}

          {!isLoading && services && services.length === 0 && (
            <div className="py-20 text-center text-[var(--sp-text-muted)]">
              Expertise pages will appear here once published.
            </div>
          )}

          {!isLoading && services && services.length > 0 && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service, i) => (
                <SectionReveal key={service.id} delay={Math.min(i, 4) * 70}>
                  <ExpertiseTile
                    slug={service.slug}
                    title={service.title}
                    description={service.short_description}
                  />
                </SectionReveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[var(--sp-stone)] sp-section" aria-label="Expertise CTA">
        <div className="sp-container">
          <SectionReveal className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-lg">
              <h2
                className="font-display font-semibold tracking-[-0.01em] text-brand-charcoal"
                style={{ fontSize: 'var(--sp-text-h1)' }}
              >
                Not sure which discipline fits your project?
              </h2>
              <p className="mt-2 leading-relaxed text-[var(--sp-text-muted)]">
                Describe your space and we'll recommend an approach together.
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
  );
}

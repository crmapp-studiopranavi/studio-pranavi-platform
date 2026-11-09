import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@platform/ui';
import { PageMeta } from '@/components/ui/page-meta';
import { Skeleton } from '@/components/ui/skeleton';
import { SectionReveal } from '@/components/ui/section-reveal';
import { ProjectCard } from '@/components/ui/project-card';
import { ExpertiseTile } from '@/components/ui/expertise-tile';
import { useServices } from '@/lib/hooks/use-services';
import { usePortfolioProjects } from '@/lib/hooks/use-portfolio';

const PROCESS_STEPS = [
  {
    step: '01',
    title: 'Discovery',
    description:
      'We understand your space, vision and intent — through conversation, site documents or a walkthrough.',
  },
  {
    step: '02',
    title: 'Design',
    description:
      'Our studio develops concepts: form studies, material references and lighting simulations, all tailored to your brief.',
  },
  {
    step: '03',
    title: 'Craft',
    description:
      'Skilled artisans handcraft each piece using traditional techniques and precision tooling, without compromise.',
  },
  {
    step: '04',
    title: 'Installation',
    description:
      'Our team handles delivery and installation to ensure the finished work performs exactly as designed.',
  },
];

export function HomePage() {
  const { data: services, isLoading: servicesLoading } = useServices();
  const { data: projects, isLoading: projectsLoading } = usePortfolioProjects();

  const featuredProjects = projects?.slice(0, 3) ?? [];

  return (
    <>
      <PageMeta
        title="Bespoke Architectural Lighting &amp; Custom Glass"
        description="Studio Pranavi designs bespoke architectural lighting, decorative lighting and custom glass solutions — from concept through installation."
        path="/"
      />

      {/* ── 1. Hero ─────────────────────────────────────────────────────────── */}
      <section
        className="relative flex min-h-[92vh] items-end bg-brand-charcoal pb-20 text-brand-ivory"
        aria-label="Studio introduction"
      >
        <div className="sp-container w-full">
          <div className="max-w-3xl">
            <p className="sp-label-upper mb-6 text-brand-amber">
              Architectural Lighting &amp; Custom Glass
            </p>
            <h1
              className="font-display font-semibold tracking-[-0.02em] text-brand-ivory"
              style={{ fontSize: 'var(--sp-text-display-xl)', lineHeight: '1.08' }}
            >
              We design the essence of light.
            </h1>
            <p
              className="mt-6 max-w-xl text-brand-ivory/65"
              style={{ fontSize: 'var(--sp-text-body-lg)', lineHeight: 'var(--sp-leading-body)' }}
            >
              Bespoke architectural lighting, decorative lighting and custom glass solutions —
              designed from concept through installation.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Button
                asChild
                size="lg"
                className="bg-brand-amber text-brand-charcoal hover:bg-brand-brass"
              >
                <Link to="/start-a-project">
                  Start a Project
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-brand-ivory/25 text-brand-ivory hover:bg-brand-ivory/8"
              >
                <Link to="/projects">View Projects</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Positioning statement ────────────────────────────────────────── */}
      <section className="bg-brand-ivory sp-section" aria-label="Studio positioning">
        <div className="sp-container">
          <SectionReveal className="max-w-2xl">
            <p className="sp-label-upper mb-5 text-brand-amber">The Studio</p>
            <h2
              className="font-display font-semibold tracking-[-0.01em] text-brand-charcoal"
              style={{ fontSize: 'var(--sp-text-display-md)', lineHeight: '1.2' }}
            >
              Light is material. We treat it as such.
            </h2>
          </SectionReveal>
          <SectionReveal delay={80} className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
            <p
              className="leading-relaxed text-[var(--sp-text-muted)]"
              style={{ fontSize: 'var(--sp-text-body-lg)' }}
            >
              Studio Pranavi was founded on one conviction: that light and glass, shaped with
              intention, transform how a space feels. We design bespoke lighting and glass
              installations for hospitality, residential and commercial interiors — each piece
              conceived as architecture, not decoration.
            </p>
            <p className="leading-relaxed text-[var(--sp-text-muted)]">
              Every project begins with the brief and ends only when the installation is right.
              Between those two points lies a process of consultation, design development, handcraft
              and precision installation — all carried by our studio, without intermediaries.
            </p>
          </SectionReveal>
          <SectionReveal delay={160} className="mt-10">
            <Link
              to="/studio/about"
              className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.1em] text-brand-amber hover:gap-3 transition-all duration-200"
            >
              About the Studio
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </SectionReveal>
        </div>
      </section>

      {/* ── 3. Selected Projects ────────────────────────────────────────────── */}
      <section className="bg-[var(--sp-stone)] sp-section" aria-label="Selected projects">
        <div className="sp-container">
          <SectionReveal className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="sp-label-upper mb-3 text-brand-amber">Selected Projects</p>
              <h2
                className="font-display font-semibold tracking-[-0.01em] text-brand-charcoal"
                style={{ fontSize: 'var(--sp-text-display-md)', lineHeight: '1.2' }}
              >
                Work that speaks for itself.
              </h2>
            </div>
            <Link
              to="/projects"
              className="shrink-0 text-sm font-semibold uppercase tracking-[0.1em] text-brand-amber hover:text-brand-brass transition-colors"
            >
              All Projects →
            </Link>
          </SectionReveal>

          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projectsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-[var(--sp-radius-img)]">
                  <Skeleton className="aspect-[3/2] w-full rounded-none" />
                  <div className="space-y-2 px-1 pt-4">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              ))
            ) : featuredProjects.length > 0 ? (
              featuredProjects.map((project, i) => (
                <SectionReveal key={project.id} delay={i * 80}>
                  <ProjectCard
                    slug={project.slug}
                    title={project.title}
                    summary={project.summary}
                    category={project.category}
                    coverImagePath={project.cover_image_path}
                  />
                </SectionReveal>
              ))
            ) : (
              <div className="col-span-full py-16 text-center text-[var(--sp-text-muted)]">
                Projects will appear here once published.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 4. Expertise ────────────────────────────────────────────────────── */}
      <section className="bg-brand-ivory sp-section" aria-label="Areas of expertise">
        <div className="sp-container">
          <SectionReveal>
            <p className="sp-label-upper mb-3 text-brand-amber">Expertise</p>
            <h2
              className="font-display font-semibold tracking-[-0.01em] text-brand-charcoal"
              style={{ fontSize: 'var(--sp-text-display-md)', lineHeight: '1.2' }}
            >
              Craft with a clear purpose.
            </h2>
          </SectionReveal>

          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {servicesLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-[var(--sp-radius-ui)] border border-[var(--sp-border)] p-6"
                >
                  <Skeleton className="mb-3 h-5 w-40" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="mt-1 h-4 w-3/4" />
                </div>
              ))
            ) : services && services.length > 0 ? (
              services.map((service, i) => (
                <SectionReveal key={service.id} delay={i * 60}>
                  <ExpertiseTile
                    slug={service.slug}
                    title={service.title}
                    description={service.short_description}
                  />
                </SectionReveal>
              ))
            ) : (
              <div className="col-span-full py-10 text-center text-[var(--sp-text-muted)]">
                Services will appear here once added.
              </div>
            )}
          </div>

          {services && services.length > 0 && (
            <SectionReveal className="mt-10 text-center">
              <Button asChild variant="outline">
                <Link to="/expertise">View All Expertise</Link>
              </Button>
            </SectionReveal>
          )}
        </div>
      </section>

      {/* ── 5. Collections teaser ───────────────────────────────────────────── */}
      <section className="bg-brand-charcoal sp-section" aria-label="Collections">
        <div className="sp-container">
          <SectionReveal className="max-w-xl">
            <p className="sp-label-upper mb-4 text-brand-amber">Collections</p>
            <h2
              className="font-display font-semibold tracking-[-0.01em] text-brand-ivory"
              style={{ fontSize: 'var(--sp-text-display-md)', lineHeight: '1.2' }}
            >
              A curated catalogue, arriving soon.
            </h2>
            <p className="mt-5 leading-relaxed text-brand-ivory/60">
              We are assembling a curated collection of signature lighting and glass designs —
              available as limited editions and configurable to your space. Register your interest
              to be notified first.
            </p>
            <div className="mt-8">
              <Link
                to="/collections"
                className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.1em] text-brand-amber hover:text-brand-ivory transition-colors duration-200"
              >
                Explore Collections
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* ── 6. Process ──────────────────────────────────────────────────────── */}
      <section className="bg-brand-ivory sp-section" aria-label="Our process">
        <div className="sp-container">
          <SectionReveal>
            <p className="sp-label-upper mb-3 text-brand-amber">Process</p>
            <h2
              className="font-display font-semibold tracking-[-0.01em] text-brand-charcoal"
              style={{ fontSize: 'var(--sp-text-display-md)', lineHeight: '1.2' }}
            >
              From brief to installation.
            </h2>
          </SectionReveal>

          <div className="mt-14 grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
            {PROCESS_STEPS.map((item, i) => (
              <SectionReveal key={item.step} delay={i * 80}>
                <div
                  className="text-[var(--sp-text-display-md)] font-display font-semibold leading-none tracking-[-0.02em] text-brand-stone"
                  aria-hidden="true"
                >
                  {item.step}
                </div>
                <h3 className="mt-4 font-display text-[var(--sp-text-h3)] font-semibold text-brand-charcoal">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--sp-text-muted)]">
                  {item.description}
                </p>
              </SectionReveal>
            ))}
          </div>

          <SectionReveal delay={320} className="mt-12">
            <Link
              to="/studio/process"
              className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.1em] text-brand-amber hover:gap-3 transition-all duration-200"
            >
              Our Full Process
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </SectionReveal>
        </div>
      </section>

      {/* ── 7. Craftsmanship statement ──────────────────────────────────────── */}
      <section className="bg-[var(--sp-stone)] sp-section" aria-label="Craftsmanship">
        <div className="sp-container">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
            <SectionReveal>
              <p className="sp-label-upper mb-4 text-brand-amber">Craftsmanship</p>
              <h2
                className="font-display font-semibold tracking-[-0.01em] text-brand-charcoal"
                style={{ fontSize: 'var(--sp-text-display-md)', lineHeight: '1.2' }}
              >
                Made by hand. Made to last.
              </h2>
              <p className="mt-6 leading-relaxed text-[var(--sp-text-muted)]">
                Every piece that leaves our studio has been shaped, joined and finished by hand. We
                work with glass blowers, metalworkers and specialist artisans whose skills have been
                refined over decades. The result is work that carries the weight of its own making —
                and improves with time.
              </p>
              <p className="mt-4 leading-relaxed text-[var(--sp-text-muted)]">
                We believe the best materials, treated with care, outlast fashion. That is why we
                source glass, brass and stone with the same rigour we apply to the design itself.
              </p>
              <Link
                to="/studio/craftsmanship"
                className="mt-8 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.1em] text-brand-amber hover:gap-3 transition-all duration-200"
              >
                Our Craft
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </SectionReveal>
            <SectionReveal
              delay={120}
              className="aspect-[4/3] overflow-hidden rounded-[var(--sp-radius-img)]"
            >
              <div className="sp-img-placeholder h-full w-full" role="presentation" />
            </SectionReveal>
          </div>
        </div>
      </section>

      {/* ── 8. Final CTA ────────────────────────────────────────────────────── */}
      <section className="bg-brand-charcoal sp-section" aria-label="Start your project">
        <div className="sp-container text-center">
          <SectionReveal>
            <p className="sp-label-upper mb-4 text-brand-amber">Start a Project</p>
            <h2
              className="font-display font-semibold tracking-[-0.02em] text-brand-ivory"
              style={{ fontSize: 'var(--sp-text-display-lg)', lineHeight: '1.15' }}
            >
              Tell us about your space.
            </h2>
            <p className="mx-auto mt-5 max-w-lg leading-relaxed text-brand-ivory/60">
              We take on a limited number of new commissions each year. If your project aligns with
              our practice, we would welcome the conversation.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-10 bg-brand-amber text-brand-charcoal hover:bg-brand-brass"
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

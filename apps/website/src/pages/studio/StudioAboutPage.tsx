import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@platform/ui';
import { PageMeta } from '@/components/ui/page-meta';
import { SectionReveal } from '@/components/ui/section-reveal';

export function StudioAboutPage() {
  return (
    <>
      <PageMeta
        title="About the Studio"
        description="Studio Pranavi — a design practice dedicated to bespoke architectural lighting and custom glass, crafted with intention."
        path="/studio/about"
      />

      {/* Header */}
      <section className="bg-brand-charcoal sp-section-sm" aria-label="Studio header">
        <div className="sp-container">
          <SectionReveal>
            <p className="sp-label-upper mb-3 text-brand-amber">About</p>
            <h1
              className="font-display font-semibold tracking-[-0.02em] text-brand-ivory"
              style={{ fontSize: 'var(--sp-text-display-lg)', lineHeight: '1.15' }}
            >
              Studio Pranavi
            </h1>
            <p
              className="mt-4 max-w-2xl text-brand-ivory/65"
              style={{ fontSize: 'var(--sp-text-body-lg)' }}
            >
              A design practice dedicated to bespoke architectural lighting and custom glass —
              shaped by craft, guided by light.
            </p>
          </SectionReveal>
        </div>
      </section>

      {/* Studio story */}
      <section className="bg-brand-ivory sp-section" aria-label="Studio story">
        <div className="sp-container">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-start">
            <SectionReveal>
              <p className="sp-label-upper mb-5 text-brand-amber">Who We Are</p>
              <h2
                className="font-display font-semibold tracking-[-0.01em] text-brand-charcoal"
                style={{ fontSize: 'var(--sp-text-display-md)', lineHeight: '1.2' }}
              >
                Light is the medium. Space is the canvas.
              </h2>
              <div className="mt-6 space-y-4 leading-relaxed text-[var(--sp-text-muted)]">
                <p>
                  Studio Pranavi was founded on a single premise: that light and glass, when
                  conceived with the same rigour as architecture, fundamentally alter how a space is
                  experienced. We design bespoke lighting installations and custom glass solutions
                  for hospitality, residential and commercial interiors across India.
                </p>
                <p>
                  Our practice begins with listening. We spend time understanding the brief, the
                  space and the intent before a single line is drawn. That conversation — between
                  the studio, the client and the architecture — shapes everything that follows.
                </p>
                <p>
                  We work directly, without intermediaries. Every commission is overseen by the
                  studio from initial concept to final installation, ensuring the integrity of the
                  design is preserved at every step.
                </p>
              </div>
            </SectionReveal>

            <SectionReveal delay={120} className="space-y-8">
              <div className="aspect-[4/3] overflow-hidden rounded-[var(--sp-radius-img)]">
                <div className="sp-img-placeholder h-full w-full" role="presentation" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-[var(--sp-radius-ui)] border border-[var(--sp-border)] p-5">
                  <p className="sp-label-upper text-brand-amber">Focus</p>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--sp-text-muted)]">
                    Architectural lighting &amp; custom glass
                  </p>
                </div>
                <div className="rounded-[var(--sp-radius-ui)] border border-[var(--sp-border)] p-5">
                  <p className="sp-label-upper text-brand-amber">Based In</p>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--sp-text-muted)]">
                    India — serving nationwide
                  </p>
                </div>
              </div>
            </SectionReveal>
          </div>
        </div>
      </section>

      {/* What we do */}
      <section className="bg-[var(--sp-stone)] sp-section" aria-label="What we do">
        <div className="sp-container">
          <SectionReveal>
            <p className="sp-label-upper mb-5 text-brand-amber">What We Do</p>
            <h2
              className="font-display font-semibold tracking-[-0.01em] text-brand-charcoal"
              style={{ fontSize: 'var(--sp-text-display-md)', lineHeight: '1.2' }}
            >
              A practice, not a product line.
            </h2>
          </SectionReveal>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: 'Bespoke Commissions',
                body: 'Every lighting or glass piece we design is made specifically for its space. We do not sell off-the-shelf products.',
              },
              {
                title: 'Hospitality &amp; Residential',
                body: 'We work across hotel lobbies, restaurants, private residences and commercial interiors — at any scale.',
              },
              {
                title: 'End-to-End',
                body: 'Design, fabrication and installation are handled by our studio. We are accountable for the outcome, not just the drawing.',
              },
            ].map((item, i) => (
              <SectionReveal key={item.title} delay={i * 80}>
                <div className="rounded-[var(--sp-radius-ui)] bg-white p-6 shadow-[var(--sp-shadow-card)]">
                  <h3
                    className="font-display font-semibold text-brand-charcoal"
                    dangerouslySetInnerHTML={{ __html: item.title }}
                  />
                  <p className="mt-2 text-sm leading-relaxed text-[var(--sp-text-muted)]">
                    {item.body}
                  </p>
                </div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Studio sub-nav */}
      <section className="bg-brand-ivory sp-section-sm" aria-label="Studio pages">
        <div className="sp-container">
          <SectionReveal>
            <p className="sp-label-upper mb-6 text-brand-amber">Explore the Studio</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { to: '/studio/craftsmanship', label: 'Craftsmanship' },
                { to: '/studio/materials', label: 'Materials' },
                { to: '/studio/process', label: 'Process' },
              ].map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center justify-between rounded-[var(--sp-radius-ui)] border border-[var(--sp-border)] px-5 py-4 text-sm font-semibold text-brand-charcoal transition-colors hover:border-brand-amber/40 hover:bg-[var(--sp-stone)]"
                >
                  {link.label}
                  <ArrowRight className="h-4 w-4 text-brand-amber" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-charcoal sp-section" aria-label="Contact CTA">
        <div className="sp-container text-center">
          <SectionReveal>
            <h2
              className="font-display font-semibold tracking-[-0.01em] text-brand-ivory"
              style={{ fontSize: 'var(--sp-text-display-md)', lineHeight: '1.2' }}
            >
              Ready to begin?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-brand-ivory/60">
              Tell us about your project and we'll be in touch.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-8 bg-brand-amber text-brand-charcoal hover:bg-brand-brass"
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

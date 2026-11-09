import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@platform/ui';
import { PageMeta } from '@/components/ui/page-meta';
import { SectionReveal } from '@/components/ui/section-reveal';

export function StudioCraftsmanshipPage() {
  return (
    <>
      <PageMeta
        title="Craftsmanship"
        description="How Studio Pranavi's artisans shape, join and finish every piece by hand — the tools, techniques and standards behind our work."
        path="/studio/craftsmanship"
      />

      <section className="bg-brand-charcoal sp-section-sm" aria-label="Craftsmanship header">
        <div className="sp-container">
          <SectionReveal>
            <p className="sp-label-upper mb-3 text-brand-amber">Craftsmanship</p>
            <h1
              className="font-display font-semibold tracking-[-0.02em] text-brand-ivory"
              style={{ fontSize: 'var(--sp-text-display-lg)', lineHeight: '1.15' }}
            >
              Made by hand. Made to last.
            </h1>
            <p
              className="mt-4 max-w-xl text-brand-ivory/65"
              style={{ fontSize: 'var(--sp-text-body-lg)' }}
            >
              The standards that govern how we make things — and why they matter.
            </p>
          </SectionReveal>
        </div>
      </section>

      <section className="bg-brand-ivory sp-section" aria-label="Craft detail">
        <div className="sp-container">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-start">
            <SectionReveal className="space-y-6 leading-relaxed text-[var(--sp-text-muted)]">
              <p className="sp-label-upper text-brand-amber">The Making</p>
              <p style={{ fontSize: 'var(--sp-text-body-lg)' }}>
                Every piece that leaves our studio has been shaped, joined and finished by hand. We
                work with glass blowers, metalworkers and specialist artisans whose skills have been
                refined over decades. These are not production workshops — they are craft practices,
                and they inform every decision we make at the design stage.
              </p>
              <p>
                We believe precision and restraint produce the most lasting work. Our forms are
                resolved before a single piece of material is touched. The drawing must be right
                before the making begins.
              </p>
              <p>
                Quality control happens at every stage — not only at the end. We inspect materials
                on arrival, monitor production in progress and test installations before sign-off.
                If something is not right, it does not leave the workshop.
              </p>
            </SectionReveal>

            <SectionReveal delay={120} className="space-y-6">
              <div className="aspect-[4/3] overflow-hidden rounded-[var(--sp-radius-img)]">
                <div className="sp-img-placeholder h-full w-full" role="presentation" />
              </div>
              <div className="aspect-[4/3] overflow-hidden rounded-[var(--sp-radius-img)]">
                <div className="sp-img-placeholder h-full w-full" role="presentation" />
              </div>
            </SectionReveal>
          </div>
        </div>
      </section>

      <section className="bg-[var(--sp-stone)] sp-section" aria-label="Craft values">
        <div className="sp-container">
          <SectionReveal>
            <p className="sp-label-upper mb-5 text-brand-amber">Standards</p>
          </SectionReveal>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: 'Handmade',
                body: 'Every piece is made by hand, using traditional craft techniques adapted for contemporary design.',
              },
              {
                title: 'Material Integrity',
                body: 'We specify materials we trust. Glass, brass and stone are selected for their intrinsic qualities, not cost alone.',
              },
              {
                title: 'No Shortcuts',
                body: 'There is no stage at which quality is traded for speed. We would rather delay delivery than compromise the work.',
              },
            ].map((item, i) => (
              <SectionReveal key={item.title} delay={i * 80}>
                <div className="rounded-[var(--sp-radius-ui)] bg-white p-6 shadow-[var(--sp-shadow-card)]">
                  <h3 className="font-display font-semibold text-brand-charcoal">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--sp-text-muted)]">
                    {item.body}
                  </p>
                </div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-brand-charcoal sp-section-sm" aria-label="Craftsmanship CTA">
        <div className="sp-container flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <SectionReveal>
            <h2
              className="font-display font-semibold tracking-[-0.01em] text-brand-ivory"
              style={{ fontSize: 'var(--sp-text-h1)' }}
            >
              See the craft in our projects.
            </h2>
            <p className="mt-2 text-brand-ivory/60">
              Browse the full portfolio to see these standards at work.
            </p>
          </SectionReveal>
          <SectionReveal delay={80} className="shrink-0">
            <Button
              asChild
              size="lg"
              className="bg-brand-amber text-brand-charcoal hover:bg-brand-brass"
            >
              <Link to="/projects">
                View Projects
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </SectionReveal>
        </div>
      </section>
    </>
  );
}

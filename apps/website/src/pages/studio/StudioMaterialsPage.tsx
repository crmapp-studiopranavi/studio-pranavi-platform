import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@platform/ui';
import { PageMeta } from '@/components/ui/page-meta';
import { SectionReveal } from '@/components/ui/section-reveal';

const MATERIALS = [
  {
    name: 'Glass',
    description:
      'We work with hand-blown, cast, sandblasted and fused glass. Each type carries different optical properties — weight of refraction, surface texture, translucency — and we select for the effect the design requires.',
  },
  {
    name: 'Brass',
    description:
      'Natural brass develops a living patina over time. We use it in structural, decorative and functional roles — polished, brushed or chemically aged depending on the environment and finish intent.',
  },
  {
    name: 'Stone',
    description:
      'Marble, travertine and granite appear in our base and surface work. Stone grounds a piece in material permanence — and chosen well, it ages with extraordinary grace.',
  },
  {
    name: 'Steel &amp; Iron',
    description:
      'Where structural integrity demands it, we use blackened steel or powder-coated iron — never as decoration, always as architecture within the piece.',
  },
  {
    name: 'Fabric &amp; Natural Fibre',
    description:
      'For shade and diffusion work, we source linen, silk and handwoven textiles. These materials carry light differently from glass and offer warmth, particularly in residential contexts.',
  },
];

export function StudioMaterialsPage() {
  return (
    <>
      <PageMeta
        title="Materials"
        description="The materials Studio Pranavi selects — glass, brass, stone and more — and why each choice matters to the design."
        path="/studio/materials"
      />

      <section className="bg-brand-charcoal sp-section-sm" aria-label="Materials header">
        <div className="sp-container">
          <SectionReveal>
            <p className="sp-label-upper mb-3 text-brand-amber">Materials</p>
            <h1
              className="font-display font-semibold tracking-[-0.02em] text-brand-ivory"
              style={{ fontSize: 'var(--sp-text-display-lg)', lineHeight: '1.15' }}
            >
              The substance of light.
            </h1>
            <p
              className="mt-4 max-w-xl text-brand-ivory/65"
              style={{ fontSize: 'var(--sp-text-body-lg)' }}
            >
              Every material we use is selected for a reason. This is a guide to what we work with
              and why.
            </p>
          </SectionReveal>
        </div>
      </section>

      <section className="bg-brand-ivory sp-section" aria-label="Materials overview">
        <div className="sp-container">
          <SectionReveal>
            <p className="sp-label-upper mb-5 text-brand-amber">Why Materials Matter</p>
            <p
              className="max-w-2xl leading-relaxed text-brand-charcoal"
              style={{ fontSize: 'var(--sp-text-body-lg)' }}
            >
              Lighting is experienced through material. The way glass refracts a beam, the colour
              brass casts on a wall, the softness linen gives to a diffused panel — these are not
              incidental effects. They are the design. We select every material with this in mind.
            </p>
          </SectionReveal>
        </div>
      </section>

      <section className="bg-[var(--sp-stone)] sp-section" aria-label="Material list">
        <div className="sp-container">
          <div className="divide-y divide-[var(--sp-border)]">
            {MATERIALS.map((material, i) => (
              <SectionReveal key={material.name} delay={i * 60}>
                <div className="grid grid-cols-1 gap-6 py-10 sm:grid-cols-3">
                  <h3
                    className="font-display font-semibold tracking-[-0.01em] text-brand-charcoal"
                    style={{ fontSize: 'var(--sp-text-h2)' }}
                    dangerouslySetInnerHTML={{ __html: material.name }}
                  />
                  <p className="sm:col-span-2 leading-relaxed text-[var(--sp-text-muted)]">
                    {material.description}
                  </p>
                </div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-brand-charcoal sp-section-sm" aria-label="Materials CTA">
        <div className="sp-container flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <SectionReveal>
            <h2
              className="font-display font-semibold tracking-[-0.01em] text-brand-ivory"
              style={{ fontSize: 'var(--sp-text-h1)' }}
            >
              A material question? Let&apos;s discuss.
            </h2>
            <p className="mt-2 text-brand-ivory/60">
              We&apos;re happy to advise on what works best for your space and brief.
            </p>
          </SectionReveal>
          <SectionReveal delay={80} className="shrink-0">
            <Button
              asChild
              size="lg"
              className="bg-brand-amber text-brand-charcoal hover:bg-brand-brass"
            >
              <Link to="/contact">
                Get in Touch
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </SectionReveal>
        </div>
      </section>
    </>
  );
}

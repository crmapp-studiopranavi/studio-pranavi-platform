import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@platform/ui';
import { PageMeta } from '@/components/ui/page-meta';
import { SectionReveal } from '@/components/ui/section-reveal';

const STEPS = [
  {
    step: '01',
    title: 'Discovery',
    duration: '1–2 weeks',
    body: 'We begin with a conversation — about the space, the brief, the timeline and the intent. For larger commissions, we conduct a site visit to understand the architecture, the light conditions and the installation constraints. Nothing is designed before this stage is complete.',
  },
  {
    step: '02',
    title: 'Concept Design',
    duration: '2–4 weeks',
    body: 'Our studio develops initial concepts: form studies, material references, mood boards and, where relevant, lighting simulations. We present a single, resolved direction — not a menu of options. This is our interpretation of the brief, argued through design.',
  },
  {
    step: '03',
    title: 'Design Development',
    duration: '2–4 weeks',
    body: 'Once the concept is agreed, we develop it fully — technical drawings, material specifications, production details and installation methodology. This package is the contract between design intent and manufacture. Nothing is ambiguous at this stage.',
  },
  {
    step: '04',
    title: 'Fabrication',
    duration: '4–12 weeks',
    body: 'Each piece is fabricated by hand in collaboration with our specialist artisans. Timelines depend on scale, material and complexity. We visit the workshop during production and inspect work-in-progress before any piece advances to the finishing stage.',
  },
  {
    step: '05',
    title: 'Installation',
    duration: '1–5 days',
    body: 'Our team handles delivery and installation on-site. We work closely with your site team — contractors, project managers, interior designers — to coordinate sequencing and protect the finished work. Installation is not complete until we are satisfied with the result.',
  },
  {
    step: '06',
    title: 'Handover',
    duration: '1 day',
    body: 'We walk through the completed installation with you, demonstrate any operational requirements and hand over care and maintenance guidance. This is the moment the work becomes yours — and we take it seriously.',
  },
];

export function StudioProcessPage() {
  return (
    <>
      <PageMeta
        title="Process"
        description="How Studio Pranavi works — from initial discovery through design, fabrication and installation."
        path="/studio/process"
      />

      <section className="bg-brand-charcoal sp-section-sm" aria-label="Process header">
        <div className="sp-container">
          <SectionReveal>
            <p className="sp-label-upper mb-3 text-brand-amber">Process</p>
            <h1
              className="font-display font-semibold tracking-[-0.02em] text-brand-ivory"
              style={{ fontSize: 'var(--sp-text-display-lg)', lineHeight: '1.15' }}
            >
              From brief to installation.
            </h1>
            <p
              className="mt-4 max-w-xl text-brand-ivory/65"
              style={{ fontSize: 'var(--sp-text-body-lg)' }}
            >
              A transparent account of how we work — what each stage involves and roughly how long
              it takes.
            </p>
          </SectionReveal>
        </div>
      </section>

      <section className="bg-brand-ivory sp-section" aria-label="Process steps">
        <div className="sp-container">
          <div className="divide-y divide-[var(--sp-border)]">
            {STEPS.map((item, i) => (
              <SectionReveal key={item.step} delay={Math.min(i, 3) * 60}>
                <div className="grid grid-cols-1 gap-6 py-12 sm:grid-cols-4 lg:grid-cols-5">
                  <div className="sm:col-span-1">
                    <span
                      className="font-display font-semibold text-brand-stone"
                      style={{ fontSize: 'var(--sp-text-display-md)', lineHeight: '1' }}
                      aria-hidden="true"
                    >
                      {item.step}
                    </span>
                    {item.duration && (
                      <p className="mt-2 text-xs text-[var(--sp-text-muted)]">{item.duration}</p>
                    )}
                  </div>
                  <div className="sm:col-span-3 lg:col-span-4">
                    <h2
                      className="font-display font-semibold tracking-[-0.01em] text-brand-charcoal"
                      style={{ fontSize: 'var(--sp-text-h2)' }}
                    >
                      {item.title}
                    </h2>
                    <p className="mt-3 leading-relaxed text-[var(--sp-text-muted)]">{item.body}</p>
                  </div>
                </div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-brand-charcoal sp-section" aria-label="Process CTA">
        <div className="sp-container text-center">
          <SectionReveal>
            <h2
              className="font-display font-semibold tracking-[-0.01em] text-brand-ivory"
              style={{ fontSize: 'var(--sp-text-display-md)', lineHeight: '1.2' }}
            >
              Ready to start the conversation?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-brand-ivory/60">
              Tell us about your project and we&apos;ll guide you through the first steps.
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

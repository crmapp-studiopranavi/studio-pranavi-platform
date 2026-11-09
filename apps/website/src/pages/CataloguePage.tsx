import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@platform/ui';
import { PageMeta } from '@/components/ui/page-meta';
import { SectionReveal } from '@/components/ui/section-reveal';

export function CataloguePage() {
  return (
    <>
      <PageMeta
        title="Catalogue"
        description="Studio Pranavi's product catalogue — coming soon."
        path="/catalogue"
      />

      <section className="bg-brand-charcoal sp-section" aria-label="Catalogue">
        <div className="sp-container text-center">
          <SectionReveal>
            <p className="sp-label-upper mb-4 text-brand-amber">Catalogue</p>
            <h1
              className="font-display font-semibold tracking-[-0.02em] text-brand-ivory"
              style={{ fontSize: 'var(--sp-text-display-lg)', lineHeight: '1.15' }}
            >
              Arriving soon.
            </h1>
            <p
              className="mx-auto mt-5 max-w-lg text-brand-ivory/60"
              style={{ fontSize: 'var(--sp-text-body-lg)' }}
            >
              We are preparing a downloadable catalogue of our signature designs. Register your
              interest and we will notify you when it is available.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="bg-brand-amber text-brand-charcoal hover:bg-brand-brass"
              >
                <Link to="/contact">
                  Register Interest
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-brand-ivory/25 text-brand-ivory hover:bg-brand-ivory/10"
              >
                <Link to="/projects">View Projects</Link>
              </Button>
            </div>
          </SectionReveal>
        </div>
      </section>
    </>
  );
}

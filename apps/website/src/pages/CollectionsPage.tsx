import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@platform/ui';
import { PageMeta } from '@/components/ui/page-meta';
import { SectionReveal } from '@/components/ui/section-reveal';

export function CollectionsPage() {
  return (
    <>
      <PageMeta
        title="Collections"
        description="Studio Pranavi's curated collections of signature lighting and glass designs — coming soon."
        path="/collections"
      />

      <section className="bg-brand-charcoal sp-section" aria-label="Collections">
        <div className="sp-container">
          <SectionReveal className="max-w-xl">
            <p className="sp-label-upper mb-4 text-brand-amber">Collections</p>
            <h1
              className="font-display font-semibold tracking-[-0.02em] text-brand-ivory"
              style={{ fontSize: 'var(--sp-text-display-lg)', lineHeight: '1.15' }}
            >
              A curated catalogue, arriving soon.
            </h1>
            <p className="mt-5 text-brand-ivory/60" style={{ fontSize: 'var(--sp-text-body-lg)' }}>
              We are assembling a curated collection of signature lighting and glass designs —
              available as limited editions and configurable to your space. Register your interest
              to be notified first.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
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

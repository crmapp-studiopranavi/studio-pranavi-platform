import { Link } from 'react-router-dom';
import { PageMeta } from '@/components/ui/page-meta';
import { useScrollReveal } from '@/hooks/useScrollReveal';

export function AboutPage() {
  useScrollReveal();
  return (
    <>
      <PageMeta
        title="About"
        description="Studio Pranavi — the story of a design studio that studies glass and light as art forms."
        path="/about"
      />

      <section className="border-b border-brand-border py-20 lg:py-32 bg-white">
        <div className="sp-container">
          <p className="title-4">Our Story</p>
          <h1 className="title-1 mt-6 max-w-2xl reveal">We study light as an art form</h1>
        </div>
      </section>

      <section className="sp-section bg-white">
        <div className="sp-container">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-start">
            <div className="overflow-hidden bg-brand-bgalt reveal" style={{ aspectRatio: '4/5' }}>
              <img
                src="/images/about-studio.jpg"
                alt="Studio Pranavi studio"
                className="h-full w-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
            <div className="lg:pt-10 reveal reveal-delay-2">
              <h2 className="title-2">Brand history</h2>
              <p className="title-3 mt-8 leading-relaxed text-brand-muted">
                Studio Pranavi was born from a design studio that had been creating high-end interior
                projects for over a decade. Even before the company appeared, our designers studied
                glass and light as art forms — understanding how material, form, and luminosity
                interact to shape human emotion and spatial experience.
              </p>
              <p className="title-3 mt-6 leading-relaxed text-brand-muted">
                Today, each Studio Pranavi piece is designed and handcrafted specifically for the
                space it will inhabit. We work with architects, interior designers, and private
                clients to realise visions that would be impossible with off-the-shelf products.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="sp-section border-t border-brand-border" style={{ background: '#f7f7f7' }}>
        <div className="sp-container">
          <h2 className="title-2 reveal">Our Values</h2>
          <div className="mt-16 grid grid-cols-1 gap-10 sm:grid-cols-2">
            {[
              { label: 'Light as Art', desc: 'We treat every piece as a work of art first, a functional object second.' },
              { label: 'Unusual Materials', desc: 'Handblown glass, architectural crystal, rare minerals, patinated metals.' },
              { label: 'Unwavering Attention', desc: 'Every joint, curve, and surface finish is treated with the precision of a master craftsperson.' },
              { label: 'Bespoke Only', desc: 'We do not produce stock pieces. Every commission is unique — designed and made for you.' },
            ].map((val, i) => (
              <div key={i} className={`border-t border-brand-border pt-8 reveal reveal-delay-${Math.min(i + 1, 4) as 1 | 2 | 3 | 4}`}>
                <h3 className="title-3">{val.label}</h3>
                <p className="mt-3 text-sm leading-relaxed text-brand-muted">{val.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sp-section border-t border-brand-border bg-white">
        <div className="sp-container">
          <h2 className="title-2 reveal">Our Process</h2>
          <div className="mt-16 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { step: '01', label: 'Enquiry', desc: 'You share your project brief, space dimensions, and vision.' },
              { step: '02', label: 'Concept', desc: 'Our designers develop concepts and material proposals.' },
              { step: '03', label: 'Design', desc: 'We refine the selected concept into detailed production drawings.' },
              { step: '04', label: 'Prototype', desc: 'A scale or full prototype is made and reviewed with you.' },
              { step: '05', label: 'Production', desc: 'Handcrafted in our studio with full quality control at each stage.' },
              { step: '06', label: 'Installation', desc: 'Our team installs and commissions the piece in your space.' },
            ].map((p, i) => (
              <div key={i} className={`border-t border-brand-border pt-8 reveal reveal-delay-${Math.min((i % 3) + 1, 3) as 1 | 2 | 3}`}>
                <p className="title-4">{p.step}</p>
                <h3 className="title-3 mt-3">{p.label}</h3>
                <p className="mt-2 text-sm leading-relaxed text-brand-muted">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sp-section border-t border-brand-border" style={{ background: '#f7f7f7' }}>
        <div className="sp-container">
          <h2 className="title-2 reveal">Start your project</h2>
          <p className="title-3 mt-6 max-w-xl leading-relaxed text-brand-muted reveal reveal-delay-1">
            Tell us about your space and vision. We will respond within one business day.
          </p>
          <Link to="/enquiry" className="btn-black mt-10 reveal reveal-delay-2">Request a Quote</Link>
        </div>
      </section>
    </>
  );
}

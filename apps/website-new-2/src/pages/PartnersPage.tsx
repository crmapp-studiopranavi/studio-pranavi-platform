import { Link } from 'react-router-dom';
import { PageMeta } from '@/components/ui/page-meta';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const PARTNER_TYPES = [
  {
    title: 'Interior Designers',
    desc: 'We collaborate with interior designers on residential and commercial projects — providing concept development, custom specifications, and on-site installation support.',
    icon: '◈',
  },
  {
    title: 'Architects',
    desc: 'Our lighting integrates seamlessly into architectural language. We work from schematic design through to completion, offering technical documentation and BIM-ready models.',
    icon: '◇',
  },
  {
    title: 'Developers & Hospitality Groups',
    desc: 'For high-end developments and hotel brands, we offer volume pricing, phased delivery schedules, and dedicated project management.',
    icon: '◉',
  },
  {
    title: 'Distributors & Showrooms',
    desc: 'We partner with premium lighting showrooms across India to represent our catalogue. Enquire about exclusivity, margins, and sample programmes.',
    icon: '◎',
  },
];

const BENEFITS = [
  { label: 'Trade Pricing', desc: 'Preferential rates for qualifying design professionals and studios.' },
  { label: 'Dedicated Manager', desc: 'A single point of contact across every project you bring to us.' },
  { label: 'Sample Access', desc: 'Material and finish samples dispatched within 3 working days.' },
  { label: 'Co-branded Materials', desc: 'Presentations, mood boards, and specification sheets tailored to your project.' },
  { label: 'Site Visits', desc: 'Our design team can visit your site at concept and pre-installation stages.' },
  { label: 'Priority Lead Times', desc: 'Partner projects are scheduled ahead of standard retail orders.' },
];

export function PartnersPage() {
  useScrollReveal();
  return (
    <>
      <PageMeta
        title="Partners"
        description="Studio Pranavi trade partnership programme for interior designers, architects, developers, and showrooms."
        path="/partners"
      />

      <section className="border-b border-brand-border py-20 lg:py-32 bg-white">
        <div className="sp-container">
          <p className="title-4">Collaboration</p>
          <h1 className="title-1 mt-6 max-w-2xl reveal">Partner with Studio Pranavi</h1>
          <p className="title-3 mt-8 max-w-xl leading-relaxed text-brand-muted reveal reveal-delay-1">
            We build long-term relationships with design professionals who share our commitment
            to quality, craft, and the transformative power of light.
          </p>
        </div>
      </section>

      {/* Partner types */}
      <section className="sp-section bg-white">
        <div className="sp-container">
          <h2 className="title-2 reveal">Who we work with</h2>
          <div className="mt-14 grid grid-cols-1 gap-0 sm:grid-cols-2">
            {PARTNER_TYPES.map((p, i) => (
              <div
                key={i}
                className={`border-t border-brand-border py-10 pr-10 reveal reveal-delay-${Math.min(i + 1, 4)}`}
              >
                <span className="text-2xl text-brand-muted">{p.icon}</span>
                <h3 className="title-3 mt-4">{p.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-brand-muted">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="sp-section border-t border-brand-border" style={{ background: '#f7f7f7' }}>
        <div className="sp-container">
          <p className="title-4 reveal">Trade Programme</p>
          <h2 className="title-2 mt-4 reveal reveal-delay-1">What partners receive</h2>
          <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b, i) => (
              <div
                key={i}
                className={`border-t border-brand-border pt-8 reveal reveal-delay-${Math.min((i % 3) + 1, 3)}`}
              >
                <h3 className="title-3">{b.label}</h3>
                <p className="mt-3 text-sm leading-relaxed text-brand-muted">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Image + CTA */}
      <section className="sp-section border-t border-brand-border bg-white">
        <div className="sp-container">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
            <div className="reveal">
              <h2 className="title-2">Register your studio</h2>
              <p className="title-3 mt-6 leading-relaxed text-brand-muted">
                Fill out our trade enquiry form and we will respond within one business day.
                Partnerships are open to registered design firms, architecture practices, and
                established showrooms.
              </p>
              <Link to="/enquiry" className="btn-black mt-10">Apply for Trade Account</Link>
            </div>
            <div
              className="overflow-hidden reveal reveal-delay-2"
              style={{ aspectRatio: '4/3', background: '#f0eeeb' }}
            >
              <img
                src="/images/material-1.jpg"
                alt="Studio Pranavi craft"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

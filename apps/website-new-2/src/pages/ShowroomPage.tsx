import { Link } from 'react-router-dom';
import { PageMeta } from '@/components/ui/page-meta';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const SHOWROOM_DETAILS = [
  { label: 'Address', value: 'A-12, Sector 63, Design District\nNoida 201 301, Uttar Pradesh, India' },
  { label: 'Open Hours', value: 'Monday – Saturday\n10:00 am – 7:00 pm' },
  { label: 'Sunday', value: 'By appointment only' },
  { label: 'Phone', value: '+91 80 4567 8900' },
  { label: 'Email', value: 'showroom@studiopranavi.com' },
];

const WHAT_TO_EXPECT = [
  {
    title: 'Full-scale installations',
    desc: 'See our largest pieces live — from ceiling-height grand chandeliers to intimate pendant groupings — in purpose-built display spaces.',
  },
  {
    title: 'Material library',
    desc: 'Handle samples of every glass type, finish, and hardware option we offer. Our team will walk you through combinations for your specific brief.',
  },
  {
    title: 'Design consultations',
    desc: 'Book a private one-hour session with a Studio Pranavi designer. Bring your floor plan, mood board, or simply your instincts.',
  },
  {
    title: 'Prototype previews',
    desc: 'Active commissions are often visible in the studio. With client permission, we share in-progress work to illustrate our process.',
  },
];

export function ShowroomPage() {
  useScrollReveal();
  return (
    <>
      <PageMeta
        title="Showroom"
        description="Visit the Studio Pranavi showroom in Bengaluru — full-scale installations, material library, and design consultations."
        path="/showroom"
      />

      <section className="border-b border-brand-border py-20 lg:py-32 bg-white">
        <div className="sp-container">
          <p className="title-4">Collaboration</p>
          <h1 className="title-1 mt-6 max-w-2xl reveal">Visit our showroom</h1>
          <p className="title-3 mt-8 max-w-xl leading-relaxed text-brand-muted reveal reveal-delay-1">
            Our Noida showroom is where ideas become tangible. See finished pieces at
            full scale, explore materials, and meet the team behind the work.
          </p>
        </div>
      </section>

      {/* Hero image */}
      <section className="bg-white">
        <div className="sp-container pb-0">
          <div
            className="w-full overflow-hidden reveal"
            style={{ aspectRatio: '21/9', background: '#f0eeeb' }}
          >
            <img
              src="/images/showroom.jpg"
              alt="Studio Pranavi showroom interior"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* What to expect */}
      <section className="sp-section bg-white">
        <div className="sp-container">
          <h2 className="title-2 reveal">What to expect</h2>
          <div className="mt-14 grid grid-cols-1 gap-0 sm:grid-cols-2">
            {WHAT_TO_EXPECT.map((item, i) => (
              <div
                key={i}
                className={`border-t border-brand-border py-10 pr-10 reveal reveal-delay-${Math.min(i + 1, 4)}`}
              >
                <h3 className="title-3">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-brand-muted">{item.desc}</p>
              </div>
            ))}
            <div className="border-t border-brand-border sm:col-span-2" />
          </div>
        </div>
      </section>

      {/* Location & hours */}
      <section className="sp-section border-t border-brand-border" style={{ background: '#f7f7f7' }}>
        <div className="sp-container">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2">
            <div className="reveal">
              <h2 className="title-2">Find us</h2>
              <div className="mt-10 flex flex-col gap-6">
                {SHOWROOM_DETAILS.map((d) => (
                  <div key={d.label} className="border-t border-brand-border pt-5">
                    <p className="title-4 text-brand-muted">{d.label}</p>
                    <p className="title-3 mt-2 whitespace-pre-line">{d.value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="reveal reveal-delay-2">
              {/* Placeholder map frame */}
              <div
                className="w-full overflow-hidden"
                style={{ aspectRatio: '4/3', background: '#e8e6e2' }}
              >
                <img
                  src="/images/contact-visit.jpg"
                  alt="Showroom location"
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="mt-4 text-sm text-brand-muted">
                Located in Sector 63, Noida — accessible by metro (Blue Line, Sector 62 station)
                and ample parking available in the Design District complex.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Book a consultation */}
      <section className="sp-section border-t border-brand-border bg-white">
        <div className="sp-container">
          <h2 className="title-2 reveal">Book a private consultation</h2>
          <p className="title-3 mt-6 max-w-lg leading-relaxed text-brand-muted reveal reveal-delay-1">
            For a focused session with a designer — bring your brief and we'll spend an hour
            exploring what's possible. No commitment required.
          </p>
          <div className="mt-10 flex flex-wrap gap-4 reveal reveal-delay-2">
            <Link to="/enquiry" className="btn-black">Book a Visit</Link>
            <Link to="/contact" className="btn-outline">General enquiry</Link>
          </div>
        </div>
      </section>
    </>
  );
}

import { Link } from 'react-router-dom';
import { PageMeta } from '@/components/ui/page-meta';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const OPENINGS = [
  {
    title: 'Glass Artisan',
    type: 'Full-time · Studio',
    location: 'Noida, India',
    desc: 'We are looking for an experienced glassblower or glass fabricator to join our in-house production team. Minimum 5 years working with decorative or architectural glass.',
  },
  {
    title: 'Lighting Designer',
    type: 'Full-time · Design',
    location: 'Noida / Remote',
    desc: 'Conceptualise and develop bespoke lighting pieces in close collaboration with our creative director. Proficiency in Rhino, Illustrator, and an eye for materiality required.',
  },
  {
    title: 'Project Manager – Installations',
    type: 'Full-time · Operations',
    location: 'Noida, India',
    desc: 'Own the delivery lifecycle for large-scale custom installations: from client brief to site commissioning. Experience in luxury fit-out or high-end FF&E is a strong plus.',
  },
  {
    title: 'Business Development Executive',
    type: 'Full-time · Commercial',
    location: 'Noida / Delhi NCR',
    desc: 'Build relationships with interior designers, architects, and hospitality groups across India. Travel required. A network in the luxury segment is a strong advantage.',
  },
];

const VALUES = [
  { label: 'Craft-first culture', desc: 'Every decision starts with the question: does this serve the work?' },
  { label: 'Small, focused team', desc: 'No layers of bureaucracy — your ideas reach the creative director directly.' },
  { label: 'Meaningful projects', desc: 'Every piece we make ends up in a real space: a home, a hotel, a landmark building.' },
  { label: 'Learning & growth', desc: 'We invest in craft training, design travel, and material research for the whole team.' },
];

export function CareerPage() {
  useScrollReveal();
  return (
    <>
      <PageMeta
        title="Career"
        description="Join Studio Pranvi — careers in glass artistry, lighting design, and project management."
        path="/career"
      />

      <section className="border-b border-brand-border py-20 lg:py-32 bg-white">
        <div className="sp-container">
          <p className="title-4">Collaboration</p>
          <h1 className="title-1 mt-6 max-w-2xl reveal">Build something lasting with us</h1>
          <p className="title-3 mt-8 max-w-xl leading-relaxed text-brand-muted reveal reveal-delay-1">
            Studio Pranvi is a small team that punches well above its size. We are always
            looking for makers, thinkers, and people who care deeply about their craft.
          </p>
        </div>
      </section>

      {/* Open roles */}
      <section className="sp-section bg-white">
        <div className="sp-container">
          <h2 className="title-2 reveal">Open positions</h2>
          <div className="mt-12 flex flex-col gap-0">
            {OPENINGS.map((role, i) => (
              <div
                key={i}
                className={`border-t border-brand-border py-10 reveal reveal-delay-${Math.min((i % 3) + 1, 3)}`}
              >
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-12 lg:items-start">
                  <div>
                    <h3 className="title-3">{role.title}</h3>
                    <p className="title-4 mt-2">{role.type}</p>
                    <p className="title-4 mt-1 text-brand-muted">{role.location}</p>
                  </div>
                  <p className="text-sm leading-relaxed text-brand-muted lg:col-span-2">{role.desc}</p>
                </div>
                <div className="mt-6">
                  <Link
                    to="/enquiry"
                    className="btn-outline"
                    style={{ display: 'inline-block', padding: '10px 24px' }}
                  >
                    Apply for this role
                  </Link>
                </div>
              </div>
            ))}
            <div className="border-t border-brand-border" />
          </div>
        </div>
      </section>

      {/* Why join us */}
      <section className="sp-section border-t border-brand-border" style={{ background: '#f7f7f7' }}>
        <div className="sp-container">
          <h2 className="title-2 reveal">Why Studio Pranvi</h2>
          <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2">
            {VALUES.map((v, i) => (
              <div
                key={i}
                className={`border-t border-brand-border pt-8 reveal reveal-delay-${Math.min(i + 1, 4)}`}
              >
                <h3 className="title-3">{v.label}</h3>
                <p className="mt-3 text-sm leading-relaxed text-brand-muted">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Speculative applications */}
      <section className="sp-section border-t border-brand-border bg-white">
        <div className="sp-container">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
            <div className="reveal">
              <h2 className="title-2">Don't see your role?</h2>
              <p className="title-3 mt-6 leading-relaxed text-brand-muted">
                We welcome speculative applications from extraordinary craftspeople and
                designers. Tell us who you are and what you would bring to the studio.
              </p>
              <Link to="/enquiry" className="btn-black mt-10">Send a Speculative Application</Link>
            </div>
            <div
              className="overflow-hidden reveal reveal-delay-2"
              style={{ aspectRatio: '4/3', background: '#f0eeeb' }}
            >
              <img
                src="/images/material-2.jpg"
                alt="Studio Pranvi workspace"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

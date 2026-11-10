import { Link } from 'react-router-dom';
import { PageMeta } from '@/components/ui/page-meta';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const CATEGORIES = [
  { id: 'grand', label: 'Grand', image: '/images/cat-grand.jpg' },
  { id: 'chandeliers', label: 'Chandeliers', image: '/images/cat-chandeliers.jpg' },
  { id: 'installations', label: 'Installations', image: '/images/cat-installations.jpg' },
  { id: 'pendants', label: 'Pendants', image: '/images/cat-pendants.jpg' },
  { id: 'floor-lamps', label: 'Floor Lamps', image: '/images/cat-floor-lamps.jpg' },
  { id: 'decor', label: 'Décor, Gifts', image: '/images/cat-decor.jpg' },
];

const NEW_COLLECTIONS = [
  { id: 'klevver', name: 'Klevver Installation', models: 7, image: '/images/prod-klevver.jpg' },
  { id: 'splash', name: 'Splash Installation', models: 8, image: '/images/prod-splash.jpg' },
  { id: 'mobula', name: 'Mobula Installation', models: 5, image: '/images/prod-mobula.jpg' },
  { id: 'voda', name: 'Voda Installation', models: 3, image: '/images/prod-voda.jpg' },
  { id: 'olalo', name: 'Olalo Installation', models: 8, image: '/images/prod-olalo.jpg' },
  { id: 'rene', name: 'Rene Mono Installation', models: 5, image: '/images/prod-rene.jpg' },
];

const NEWS = [
  { date: '18.08.2026', title: 'Klevver: Special meaning in every element', image: '/images/news-1.jpg' },
  { date: '24.06.2026', title: 'The story of glass: how crystal entered our collections', image: '/images/news-2.jpg' },
  { date: '01.09.2025', title: 'Mobula collection — pure creativity in motion', image: '/images/news-3.jpg' },
];

const CONTACT_CARDS = [
  { label: 'Our studios', action: 'Show information', image: '/images/contact-offices.jpg' },
  { label: 'Send a message', action: 'Send a message', image: '/images/contact-message.jpg' },
  { label: 'Visit us', action: 'Visit our showroom', image: '/images/contact-visit.jpg' },
];

const HERO_SLIDES = [
  { src: '/images/cat-installations.jpg',  alt: 'Glass installation' },
  { src: '/images/chandelier-ellea2.jpg',  alt: 'Ellea chandelier' },
  { src: '/images/grand-rene.jpg',         alt: 'Rene grand installation' },
  { src: '/images/cat-grand.jpg',          alt: 'Grand chandelier' },
  { src: '/images/cat-chandeliers.jpg',    alt: 'Chandeliers collection' },
];


export function HomePage() {
  useScrollReveal();

  return (
    <>
      <PageMeta
        title="STUDIO PRANAVI"
        description="Studio Pranavi creates bespoke glass installations and architectural lighting — works of art that fill your space with grace and light."
        path="/"
      />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section
        className="relative flex min-h-screen flex-col justify-end overflow-hidden"
        style={{ background: '#0e0d0b' }}
      >
        {/* ── Background slideshow — 5 images crossfade ── */}
        {HERO_SLIDES.map((slide, i) => (
          <img
            key={i}
            src={slide.src}
            alt={slide.alt}
            className="hero-slide"
            style={{ opacity: 0, objectFit: 'cover' }}
          />
        ))}

        {/* Dark gradient — bottom-heavy so text stays readable */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 2,
            background: 'linear-gradient(to top, rgba(10,9,8,0.92) 0%, rgba(10,9,8,0.4) 45%, rgba(10,9,8,0.08) 100%)',
          }}
        />

        {/* Warm amber glow */}
        <div className="hero-glow" style={{ zIndex: 3 }} />

        {/* Floating light orbs */}
        {([
          { size: 7,  left: '10%', bottom: '32%', delay: '0s',    dur: '7s'   },
          { size: 4,  left: '25%', bottom: '48%', delay: '1.8s',  dur: '9s'   },
          { size: 9,  left: '42%', bottom: '22%', delay: '0.6s',  dur: '8s'   },
          { size: 3,  left: '28%', bottom: '55%', delay: '2.4s',  dur: '6.5s' },
          { size: 5,  left: '52%', bottom: '62%', delay: '4.0s',  dur: '8.5s' },
          { size: 3,  left: '18%', bottom: '65%', delay: '2.8s',  dur: '9.5s' },
        ] as { size: number; left: string; bottom: string; delay: string; dur: string }[]).map((o, i) => (
          <div
            key={i}
            className="light-orb"
            style={{ width: o.size, height: o.size, left: o.left, bottom: o.bottom, animationDelay: o.delay, animationDuration: o.dur, zIndex: 3 }}
          />
        ))}

        {/* ── Text ── */}
        <div className="relative sp-container pb-24 lg:pb-32 text-white" style={{ zIndex: 10 }}>
          <p
            className="title-4 hero-in hero-in-1"
            style={{ color: 'rgba(255,210,110,0.85)', letterSpacing: '0.22em' }}
          >
            Bespoke Glass &amp; Lighting
          </p>
          <h1 className="title-1 mt-4 hero-in hero-in-2" style={{ maxWidth: '640px' }}>
            Light harmony masters
          </h1>
          <p
            className="title-4 mt-5 hero-in hero-in-3"
            style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', letterSpacing: '0.15em', maxWidth: '360px' }}
          >
            We create works of art that fill your space with grace and light.
          </p>
          <div className="mt-10 flex flex-wrap gap-4 hero-in" style={{ animationDelay: '0.85s' }}>
            <button
              type="button"
              className="btn-outline-white"
              onClick={() => document.getElementById('categories-main')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Explore catalogue
            </button>
            <Link to="/enquiry" className="btn-black">Get a Quote</Link>
          </div>
        </div>
      </section>

      {/* ── Categories ───────────────────────────────────────── */}
      <section id="categories-main" className="sp-section bg-white">
        <div className="sp-container">
          <h2 className="title-2 reveal">Categories</h2>
          <div className="h-scroll mt-10">
            {CATEGORIES.map((cat, i) => (
              <Link
                key={cat.id}
                to="/collections"
                className={`group block flex-shrink-0 reveal reveal-delay-${Math.min(i + 1, 4) as 1 | 2 | 3 | 4}`}
                style={{ width: 'clamp(160px, 22vw, 280px)' }}
              >
                <div className="gleam-card relative bg-brand-bgalt" style={{ aspectRatio: '3/4' }}>
                  <img
                    src={cat.image}
                    alt={cat.label}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <h3 className="title-3 mt-3">{cat.label}</h3>
              </Link>
            ))}
          </div>
          <div className="mt-10 reveal">
            <Link to="/collections" className="btn-black">View entire catalogue</Link>
          </div>
        </div>
      </section>

      {/* ── Brand Statement ──────────────────────────────────── */}
      <section className="sp-section bg-white border-t border-brand-border">
        <div className="sp-container">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
            <p className="title-3 max-w-xl leading-relaxed reveal">
              Studio Pranavi's artistic glass and lighting is more than illumination. It is emotion,
              art, and the style of your new interior space.
            </p>
            <div className="flex justify-start lg:justify-end reveal reveal-delay-2">
              <Link to="/about" className="btn-black">Learn more</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── New Collections ──────────────────────────────────── */}
      <section className="sp-section bg-white border-t border-brand-border">
        <div className="sp-container">
          <h2 className="title-2 reveal">New collections</h2>
        </div>
        <div className="sp-container mt-10">
          <div className="h-scroll">
            {NEW_COLLECTIONS.map((item, i) => (
              <Link
                key={item.id}
                to="/collections"
                className={`group block flex-shrink-0 reveal reveal-delay-${Math.min(i + 1, 4) as 1 | 2 | 3 | 4}`}
                style={{ width: 'clamp(200px, 28vw, 380px)' }}
              >
                <div className="gleam-card relative bg-brand-bgalt" style={{ aspectRatio: '3/4' }}>
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="mt-4">
                  <h3 className="title-3">{item.name}</h3>
                  <p className="title-4 mt-1">Available {item.models} models</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Brand History ────────────────────────────────────── */}
      <section className="sp-section border-t border-brand-border" style={{ background: '#f7f7f7' }}>
        <div className="sp-container">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-start">
            <div className="reveal">
              <p className="title-4">Brand history</p>
              <p className="title-3 mt-8 leading-relaxed text-brand-muted">
                Studio Pranavi was born from a design studio that had been creating high-end interior
                projects for over a decade. Even before the studio appeared, our designers studied
                glass and light as art forms — understanding how material, form, and luminosity
                interact to shape human emotion and spatial experience.
              </p>
              <Link to="/about" className="btn-black mt-10">Learn more</Link>
            </div>
            <div className="reveal-clip reveal-delay-2 bg-white" style={{ aspectRatio: '4/5' }}>
              <img
                src="/images/about-studio.jpg"
                alt="Studio Pranavi workshop"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Selected Materials ───────────────────────────────── */}
      <section className="sp-section border-t border-brand-border bg-white">
        <div className="sp-container">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
            <div className="order-2 lg:order-1 grid grid-cols-2 gap-3 reveal">
              <div className="overflow-hidden bg-brand-bgalt" style={{ aspectRatio: '1' }}>
                <img
                  src="/images/material-1.jpg"
                  alt="Glass material"
                  className="h-full w-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
              <div className="overflow-hidden bg-brand-bgalt" style={{ aspectRatio: '1' }}>
                <img
                  src="/images/material-2.jpg"
                  alt="Crystal material"
                  className="h-full w-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            </div>
            <div className="order-1 lg:order-2 reveal reveal-delay-2">
              <h2 className="title-2">Selected Materials</h2>
              <p className="title-3 mt-8 leading-relaxed text-brand-muted">
                Classic handblown glass and innovative architectural crystal. We select the material
                to suit the purpose of each collection — to highlight the aesthetics of the concept,
                the purity of light, and the depth of the material's inner glow.
              </p>
              <Link to="/collections" className="btn-black mt-10">Learn more</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Brand Values ─────────────────────────────────────── */}
      <section className="sp-section border-t border-brand-border" style={{ background: '#f7f7f7' }}>
        <div className="sp-container">
          <h2 className="title-2 reveal">Brand values</h2>
          <p className="title-3 mt-6 max-w-2xl leading-relaxed text-brand-muted reveal reveal-delay-1">
            Studio Pranavi's distinctive style arises from a unique combination of product qualities
            and craftsmanship: treating glass and light as art, contrasting and unusual materials,
            and unwavering attention to detail.
          </p>
          <div className="mt-16 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Light as Art', desc: 'Every piece is conceived as a work of art first, a functional object second.' },
              { label: 'Unusual Materials', desc: 'Handblown glass, architectural crystal, rare minerals — selected for the emotion they carry.' },
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

      {/* ── Stats ────────────────────────────────────────────── */}
      <section className="sp-section border-t border-brand-border bg-white">
        <div className="sp-container">
          <p className="title-4 reveal">Studio Pranavi today</p>
          <div className="mt-12 grid grid-cols-2 gap-10 lg:grid-cols-4">
            {[
              { stat: '5,000+ sq.ft.', desc: 'of production and creative studio space' },
              { stat: '40+', desc: 'Artisans and designers creating unique pieces for you' },
              { stat: '12 states', desc: 'Installations delivered and installed across India' },
              { stat: '8 years', desc: 'Of work in the field of glass art and architectural lighting' },
            ].map((item, i) => (
              <div key={i} className={`reveal reveal-delay-${Math.min(i + 1, 4) as 1 | 2 | 3 | 4}`}>
                <h3 className="title-2">{item.stat}</h3>
                <p className="mt-3 text-sm leading-relaxed text-brand-muted">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Join Us ──────────────────────────────────────────── */}
      <section className="sp-section border-t border-brand-border bg-white">
        <div className="sp-container">
          <p className="title-4 reveal">Join us</p>
          <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
            <p className="title-3 max-w-lg leading-relaxed reveal reveal-delay-1">
              We love sharing our stories. Follow us on social media to learn more about our work
              and process.
            </p>
            <ul className="space-y-5 reveal reveal-delay-2">
              {[
                { href: 'https://instagram.com', label: 'Instagram' },
                { href: 'https://pinterest.com', label: 'Pinterest' },
                { href: 'https://linkedin.com', label: 'LinkedIn' },
              ].map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    className="title-3 link-dotted"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── News ─────────────────────────────────────────────── */}
      <section className="sp-section border-t border-brand-border" style={{ background: '#f7f7f7' }}>
        <div className="sp-container">
          <div className="flex items-end justify-between reveal">
            <h4 className="title-2">News</h4>
            <Link to="/about" className="btn-black">See all news</Link>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-10 sm:grid-cols-3">
            {NEWS.map((item, i) => (
              <article key={i} className={`reveal reveal-delay-${Math.min(i + 1, 3) as 1 | 2 | 3}`}>
                <div className="overflow-hidden bg-white" style={{ aspectRatio: '16/10' }}>
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover transition-opacity hover:opacity-80"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
                <span className="gray mt-4 block text-xs">{item.date}</span>
                <h3 className="title-3 mt-2">{item.title}</h3>
                <Link to="/about" className="btn-black mt-5">Read</Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Showroom ─────────────────────────────────────────── */}
      <section className="sp-section border-t border-brand-border bg-white">
        <div className="sp-container">
          <h3 className="title-2 reveal">Showroom</h3>
          <div className="mt-10 grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-start">
            <div className="reveal reveal-delay-1">
              <p className="title-3 leading-relaxed text-brand-muted">
                Visit our studio and showroom. The Studio Pranavi team will be happy to welcome you
                and answer all your questions about bespoke commissions and projects.
              </p>
              <ul className="mt-8 space-y-2">
                {['By appointment only', 'India', 'Mon–Sat 10:00–18:00', 'Tel: +91 98765 43210'].map((l) => (
                  <li key={l} className="title-4">{l}</li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/enquiry" className="btn-black">Book a visit</Link>
                <Link to="/contact" className="btn-outline">Get directions</Link>
              </div>
            </div>
            <div className="reveal-clip reveal-delay-2 bg-brand-bgalt" style={{ aspectRatio: '4/3' }}>
              <img
                src="/images/showroom.jpg"
                alt="Studio Pranavi showroom"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Contacts ─────────────────────────────────────────── */}
      <section className="sp-section border-t border-brand-border bg-white">
        <div className="sp-container">
          <h3 className="title-2 reveal">Contacts</h3>
          <p className="title-3 mt-6 max-w-xl leading-relaxed text-brand-muted reveal reveal-delay-1">
            Our customer care team is available every day and ready to help with any request.
          </p>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {CONTACT_CARDS.map((card, i) => (
              <div key={i} className={`reveal reveal-delay-${Math.min(i + 1, 3) as 1 | 2 | 3}`}>
                <div className="flex items-center justify-between">
                  <Link to="/contact" className="title-3 link-dotted">{card.label}</Link>
                  <Link to="/contact" className="btn-black ml-4">{card.action}</Link>
                </div>
                <div className="mt-5 overflow-hidden bg-brand-bgalt" style={{ aspectRatio: '4/3' }}>
                  <img
                    src={card.image}
                    alt={card.label}
                    className="h-full w-full object-cover transition-opacity hover:opacity-80"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Downloads ────────────────────────────────────────── */}
      <section className="sp-section border-t border-brand-border" style={{ background: '#f7f7f7' }}>
        <div className="sp-container">
          <p className="title-4 reveal">Downloads</p>
          <div className="mt-8 grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-start">
            <div className="reveal reveal-delay-1">
              <p className="title-3 leading-relaxed text-brand-muted">
                Take advantage of Studio Pranavi partner benefits. Download high-quality images and
                technical materials. Create impressive projects and reach new heights!
              </p>
              <Link to="/contact" className="btn-black mt-10">Go to Downloads</Link>
            </div>
            <div className="grid grid-cols-2 gap-3 reveal reveal-delay-2">
              {[
                '/images/download-1.jpg',
                '/images/download-2.jpg',
                '/images/download-3.jpg',
                '/images/download-4.jpg',
              ].map((src, i) => (
                <div key={i} className="overflow-hidden bg-white" style={{ aspectRatio: '1' }}>
                  <img
                    src={src}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

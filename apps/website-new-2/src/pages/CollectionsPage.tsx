import { Link } from 'react-router-dom';
import { PageMeta } from '@/components/ui/page-meta';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const COLLECTIONS = [
  {
    id: 'grand',
    title: 'Grand Installations',
    desc: 'Monumental glass sculptures and lighting installations for grand lobbies, hotels, and landmark spaces.',
    image: '/images/service-architectural-lighting.jpg',
  },
  {
    id: 'chandeliers',
    title: 'Chandeliers',
    desc: 'Custom handcrafted chandeliers in glass, crystal, and mixed media for residential and commercial interiors.',
    image: '/images/service-decorative-lighting.jpg',
  },
  {
    id: 'installations',
    title: 'Architectural Glass',
    desc: 'Bespoke glass panels, partitions, facades, and structural glass elements tailored to your architectural vision.',
    image: '/images/service-architectural-glass.jpg',
  },
  {
    id: 'pendants',
    title: 'Pendant Lights',
    desc: 'Singular and cluster pendant lights in handblown glass and architectural crystal.',
    image: '/images/service-decorative-glass.jpg',
  },
  {
    id: 'floor-lamps',
    title: 'Floor Lamps',
    desc: 'Statement floor lamps that serve as sculptural pieces in any interior setting.',
    image: '/images/service-custom-fabrication.jpg',
  },
  {
    id: 'decor',
    title: 'Décor Objects',
    desc: 'Smaller glass art pieces, vases, and bespoke gifts — each a work of art in miniature.',
    image: '/images/about-studio.jpg',
  },
];

export function CollectionsPage() {
  useScrollReveal();
  return (
    <>
      <PageMeta
        title="Collections"
        description="Explore Studio Pranavi's collections of bespoke glass and lighting."
        path="/collections"
      />

      <section className="border-b border-brand-border py-20 lg:py-32 bg-white">
        <div className="sp-container">
          <p className="title-4">Catalogue</p>
          <h1 className="title-1 mt-6 reveal">Collections</h1>
          <p className="title-3 mt-6 max-w-xl leading-relaxed text-brand-muted reveal reveal-delay-1">
            Each piece is conceived as a work of art — designed for the space, crafted for the moment.
          </p>
        </div>
      </section>

      <section className="sp-section bg-white">
        <div className="sp-container">
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3">
            {COLLECTIONS.map((col, i) => (
              <Link
                key={col.id}
                to="/enquiry"
                className={`group block reveal reveal-delay-${Math.min((i % 3) + 1, 3) as 1 | 2 | 3}`}
              >
                <div className="overflow-hidden bg-brand-bgalt" style={{ aspectRatio: '4/5' }}>
                  <img
                    src={col.image}
                    alt={col.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
                <h3 className="title-3 mt-5">{col.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-brand-muted">{col.desc}</p>
                <span className="mt-4 inline-flex text-xs uppercase tracking-widest text-brand-muted transition-opacity group-hover:opacity-60">
                  Enquire →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-brand-border sp-section" style={{ background: '#f7f7f7' }}>
        <div className="sp-container text-center">
          <h2 className="title-2 reveal">Commission a bespoke piece</h2>
          <p className="title-3 mt-6 mx-auto max-w-lg leading-relaxed text-brand-muted reveal reveal-delay-1">
            Every Studio Pranavi piece is made to order. Tell us about your project and we will create
            something extraordinary together.
          </p>
          <Link to="/enquiry" className="btn-black mt-10 reveal reveal-delay-2">Get a Quote</Link>
        </div>
      </section>
    </>
  );
}

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageMeta } from '@/components/ui/page-meta';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const CATEGORIES = [
  { id: 'all', label: 'All Products' },
  { id: 'grand', label: 'Large Installations' },
  { id: 'chandeliers', label: 'Chandeliers' },
  { id: 'installations', label: 'Installations' },
  { id: 'pendants', label: 'Pendant Lights' },
  { id: 'floor-lamps', label: 'Floor Lamps' },
];

const PRODUCTS = [
  // Large Installations
  { id: 'grand-espira', name: 'Espira Grand', category: 'grand', models: 4, isNew: true, image: '/images/grand-espira.jpg' },
  { id: 'grand-ellea', name: 'Ellea Grand', category: 'grand', models: 6, isNew: false, image: '/images/grand-ellea.jpg' },
  { id: 'grand-rene', name: 'Rene Grand', category: 'grand', models: 3, isNew: false, image: '/images/grand-rene.jpg' },
  // Chandeliers
  { id: 'chandelier-espira', name: 'Espira Chandelier', category: 'chandeliers', models: 5, isNew: true, image: '/images/chandelier-espira.jpg' },
  { id: 'chandelier-ellea', name: 'Ellea Chandelier', category: 'chandeliers', models: 4, isNew: false, image: '/images/chandelier-ellea.jpg' },
  { id: 'chandelier-rene', name: 'Rene Chandelier', category: 'chandeliers', models: 3, isNew: false, image: '/images/chandelier-rene.jpg' },
  { id: 'chandelier-rene2', name: 'Rene Rectangular', category: 'chandeliers', models: 2, isNew: true, image: '/images/chandelier-rene2.jpg' },
  { id: 'chandelier-ellea2', name: 'Ellea Rectangular', category: 'chandeliers', models: 2, isNew: false, image: '/images/chandelier-ellea2.jpg' },
  // Installations
  { id: 'inst-klevver', name: 'Klevver Installation', category: 'installations', models: 7, isNew: true, image: '/images/prod-klevver.jpg' },
  { id: 'inst-voda', name: 'Voda Installation', category: 'installations', models: 3, isNew: false, image: '/images/prod-voda.jpg' },
  { id: 'inst-mobula', name: 'Mobula Installation', category: 'installations', models: 5, isNew: false, image: '/images/prod-mobula.jpg' },
  { id: 'inst-lita', name: 'Lita Installation', category: 'installations', models: 4, isNew: true, image: '/images/inst-lita.jpg' },
  { id: 'inst-olalo', name: 'Olalo Installation', category: 'installations', models: 8, isNew: false, image: '/images/prod-olalo.jpg' },
  { id: 'inst-espira', name: 'Espira Installation', category: 'installations', models: 6, isNew: false, image: '/images/inst-espira.jpg' },
  { id: 'inst-mireya', name: 'Mireya Installation', category: 'installations', models: 3, isNew: true, image: '/images/inst-mireya.jpg' },
  { id: 'inst-rene', name: 'Rene Mono Installation', category: 'installations', models: 5, isNew: false, image: '/images/prod-rene.jpg' },
  // Pendant Lights
  { id: 'pendant-espira', name: 'Espira Pendant', category: 'pendants', models: 5, isNew: true, image: '/images/pendant-espira.jpg' },
  { id: 'pendant-ellea', name: 'Ellea Pendant', category: 'pendants', models: 4, isNew: false, image: '/images/pendant-ellea.jpg' },
  { id: 'pendant-rene', name: 'Rene Pendant', category: 'pendants', models: 3, isNew: false, image: '/images/pendant-rene.jpg' },
  // Floor Lamps
  { id: 'floor-espira', name: 'Espira Floor Lamp', category: 'floor-lamps', models: 3, isNew: false, image: '/images/floor-espira.jpg' },
  { id: 'floor-ellea', name: 'Ellea Floor Lamp', category: 'floor-lamps', models: 2, isNew: true, image: '/images/floor-ellea.jpg' },
];

const PORTFOLIO = [
  { image: '/images/contact-offices.jpg', title: 'Residential Villa, Mumbai' },
  { image: '/images/contact-message.jpg', title: 'Hotel Lobby, Bengaluru' },
  { image: '/images/contact-visit.jpg', title: 'Corporate HQ, Delhi' },
  { image: '/images/showroom.jpg', title: 'Private Residence, Hyderabad' },
];

export function ProductsPage() {
  useScrollReveal();
  const [activeCategory, setActiveCategory] = useState('all');

  // When the filter changes, all new cards are already in the viewport.
  // The IntersectionObserver from useScrollReveal only saw the initial DOM,
  // so we manually promote any un-revealed elements after React re-renders.
  useEffect(() => {
    const timer = setTimeout(() => {
      document.querySelectorAll('.reveal:not(.is-visible)').forEach((el) => {
        el.classList.add('is-visible');
      });
    }, 40);
    return () => clearTimeout(timer);
  }, [activeCategory]);

  const filtered =
    activeCategory === 'all' ? PRODUCTS : PRODUCTS.filter((p) => p.category === activeCategory);

  return (
    <>
      <PageMeta
        title="Products"
        description="Browse Studio Pranavi's full catalogue of bespoke glass and lighting."
        path="/products"
      />

      <section className="border-b border-brand-border py-20 lg:py-28 bg-white">
        <div className="sp-container">
          <p className="title-4">Catalogue</p>
          <h1 className="title-1 mt-4 reveal">Products</h1>
        </div>
      </section>

      {/* Sticky category filter tabs */}
      <div className="sticky top-0 z-40 border-b border-brand-border bg-white">
        <div className="sp-container overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <div className="flex min-w-max">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  borderBottom: `2px solid ${activeCategory === cat.id ? '#231F20' : 'transparent'}`,
                  color: activeCategory === cat.id ? '#231F20' : '#888',
                  padding: '1rem 1.25rem',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '0.6875rem',
                  fontWeight: 400,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  background: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'color 0.2s, border-color 0.2s',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Product grid */}
      <section className="sp-section bg-white">
        <div className="sp-container">
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((product, i) => (
              <Link
                key={product.id}
                to="/enquiry"
                className={`group block reveal reveal-delay-${Math.min((i % 4) + 1, 4)}`}
              >
                <div
                  className="relative overflow-hidden"
                  style={{ aspectRatio: '3/4', background: '#f0eeeb' }}
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {product.isNew && (
                    <span
                      className="absolute left-3 top-3 px-2 py-0.5"
                      style={{
                        background: '#231F20',
                        color: '#fff',
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '0.6rem',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                      }}
                    >
                      New
                    </span>
                  )}
                </div>
                <h3 className="title-3 mt-3">{product.name}</h3>
                <p className="title-4 mt-1">Available {product.models} models</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Completed Projects */}
      <section className="sp-section border-t border-brand-border" style={{ background: '#f7f7f7' }}>
        <div className="sp-container">
          <p className="title-4 reveal">Completed Projects</p>
          <h2 className="title-2 mt-4 reveal reveal-delay-1">Our Work in Spaces</h2>
          <div className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {PORTFOLIO.map((item, i) => (
              <div
                key={i}
                className={`group reveal reveal-delay-${Math.min(i + 1, 4)}`}
              >
                <div className="overflow-hidden" style={{ aspectRatio: '3/4', background: '#e8e6e2' }}>
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <p className="mt-3 text-sm text-brand-muted">{item.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Custom project CTA */}
      <section className="sp-section border-t border-brand-border bg-white">
        <div className="sp-container">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
            <div className="reveal">
              <p className="title-4">Custom Project</p>
              <h2 className="title-2 mt-4">Commission a bespoke piece</h2>
              <p className="title-3 mt-6 leading-relaxed text-brand-muted">
                Don't see exactly what you're looking for? Every Studio Pranavi piece can be made
                entirely to your specifications — size, material, finish, and form.
              </p>
              <Link to="/enquiry" className="btn-black mt-10">Request a Custom Quote</Link>
            </div>
            <div
              className="overflow-hidden reveal reveal-delay-2"
              style={{ aspectRatio: '4/3', background: '#f0eeeb' }}
            >
              <img
                src="/images/material-2.jpg"
                alt="Bespoke Studio Pranavi installation"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

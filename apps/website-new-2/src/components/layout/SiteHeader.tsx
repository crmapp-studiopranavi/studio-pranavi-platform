import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  to?: string;
  children?: { label: string; to: string }[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Catalogue',
    to: '/collections',
    children: [
      { label: 'Products', to: '/products' },
      { label: 'Collections', to: '/collections' },
      { label: 'Uniqueness', to: '/about' },
      { label: 'Downloads', to: '/contact' },
    ],
  },
  { label: 'About', to: '/about' },
  {
    label: 'Collaboration',
    children: [
      { label: 'Partners', to: '/partners' },
      { label: 'Career', to: '/career' },
      { label: 'Showroom', to: '/showroom' },
    ],
  },
  { label: 'Contact', to: '/contact' },
  { label: 'Blog', to: '/about' },
];

function NavDropdown({ items }: { items: { label: string; to: string }[] }) {
  return (
    <div
      className="absolute left-0 top-full mt-2 z-50 rounded-2xl py-3"
      style={{
        background: 'rgba(200,198,194,0.82)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        minWidth: '180px',
      }}
    >
      {items.map((item) => (
        <Link
          key={item.label}
          to={item.to}
          className="block px-5 py-3 text-brand-text transition-opacity hover:opacity-60"
          style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 300, fontSize: '1.15rem' }}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}

export function SiteHeader() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    setOpenMenu(null);
    setMobileOpen(false);
  }, [location]);

  const isActive = (item: NavItem) => {
    if (item.to && location.pathname === item.to) return true;
    if (item.children?.some((c) => location.pathname === c.to)) return true;
    return false;
  };

  return (
    <header className="relative w-full z-50" ref={headerRef}>
      <div className="sp-container flex items-center justify-between" style={{ height: '120px' }}>
        {/* Logo — left */}
        <Link to="/" aria-label="Studio Pranavi — Home" className="flex items-center gap-3">
          <img
            src="/images/logo.png"
            alt="Studio Pranavi"
            className="w-auto object-contain"
            style={{ height: '100px', maxWidth: '300px' }}
          />
        </Link>

        {/* Pill nav — right, desktop only */}
        <nav
          aria-label="Main navigation"
          className="hidden md:flex items-center relative"
          style={{
            background: 'rgba(220,218,214,0.65)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: '999px',
            padding: '6px 6px',
          }}
        >
          {NAV_ITEMS.map((item) => {
            const active = isActive(item);
            const hasChildren = Boolean(item.children?.length);

            return (
              <div key={item.label} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    if (hasChildren) {
                      setOpenMenu(openMenu === item.label ? null : item.label);
                    } else if (item.to) {
                      setOpenMenu(null);
                    }
                  }}
                  onMouseEnter={() => hasChildren && setOpenMenu(item.label)}
                  className="flex items-center gap-1 cursor-pointer transition-opacity hover:opacity-70"
                  style={{
                    background: active ? 'rgba(190,188,184,0.85)' : 'transparent',
                    borderRadius: '999px',
                    padding: '8px 20px',
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '0.875rem',
                    fontWeight: 400,
                    color: '#231F20',
                    border: 'none',
                    outline: 'none',
                  }}
                >
                  {item.to && !hasChildren ? (
                    <Link
                      to={item.to}
                      className="block"
                      style={{ color: '#231F20', textDecoration: 'none' }}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span>{item.label}</span>
                  )}
                </button>

                {hasChildren && openMenu === item.label && (
                  <div onMouseLeave={() => setOpenMenu(null)}>
                    <NavDropdown items={item.children!} />
                  </div>
                )}
              </div>
            );
          })}

          <Link
            to="/enquiry"
            className="ml-2"
            style={{
              background: '#231F20',
              borderRadius: '999px',
              padding: '8px 20px',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '0.8125rem',
              fontWeight: 400,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#fff',
              textDecoration: 'none',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            Get a Quote
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 md:hidden"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <span className="sr-only">{mobileOpen ? 'Close menu' : 'Open menu'}</span>
          <span className={cn('block h-px w-6 bg-brand-text transition-all', mobileOpen && 'translate-y-2 rotate-45')} />
          <span className={cn('block h-px w-6 bg-brand-text transition-all', mobileOpen && 'opacity-0')} />
          <span className={cn('block h-px w-6 bg-brand-text transition-all', mobileOpen && '-translate-y-2 -rotate-45')} />
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-brand-border bg-white md:hidden">
          <nav className="sp-container flex flex-col gap-1 py-8">
            {NAV_ITEMS.map((item) => (
              <div key={item.label}>
                {item.to ? (
                  <Link
                    to={item.to}
                    className="block py-3 title-4 text-brand-text hover:text-brand-muted"
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className="block py-3 title-4 text-brand-muted">{item.label}</span>
                )}
                {item.children && (
                  <div className="ml-4 mt-1 mb-2 space-y-2">
                    {item.children.map((child) => (
                      <Link
                        key={child.label}
                        to={child.to}
                        className="block py-1.5"
                        style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 300, fontSize: '1.1rem', color: '#888' }}
                        onClick={() => setMobileOpen(false)}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="mt-4 pt-4 border-t border-brand-border">
              <Link
                to="/enquiry"
                className="btn-black inline-block"
                onClick={() => setMobileOpen(false)}
              >
                Get a Quote
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

import { Link } from 'react-router-dom';

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-white">
      <div className="sp-container">
        <hr className="border-brand-border" />
        <div className="grid grid-cols-2 gap-10 py-16 sm:grid-cols-3 lg:grid-cols-5">
          <div>
            <h5 className="title-4">Catalogue</h5>
            <ul className="mt-4 space-y-2.5">
              {['Products', 'Collections', 'Uniqueness', 'Downloads'].map((l) => (
                <li key={l}>
                  <Link to="/collections" className="text-sm text-brand-muted transition-opacity hover:opacity-70">
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="title-4">Company</h5>
            <ul className="mt-4 space-y-2.5">
              {[
                { label: 'About', to: '/about' },
                { label: 'Collaboration', to: '/contact' },
                { label: 'Contact', to: '/contact' },
                { label: 'Blog', to: '/about' },
              ].map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm text-brand-muted transition-opacity hover:opacity-70">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="title-4">Customer Care</h5>
            <ul className="mt-4 space-y-2.5">
              {['Delivery', 'Payment', 'Care', 'Warranty'].map((l) => (
                <li key={l}>
                  <Link to="/contact" className="text-sm text-brand-muted transition-opacity hover:opacity-70">
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="title-4">Social</h5>
            <ul className="mt-4 space-y-2.5">
              {[
                { label: 'Instagram', href: 'https://instagram.com' },
                { label: 'Pinterest', href: 'https://pinterest.com' },
                { label: 'LinkedIn', href: 'https://linkedin.com' },
              ].map((l) => (
                <li key={l.label}>
                  <a href={l.href} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-muted transition-opacity hover:opacity-70">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="title-4">Legal</h5>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link to="/privacy" className="text-sm text-brand-muted transition-opacity hover:opacity-70">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <span className="text-sm text-brand-dim">Credits</span>
              </li>
            </ul>
          </div>
        </div>

        <hr className="border-brand-border" />
        <div className="flex items-center justify-between py-6">
          <p className="text-xs text-brand-dim">&copy; {year} Studio Pranavi. All rights reserved.</p>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-xs text-brand-muted transition-opacity hover:opacity-70 uppercase tracking-widest"
          >
            To top
          </button>
        </div>
      </div>
    </footer>
  );
}

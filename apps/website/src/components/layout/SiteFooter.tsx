import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useBrandSettings, resolveLogoUrl, BRAND_DEFAULTS } from '@/lib/hooks/use-brand-settings';

function FooterLogo() {
  const { data: settings } = useBrandSettings();
  const logoUrl = resolveLogoUrl(settings, 'light') ?? '/logo.png';
  const [imgFailed, setImgFailed] = useState(false);

  if (imgFailed) {
    return (
      <span className="font-display text-xl font-semibold text-brand-ivory">Studio Pranavi</span>
    );
  }

  return (
    <img
      src={logoUrl}
      alt="Studio Pranavi"
      className="h-16 w-auto max-w-[200px] object-contain brightness-0 invert"
      onError={() => setImgFailed(true)}
    />
  );
}

export function SiteFooter() {
  const { data: settings } = useBrandSettings();
  const tagline = settings?.business_tagline ?? BRAND_DEFAULTS.business_tagline;
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-brand-ivory/10 bg-brand-charcoal text-brand-ivory">
      <div className="sp-container py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <FooterLogo />
            {tagline && (
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-brand-ivory/50">{tagline}</p>
            )}
          </div>

          {/* Projects */}
          <div>
            <h3 className="sp-label-upper text-brand-ivory/40">Projects</h3>
            <ul className="mt-4 space-y-2.5">
              {[
                { to: '/projects?category=Residential', label: 'Residential' },
                { to: '/projects?category=Hospitality', label: 'Hospitality' },
                { to: '/projects?category=Commercial', label: 'Commercial' },
                { to: '/projects?category=Decorative+Lighting', label: 'Decorative Lighting' },
                { to: '/projects?category=Custom+Glass', label: 'Custom Glass' },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-brand-ivory/55 hover:text-brand-ivory transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Studio */}
          <div>
            <h3 className="sp-label-upper text-brand-ivory/40">Studio</h3>
            <ul className="mt-4 space-y-2.5">
              {[
                { to: '/studio/about', label: 'About' },
                { to: '/studio/craftsmanship', label: 'Craftsmanship' },
                { to: '/studio/materials', label: 'Materials' },
                { to: '/studio/process', label: 'Process' },
                { to: '/catalogue', label: 'Catalogue' },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-brand-ivory/55 hover:text-brand-ivory transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="sp-label-upper text-brand-ivory/40">Contact</h3>
            <ul className="mt-4 space-y-2.5">
              {[
                { to: '/contact', label: 'Get in Touch' },
                { to: '/start-a-project', label: 'Start a Project' },
                { to: '/collections', label: 'Collections' },
                { to: '/expertise', label: 'Expertise' },
                { to: '/privacy', label: 'Privacy Policy' },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-brand-ivory/55 hover:text-brand-ivory transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-brand-ivory/10 pt-8 sm:flex-row sm:items-center">
          <p className="text-xs text-brand-ivory/30">
            &copy; {year} Studio Pranavi. All rights reserved.
          </p>
          <p className="text-xs text-brand-ivory/20">Made in India.</p>
        </div>
      </div>
    </footer>
  );
}

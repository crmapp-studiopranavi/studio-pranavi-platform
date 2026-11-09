import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '@platform/ui';
import { cn } from '@/lib/utils';
import { useBrandSettings, resolveLogoUrl } from '@/lib/hooks/use-brand-settings';

const navLinks = [
  { to: '/projects', label: 'Projects' },
  { to: '/expertise', label: 'Expertise' },
  { to: '/studio/about', label: 'Studio' },
  { to: '/contact', label: 'Contact' },
];

function LogoMark({ className }: { className?: string }) {
  const { data: settings } = useBrandSettings();
  const logoUrl = resolveLogoUrl(settings, 'default') ?? '/logo.png';
  const [imgFailed, setImgFailed] = useState(false);

  if (imgFailed) {
    return (
      <span
        className={cn(
          'font-display text-xl font-semibold tracking-tight text-foreground',
          className
        )}
      >
        Studio Pranavi
      </span>
    );
  }

  return (
    <img
      src={logoUrl}
      alt="Studio Pranavi"
      className={cn('h-14 w-auto max-w-[180px] object-contain', className)}
      onError={() => setImgFailed(true)}
    />
  );
}

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" aria-label="Studio Pranavi — Home">
          <LogoMark />
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Main navigation" className="hidden items-center gap-7 md:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'text-sm font-medium tracking-wide transition-colors hover:text-brand-amber',
                  isActive ? 'text-brand-amber' : 'text-muted-foreground'
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 md:flex">
          <Button
            asChild
            size="sm"
            className="bg-brand-amber text-brand-charcoal hover:bg-brand-brass"
          >
            <Link to="/start-a-project">Start a Project</Link>
          </Button>
        </div>

        {/* Mobile menu button — 44×44 touch target */}
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground md:hidden"
          aria-controls="mobile-menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <span className="sr-only">{mobileOpen ? 'Close menu' : 'Open menu'}</span>
          {mobileOpen ? (
            <X className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Menu className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div id="mobile-menu" className="border-t border-border bg-background md:hidden">
          <nav className="flex flex-col gap-1 px-4 py-3" aria-label="Mobile navigation">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    'min-h-[44px] rounded-md px-3 py-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-brand-amber/10 text-brand-amber'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  )
                }
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
            <div className="mt-2 border-t border-border pt-2">
              <Button
                asChild
                className="mt-2 w-full bg-brand-amber text-brand-charcoal hover:bg-brand-brass"
              >
                <Link to="/start-a-project" onClick={() => setMobileOpen(false)}>
                  Start a Project
                </Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

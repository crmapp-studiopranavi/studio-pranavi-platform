import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Bell,
  MapPin,
  FileText,
  ShoppingBag,
  Briefcase,
  Ruler,
  Cog,
  Hammer,
  CheckSquare,
  Receipt,
  CreditCard,
  AlertCircle,
  FileStack,
  FolderOpen,
  Wrench,
  Image,
  BookOpen,
  Globe,
  BarChart2,
  UserCog,
  Settings,
  History,
  ChevronDown,
  ChevronRight,
  DatabaseZap,
  BellRing,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const SALES_ITEMS: NavItem[] = [
  { to: '/leads', label: 'Leads', icon: Users },
  { to: '/customers', label: 'Customers', icon: UserCheck },
  { to: '/follow-ups', label: 'Follow-ups', icon: Bell },
  { to: '/site-visits', label: 'Site Visits', icon: MapPin },
  { to: '/quotes', label: 'Quotations', icon: FileText },
];

const OPERATIONS_ITEMS: NavItem[] = [
  { to: '/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/projects', label: 'Projects', icon: Briefcase },
  { to: '/measurements', label: 'Measurements', icon: Ruler },
  { to: '/production', label: 'Production', icon: Cog },
  { to: '/installations', label: 'Installations', icon: Hammer },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare },
];

const FINANCE_ITEMS: NavItem[] = [
  { to: '/invoices', label: 'Invoices', icon: Receipt },
  { to: '/payments', label: 'Payments', icon: CreditCard },
  { to: '/outstanding', label: 'Outstanding', icon: AlertCircle },
];

const WEBSITE_ITEMS: NavItem[] = [
  { to: '/cms/pages', label: 'Pages', icon: FileStack },
  { to: '/cms/projects', label: 'Portfolio', icon: FolderOpen },
  { to: '/cms/services', label: 'Services', icon: Wrench },
  { to: '/cms/media', label: 'Media', icon: Image },
  { to: '/cms/catalogue', label: 'Catalogue', icon: BookOpen },
  { to: '/cms/branding', label: 'Branding', icon: Globe },
];

const ADMIN_ITEMS: NavItem[] = [
  { to: '/admin/users', label: 'Users', icon: UserCog },
  { to: '/admin/settings', label: 'Business Settings', icon: Settings },
  { to: '/admin/audit', label: 'Audit History', icon: History },
  { to: '/admin/data-management', label: 'Data Management', icon: DatabaseZap },
  { to: '/admin/automation', label: 'Automation', icon: Zap },
];

const PERSONAL_ITEMS: NavItem[] = [
  { to: '/notifications', label: 'Notifications', icon: BellRing },
];

function getStorageKey(label: string): string {
  return `sidebar_collapsed_${label.toLowerCase()}`;
}

function getInitialOpen(label: string, items: NavItem[], pathname: string): boolean {
  const stored = localStorage.getItem(getStorageKey(label));
  if (stored !== null) {
    // stored 'true' = collapsed, stored 'false' = expanded
    return stored !== 'true';
  }
  // No stored value: open if any item's path matches the current location
  return items.some((item) => pathname === item.to || pathname.startsWith(item.to + '/'));
}

const NAV_LINK_CLASS = (isActive: boolean) =>
  cn(
    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-primary/20 text-sidebar-foreground'
      : 'text-sidebar-foreground/60 hover:bg-sidebar-muted hover:text-sidebar-foreground'
  );

interface SidebarSectionProps {
  label: string;
  items: NavItem[];
  onNavClick?: () => void;
}

function SidebarSection({ label, items, onNavClick }: SidebarSectionProps) {
  const { pathname } = useLocation();
  const [isOpen, setIsOpen] = useState(() => getInitialOpen(label, items, pathname));

  useEffect(() => {
    const hasActive = items.some(
      (item) => pathname === item.to || pathname.startsWith(item.to + '/')
    );
    if (hasActive) setIsOpen(true);
  }, [pathname, items]);

  const toggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    // Store the collapsed state: collapsed === !open
    localStorage.setItem(getStorageKey(label), next ? 'false' : 'true');
  };

  return (
    <div className="mb-0.5">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between rounded px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted hover:text-sidebar-foreground/80 transition-colors"
      >
        <span>{label}</span>
        {isOpen ? (
          <ChevronDown className="h-3 w-3" aria-hidden="true" />
        ) : (
          <ChevronRight className="h-3 w-3" aria-hidden="true" />
        )}
      </button>
      {isOpen && (
        <ul className="space-y-0.5 pb-1" role="list">
          {items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) => NAV_LINK_CLASS(isActive)}
                onClick={onNavClick}
              >
                <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface SidebarProps {
  onNavClick?: () => void;
}

export function Sidebar({ onNavClick }: SidebarProps = {}) {
  const { profile } = useAuth();

  const isAdmin = profile?.role === 'admin';
  const canManageCms = profile?.role === 'admin' || profile?.role === 'manager';

  return (
    <aside className="flex h-full w-60 flex-col bg-sidebar">
      {/* Brand */}
      <div className="flex h-16 items-center border-b border-sidebar-border px-4">
        <span className="font-display text-base font-semibold text-sidebar-foreground">
          Studio Pranavi
        </span>
        <span className="ml-2 rounded bg-sidebar-muted px-1.5 py-0.5 text-[10px] font-medium text-sidebar-foreground/60">
          CRM
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {/* Dashboard — always visible, above all sections */}
        <div className="mb-2">
          <NavLink to="/" end className={({ isActive }) => NAV_LINK_CLASS(isActive)} onClick={onNavClick}>
            <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden="true" />
            Dashboard
          </NavLink>
        </div>

        {/* Grouped sections */}
        <SidebarSection label="Sales" items={SALES_ITEMS} onNavClick={onNavClick} />
        <SidebarSection label="Operations" items={OPERATIONS_ITEMS} onNavClick={onNavClick} />
        <SidebarSection label="Finance" items={FINANCE_ITEMS} onNavClick={onNavClick} />

        {/* My Activity — visible to all staff */}
        <div className="my-1.5 border-t border-sidebar-border/50" />
        <SidebarSection label="My Activity" items={PERSONAL_ITEMS} onNavClick={onNavClick} />

        {/* Reports — between Finance and Website/Admin */}
        <div className="my-1.5 border-t border-sidebar-border/50" />
        <div className="mb-1.5">
          <NavLink to="/reports" className={({ isActive }) => NAV_LINK_CLASS(isActive)} onClick={onNavClick}>
            <BarChart2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            Reports
          </NavLink>
        </div>

        {/* Website — admin and manager only */}
        {canManageCms && (
          <>
            <div className="my-1.5 border-t border-sidebar-border/50" />
            <SidebarSection label="Website" items={WEBSITE_ITEMS} onNavClick={onNavClick} />
          </>
        )}

        {/* Administration — admin only */}
        {isAdmin && <SidebarSection label="Administration" items={ADMIN_ITEMS} onNavClick={onNavClick} />}
      </nav>

      {/* User info */}
      {profile && (
        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-sidebar-foreground">
              {profile.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-sidebar-foreground">
                {profile.full_name}
              </p>
              <p className="text-[10px] capitalize text-sidebar-muted">{profile.role}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

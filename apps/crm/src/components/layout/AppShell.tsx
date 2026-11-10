import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { AppHeader } from './AppHeader';
import { Breadcrumbs } from './Breadcrumbs';
import { GlobalSearch } from '../search/GlobalSearch';
import { useOutboxWorker } from '@/lib/hooks/useOutboxWorker';

export function AppShell() {
  useOutboxWorker();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden md:flex md:shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar drawer */}
      {mobileSidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
            aria-hidden="true"
          />
          {/* Drawer */}
          <div className="fixed inset-y-0 left-0 z-50 md:hidden">
            <Sidebar onNavClick={() => setMobileSidebarOpen(false)} />
          </div>
        </>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader onMenuClick={() => setMobileSidebarOpen((o) => !o)} />
        <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6">
          <Breadcrumbs />
          <Outlet />
        </main>
      </div>
      <GlobalSearch />
    </div>
  );
}

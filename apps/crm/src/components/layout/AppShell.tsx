import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { AppHeader } from './AppHeader';
import { Breadcrumbs } from './Breadcrumbs';
import { GlobalSearch } from '../search/GlobalSearch';
import { useOutboxWorker } from '@/lib/hooks/useOutboxWorker';

export function AppShell() {
  useOutboxWorker();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar — hidden on mobile, visible md+ */}
      <div className="hidden md:flex md:shrink-0">
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto bg-background p-6">
          <Breadcrumbs />
          <Outlet />
        </main>
      </div>
      <GlobalSearch />
    </div>
  );
}

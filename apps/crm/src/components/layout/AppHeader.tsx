import { LogOut } from 'lucide-react';
import { Button } from '@platform/ui';
import { useAuth } from '@/lib/auth-context';
import { NotificationBell } from './NotificationBell';

export function AppHeader() {
  const { signOut, isLoading } = useAuth();

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex items-center gap-2">
        {/* Breadcrumb / page title injected by child routes */}
      </div>
      <div className="flex items-center gap-3">
        <NotificationBell />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut()}
          disabled={isLoading}
          className="gap-2"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Sign out</span>
        </Button>
      </div>
    </header>
  );
}

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

/**
 * Wraps any route that requires authentication.
 * - Redirects unauthenticated users to /login with a return path.
 * - Rejects inactive users (second check after the auth-context check).
 * - Optionally restricts to specific roles.
 */
export function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { user, profile, isInitialized } = useAuth();
  const location = useLocation();

  // Wait for the initial session restore before redirecting
  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div
          className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"
          role="status"
          aria-label="Loading"
        />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!profile || !profile.is_active) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-lg font-semibold text-destructive">Account inactive</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Your account has been deactivated. Contact your administrator to regain access.
        </p>
      </div>
    );
  }

  if (requiredRoles && requiredRoles.length > 0) {
    if (!requiredRoles.includes(profile.role)) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
          <p className="text-lg font-semibold text-destructive">Access denied</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            You do not have permission to access this page.
          </p>
        </div>
      );
    }
  }

  return <>{children}</>;
}

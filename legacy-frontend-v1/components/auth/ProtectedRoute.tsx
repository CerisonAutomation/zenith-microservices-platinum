/**
 * 🔐 Protected Route Component
 * Zenith Oracle Executive Apex - Authentication Guards
 *
 * Features:
 * - Route protection based on authentication status
 * - Role-based access control (RBAC)
 * - Redirect handling for unauthenticated users
 * - Loading states during auth verification
 * - Customizable redirect paths
 *
 * @see https://supabase.com/docs/guides/auth/auth-helpers
 */

import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
  allowedRoles?: string[];
  fallback?: ReactNode;
}

export function ProtectedRoute({
  children,
  requireAuth = true,
  redirectTo,
  allowedRoles,
  fallback,
}: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-500" />
          <p className="text-muted-foreground">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Check authentication requirement
  if (requireAuth && !isAuthenticated) {
    // Redirect to sign in with return URL
    const signInUrl = redirectTo || '/auth/signin';
    const returnUrl = `${location.pathname}${location.search}`;
    return <Navigate to={`${signInUrl}?returnUrl=${encodeURIComponent(returnUrl)}`} replace />;
  }

  // Check role-based access
  if (allowedRoles && user) {
    const userRole = user.user_metadata?.['role'] || user.app_metadata?.['role'] || 'user';
    if (!allowedRoles.includes(userRole)) {
      // User doesn't have required role
      if (fallback) {
        return <>{fallback}</>;
      }
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
            <p className="text-muted-foreground mb-6">
              You don't have permission to access this page. Please contact support if you believe this is an error.
            </p>
            <Navigate to="/" replace />
          </div>
        </div>
      );
    }
  }

  // If authentication is not required but user is authenticated, allow access
  // If authentication is required and user is authenticated, allow access
  return <>{children}</>;
}

/**
 * Higher-order component for protecting entire components
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<ProtectedRouteProps, 'children'> = {}
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

/**
 * Hook for checking authentication status in components
 */
export function useAuthGuard(requireAuth = true) {
  const { user, session, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading && requireAuth && !isAuthenticated) {
      // Could trigger redirect or show modal here
      console.warn('Authentication required for this component');
    }
  }, [loading, requireAuth, isAuthenticated]);

  return {
    user,
    session,
    loading,
    isAuthenticated,
    hasAccess: !requireAuth || isAuthenticated,
  };
}
/**
 * 🔐 Auth Layout Component
 * Zenith Oracle Executive Apex - Authentication Page Layout
 *
 * Features:
 * - Consistent layout for all auth pages
 * - Responsive design with mobile optimization
 * - Gradient backgrounds and branding
 * - Accessibility features
 * - Loading states and transitions
 *
 * @see https://supabase.com/docs/guides/auth/auth-helpers
 */

import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 transition-colors">
            <Heart className="h-8 w-8 fill-current" />
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              DatingApp
            </span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex items-center justify-center min-h-screen px-4 pt-20 pb-8">
        <div className="w-full max-w-md">
          {/* Page Title */}
          {(title || subtitle) && (
            <div className="text-center mb-8">
              {title && (
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-lg text-muted-foreground">
                  {subtitle}
                </p>
              )}
            </div>
          )}

          {/* Auth Content */}
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 p-6">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 DatingApp. All rights reserved.{' '}
            <Link to="/privacy" className="text-purple-600 hover:text-purple-500 underline">
              Privacy Policy
            </Link>
            {' • '}
            <Link to="/terms" className="text-purple-600 hover:text-purple-500 underline">
              Terms of Service
            </Link>
          </p>
        </div>
      </footer>

      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-4000"></div>
      </div>
    </div>
  );
}

/**
 * Simplified auth page wrapper
 */
export function AuthPage({ children, title, subtitle }: AuthLayoutProps) {
  const layoutProps: { children: ReactNode; title?: string; subtitle?: string } = { children };
  if (title !== undefined) layoutProps.title = title;
  if (subtitle !== undefined) layoutProps.subtitle = subtitle;

  return (
    <AuthLayout {...layoutProps}>
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
        {children}
      </div>
    </AuthLayout>
  );
}
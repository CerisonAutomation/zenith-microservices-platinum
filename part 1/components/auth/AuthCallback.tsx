/**
 * 🔐 Auth Callback Handler
 * Zenith Oracle Executive Apex - OAuth & Email Verification
 *
 * Handles:
 * - OAuth provider redirects with PKCE verification
 * - Email verification callbacks
 * - Password reset redirects
 * - Session restoration after redirects
 *
 * @see https://supabase.com/docs/guides/auth/auth-callbacks
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { ErrorTracker, UserAnalytics } from '@/lib/observability';

type CallbackState = 'loading' | 'success' | 'error' | 'email-verification';

export default function AuthCallback() {
  const [state, setState] = useState<CallbackState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Handle the auth callback
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          ErrorTracker.trackError(error, { context: 'auth_callback' });
          throw error;
        }

        // Check for specific callback types
        const errorParam = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        const type = searchParams.get('type');

        if (errorParam) {
          setState('error');
          setError(errorDescription || errorParam);
          UserAnalytics.trackEvent('auth_callback_error', {
            error: errorParam,
            description: errorDescription,
          });
          return;
        }

        // Handle email verification
        if (type === 'signup' || type === 'email_confirmation') {
          setState('email-verification');
          UserAnalytics.trackEvent('email_verified', {
            userId: data.session?.user?.id,
          });
          return;
        }

        // Handle password reset
        if (type === 'recovery') {
          UserAnalytics.trackEvent('password_reset_callback', {
            userId: data.session?.user?.id,
          });
          // Redirect to password reset page
          navigate('/auth/reset-password', { replace: true });
          return;
        }

        // Successful OAuth callback
        if (data.session) {
          setState('success');
          UserAnalytics.trackEvent('oauth_callback_success', {
            userId: data.session.user.id,
            provider: data.session.user.app_metadata?.provider,
          });

          // Redirect to main app after short delay
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 2000);
        } else {
          // No session found
          setState('error');
          setError('No authentication session found');
        }

      } catch (err) {
        console.error('Auth callback error:', err);
        setState('error');
        setError(err instanceof Error ? err.message : 'Authentication failed');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  const getStateContent = () => {
    switch (state) {
      case 'loading':
        return {
          icon: <Loader2 className="h-8 w-8 animate-spin text-blue-500" />,
          title: 'Processing Authentication',
          description: 'Please wait while we complete your sign in...',
        };

      case 'success':
        return {
          icon: <CheckCircle className="h-8 w-8 text-green-500" />,
          title: 'Authentication Successful!',
          description: 'You have been successfully signed in. Redirecting you now...',
        };

      case 'email-verification':
        return {
          icon: <CheckCircle className="h-8 w-8 text-green-500" />,
          title: 'Email Verified!',
          description: 'Your email has been successfully verified. You can now sign in.',
        };

      case 'error':
        return {
          icon: <XCircle className="h-8 w-8 text-red-500" />,
          title: 'Authentication Failed',
          description: error || 'An error occurred during authentication.',
        };

      default:
        return {
          icon: <AlertCircle className="h-8 w-8 text-yellow-500" />,
          title: 'Unknown State',
          description: 'An unexpected error occurred.',
        };
    }
  };

  const { icon, title, description } = getStateContent();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {icon}
          </div>
          <CardTitle className="text-2xl font-bold">{title}</CardTitle>
          <CardDescription className="text-lg">{description}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {state === 'email-verification' && (
            <Button
              onClick={() => navigate('/auth/signin')}
              className="w-full"
            >
              Continue to Sign In
            </Button>
          )}

          {state === 'error' && (
            <div className="space-y-2">
              <Button
                onClick={() => navigate('/auth/signin')}
                variant="outline"
                className="w-full"
              >
                Try Again
              </Button>
              <Button
                onClick={() => navigate('/')}
                variant="ghost"
                className="w-full"
              >
                Go Home
              </Button>
            </div>
          )}

          {state === 'success' && (
            <div className="text-center text-sm text-muted-foreground">
              If you're not redirected automatically, click the button below.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
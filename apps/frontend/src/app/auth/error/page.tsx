'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

/**
 * Auth Error Page
 *
 * Displays authentication errors to the user in a friendly format
 */
export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || 'Unknown error';
  const description = searchParams.get('description') || 'An error occurred during authentication';

  const errorMessages: Record<string, string> = {
    'access_denied': 'Access was denied. You may have cancelled the authentication process.',
    'server_error': 'A server error occurred. Please try again later.',
    'temporarily_unavailable': 'The authentication service is temporarily unavailable. Please try again later.',
    'unauthorized_client': 'This application is not authorized to perform this action.',
    'config': 'Authentication is not properly configured. Please contact support.',
  };

  const friendlyMessage = errorMessages[error] || description;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="w-16 h-16 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Authentication Error
          </h1>
          <p className="text-neutral-400">
            We encountered an issue while trying to sign you in
          </p>
        </div>

        <Alert variant="destructive" className="border-red-500/50 bg-red-500/10">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Code: {error}</AlertTitle>
          <AlertDescription className="mt-2">
            {friendlyMessage}
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <Button asChild className="w-full" variant="default">
            <Link href="/auth/login">
              Try Again
            </Link>
          </Button>
          <Button asChild className="w-full" variant="outline">
            <Link href="/">
              Go to Home
            </Link>
          </Button>
        </div>

        <div className="text-center text-sm text-neutral-500">
          <p>Need help?{' '}
            <Link href="/support" className="text-primary hover:underline">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

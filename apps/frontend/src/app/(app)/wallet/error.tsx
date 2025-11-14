'use client';

import { useEffect } from 'react';
import { Button } from '@zenith/ui-components';
import { Wallet, AlertCircle } from 'lucide-react';

export default function WalletError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Wallet error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-md">
        <div className="relative">
          <Wallet className="w-16 h-16 text-muted mx-auto" />
          <AlertCircle className="w-6 h-6 text-destructive absolute top-0 right-1/3" />
        </div>
        <h2 className="text-2xl font-bold">Payment Error</h2>
        <p className="text-muted-foreground">
          Failed to load wallet. Please try again.
        </p>
        <Button onClick={reset} className="mt-4">
          Try again
        </Button>
      </div>
    </div>
  );
}

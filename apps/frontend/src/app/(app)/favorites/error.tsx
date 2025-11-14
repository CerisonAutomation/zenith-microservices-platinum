'use client';

import { useEffect } from 'react';
import { Button } from '@zenith/ui-components';
import { Heart, AlertCircle } from 'lucide-react';

export default function FavoritesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Favorites error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-md">
        <div className="relative">
          <Heart className="w-16 h-16 text-muted mx-auto" />
          <AlertCircle className="w-6 h-6 text-destructive absolute top-0 right-1/3" />
        </div>
        <h2 className="text-2xl font-bold">Couldn't load favorites</h2>
        <p className="text-muted-foreground">
          There was an error loading your favorite profiles.
        </p>
        <Button onClick={reset} className="mt-4">
          Try again
        </Button>
      </div>
    </div>
  );
}

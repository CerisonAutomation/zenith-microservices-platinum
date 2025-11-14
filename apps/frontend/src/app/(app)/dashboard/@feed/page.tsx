import { Suspense } from 'react';
import ExploreTab from '@/components/tabs/ExploreTab';

export default function FeedPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Discover</h1>
        <p className="text-muted-foreground">Find your perfect match</p>
      </div>

      <Suspense fallback={<FeedSkeleton />}>
        <ExploreTab />
      </Suspense>
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-96 bg-muted animate-pulse rounded-lg" />
      ))}
    </div>
  );
}

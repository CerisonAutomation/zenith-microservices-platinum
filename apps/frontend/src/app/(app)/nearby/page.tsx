import { Suspense } from 'react';
import LiveLocationMap from '@/components/location/LiveLocationMap';

export default function NearbyPage() {
  return (
    <div className="container max-w-2xl mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">🗺️ Nearby Users</h1>
        <p className="text-muted-foreground">
          Discover people around you in real-time
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        }
      >
        <LiveLocationMap
          radiusKm={10}
          showUserList={true}
          enableTracking={true}
        />
      </Suspense>
    </div>
  );
}

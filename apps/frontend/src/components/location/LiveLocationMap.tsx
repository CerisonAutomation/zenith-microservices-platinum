import { useState, useEffect } from 'react';
import { MapPin, Users, Navigation, Settings } from 'lucide-react';
import { Card, Button, Badge } from '@zenith/ui-components';
import { useRealtimeLocation } from '@/hooks/useRealtimeLocation';
import { useNearbyUsers } from '@/hooks/useNearbyUsers';
import { motion } from 'framer-motion';

interface LiveLocationMapProps {
  radiusKm?: number;
  showUserList?: boolean;
  enableTracking?: boolean;
}

export function LiveLocationMap({
  radiusKm = 10,
  showUserList = true,
  enableTracking = true
}: LiveLocationMapProps) {
  const [radius, setRadius] = useState(radiusKm);
  const [trackingEnabled, setTrackingEnabled] = useState(enableTracking);

  // Track user's live location
  const {
    position,
    error: locationError,
    loading: locationLoading,
    permissionStatus
  } = useRealtimeLocation({
    enableHighAccuracy: true,
    updateInterval: 30000 // Update every 30 seconds
  });

  // Get nearby users in real-time
  const {
    users: nearbyUsers,
    loading: usersLoading,
    refresh
  } = useNearbyUsers({
    radiusKm: radius,
    maxResults: 50,
    refreshInterval: 30000,
    includeProfiles: true
  });

  // Request location permission on mount
  useEffect(() => {
    if (permissionStatus === 'prompt') {
      // Permission will be requested automatically by useRealtimeLocation
    }
  }, [permissionStatus]);

  // Handle permission denied
  if (permissionStatus === 'denied') {
    return (
      <Card className="p-6 text-center">
        <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Location Access Denied</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Please enable location permissions in your browser settings to see nearby users.
        </p>
        <Button onClick={() => window.location.reload()}>
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Location Status Card */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Navigation className="h-6 w-6 text-primary" />
              {trackingEnabled && (
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse" />
              )}
            </div>
            <div>
              <h3 className="font-semibold">Live Location</h3>
              <p className="text-sm text-muted-foreground">
                {locationLoading
                  ? 'Getting your location...'
                  : position
                  ? `Accuracy: ${position.accuracy.toFixed(0)}m`
                  : 'Location unavailable'}
              </p>
            </div>
          </div>

          <Button
            variant={trackingEnabled ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTrackingEnabled(!trackingEnabled)}
          >
            {trackingEnabled ? 'Tracking On' : 'Tracking Off'}
          </Button>
        </div>

        {position && (
          <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
            📍 Lat: {position.latitude.toFixed(6)}, Lng: {position.longitude.toFixed(6)}
            {position.speed && (
              <span className="ml-3">🚀 Speed: {(position.speed * 3.6).toFixed(1)} km/h</span>
            )}
          </div>
        )}

        {locationError && (
          <div className="mt-3 p-2 bg-destructive/10 text-destructive text-sm rounded">
            ⚠️ {locationError}
          </div>
        )}
      </Card>

      {/* Nearby Users Card */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">
              Nearby Users
              <Badge variant="secondary" className="ml-2">
                {nearbyUsers.length}
              </Badge>
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="text-sm border rounded px-2 py-1"
            >
              <option value={1}>1 km</option>
              <option value={5}>5 km</option>
              <option value={10}>10 km</option>
              <option value={25}>25 km</option>
              <option value={50}>50 km</option>
            </select>

            <Button variant="ghost" size="sm" onClick={refresh}>
              ↻
            </Button>
          </div>
        </div>

        {usersLoading ? (
          <div className="py-8 text-center text-muted-foreground">
            Loading nearby users...
          </div>
        ) : nearbyUsers.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No users found within {radius}km</p>
            <p className="text-xs mt-1">Try increasing the search radius</p>
          </div>
        ) : showUserList ? (
          <div className="space-y-2">
            {nearbyUsers.map((user, index) => (
              <motion.div
                key={user.user_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                    {user.profile?.name?.[0] || '?'}
                  </div>
                  {user.is_online && (
                    <span className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-background" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">
                      {user.profile?.name || 'Anonymous'}
                    </p>
                    {user.profile?.age && (
                      <Badge variant="outline" className="text-xs">
                        {user.profile.age}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    📍 {user.distance_km < 1
                      ? `${(user.distance_km * 1000).toFixed(0)}m away`
                      : `${user.distance_km.toFixed(1)}km away`}
                  </p>
                </div>

                <Button size="sm" variant="outline">
                  View
                </Button>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">
                {nearbyUsers.filter(u => u.is_online).length}
              </div>
              <div className="text-sm text-muted-foreground">Online</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {nearbyUsers.length}
              </div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
          </div>
        )}
      </Card>

      {/* Privacy Settings Hint */}
      <Card className="p-3 bg-muted/50">
        <div className="flex items-start gap-2 text-sm">
          <Settings className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
          <div className="text-muted-foreground">
            <strong>Privacy:</strong> Your location is only visible to matched users.
            You can change this in Settings → Privacy.
          </div>
        </div>
      </Card>
    </div>
  );
}

export default LiveLocationMap;

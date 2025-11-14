import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/utils/supabase/client';

interface LocationPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number | null;
  heading: number | null;
  timestamp: number;
}

interface UseRealtimeLocationOptions {
  enableHighAccuracy?: boolean;
  maximumAge?: number;
  timeout?: number;
  updateInterval?: number;
}

export function useRealtimeLocation(options: UseRealtimeLocationOptions = {}) {
  const {
    enableHighAccuracy = true,
    maximumAge = 10000,
    timeout = 5000,
    updateInterval = 30000 // Update every 30 seconds by default
  } = options;

  const [position, setPosition] = useState<LocationPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const hasPositionRef = useRef(false);

  // Update location in database
  const updateLocationInDB = useCallback(async (pos: GeolocationPosition) => {
    try {
      const { error } = await supabase.rpc('update_user_location', {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        speed: pos.coords.speed,
        heading: pos.coords.heading
      });

      if (error) {
        console.error('Failed to update location in database:', error);
      }
    } catch (err) {
      console.error('Error updating location:', err);
    }
  }, []);

  // Handle position update
  const handlePosition = useCallback((pos: GeolocationPosition) => {
    const locationData: LocationPosition = {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      speed: pos.coords.speed,
      heading: pos.coords.heading,
      timestamp: pos.timestamp
    };

    hasPositionRef.current = true;
    setPosition(locationData);
    setLoading(false);
    setError(null);
    updateLocationInDB(pos);
  }, [updateLocationInDB]);

  // Handle error
  const handleError = useCallback((err: GeolocationPositionError) => {
    setLoading(false);

    switch (err.code) {
      case err.PERMISSION_DENIED:
        setError('Location permission denied. Please enable location access in your browser settings.');
        setPermissionStatus('denied');
        break;
      case err.POSITION_UNAVAILABLE:
        setError('Location information is unavailable. Please check your GPS settings.');
        break;
      case err.TIMEOUT:
        setError('Location request timed out. Please try again.');
        break;
      default:
        setError('An unknown error occurred while getting your location.');
    }
  }, []);

  // Request location permission
  const requestPermission = useCallback(async () => {
    try {
      if ('permissions' in navigator) {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        setPermissionStatus(result.state as 'granted' | 'denied' | 'prompt');

        // Store the handler so we can remove it later
        const handlePermissionChange = () => {
          setPermissionStatus(result.state as 'granted' | 'denied' | 'prompt');
        };

        result.addEventListener('change', handlePermissionChange);

        // Return cleanup function
        return () => {
          result.removeEventListener('change', handlePermissionChange);
        };
      }
    } catch (err) {
      console.error('Failed to query location permission:', err);
    }
    return undefined;
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }

    // Request permission and store cleanup function
    const permissionCleanup = requestPermission();

    // Get initial position
    navigator.geolocation.getCurrentPosition(handlePosition, handleError, {
      enableHighAccuracy,
      maximumAge,
      timeout
    });

    // Watch position for continuous updates
    const watchId = navigator.geolocation.watchPosition(
      handlePosition,
      handleError,
      {
        enableHighAccuracy,
        maximumAge,
        timeout
      }
    );

    // Set up periodic database updates (less frequent than watch for efficiency)
    // Use a ref to track latest position to avoid dependency on position state
    const intervalId = setInterval(() => {
      if (hasPositionRef.current) {
        navigator.geolocation.getCurrentPosition(handlePosition, handleError, {
          enableHighAccuracy,
          maximumAge: 0, // Force fresh position
          timeout
        });
      }
    }, updateInterval);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      clearInterval(intervalId);
      // Clean up permission listener
      if (permissionCleanup) {
        permissionCleanup.then(cleanup => cleanup?.());
      }
    };
  }, [enableHighAccuracy, maximumAge, timeout, updateInterval, handlePosition, handleError, requestPermission]);

  return {
    position,
    error,
    loading,
    permissionStatus,
    requestPermission
  };
}

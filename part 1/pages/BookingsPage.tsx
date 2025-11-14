/**
 * 📅 Bookings Page - Manage Dates & Meetings
 */

import { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Calendar, Clock, MapPin, Check, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { mockBookings } from '@/lib/mockData';
import { useAuth } from '../contexts/AuthContext';
import type { Booking } from '@/types';
import { format } from 'date-fns';

export default function BookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBookings();
  }, [user]);

  const loadBookings = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await (supabase as any)
        .from('bookings')
        .select(`
          *,
          profile:profiles!bookings_profile_id_fkey(*)
        `)
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (queryError) {
        console.warn('Bookings not found in database, using mock data:', queryError);
        setBookings(mockBookings);
        setLoading(false);
        return;
      }

      // Map database fields to Booking type
      const bookingsData: Booking[] = (data || []).map((booking: any) => ({
        id: booking.id,
        user_id: booking.user_id,
        profile_id: booking.profile_id,
        profile: booking.profile ? {
          id: booking.profile.id,
          user_id: booking.profile.user_id,
          name: booking.profile.name,
          age: booking.profile.age,
          photo: booking.profile.photo,
          bio: booking.profile.bio,
          location: booking.profile.location,
          interests: booking.profile.interests,
          verified: booking.profile.verified,
          premium: booking.profile.premium,
        } : undefined,
        date: booking.date,
        time: booking.time,
        location: booking.location,
        status: booking.status,
        notes: booking.notes,
        created_at: booking.created_at,
        updated_at: booking.updated_at,
      }));

      setBookings(bookingsData);
    } catch (err) {
      console.error('Error loading bookings:', err);
      setError('Failed to load bookings');
      // Fallback to mock data on error
      setBookings(mockBookings);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      case 'completed':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleConfirmBooking = async (bookingId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('bookings')
        .update({
          status: 'confirmed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

      if (error) throw error;

      // Update local state
      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === bookingId ? { ...booking, status: 'confirmed' as const } : booking
        )
      );
    } catch (err) {
      console.error('Error confirming booking:', err);
      setError('Failed to confirm booking');
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('bookings')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

      if (error) throw error;

      // Update local state
      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === bookingId ? { ...booking, status: 'cancelled' as const } : booking
        )
      );
    } catch (err) {
      console.error('Error cancelling booking:', err);
      setError('Failed to cancel booking');
    }
  };

  return (
    <MainLayout>
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Your Bookings</h1>
          <p className="text-white/60">Manage your upcoming and past dates</p>
        </div>

        {error && (
          <Card className="mb-4 border-red-500 bg-red-500/10">
            <CardContent className="p-4">
              <p className="text-red-500 text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-400 rounded-full animate-spin mb-4"></div>
              <p className="text-lg font-medium text-center">Loading bookings...</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookings.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-center mb-2">No bookings yet</p>
                <p className="text-sm text-muted-foreground text-center">
                  Start exploring profiles to book your first date
                </p>
              </CardContent>
            </Card>
            ) : (
              bookings.map((booking) => (
              <Card key={booking.id}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Profile Image */}
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={booking.profile?.photo} />
                      <AvatarFallback>
                        {booking.profile?.name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>

                    {/* Booking Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-semibold">
                            {booking.profile?.name}
                          </h3>
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{format(booking.date, 'EEEE, MMMM d, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{booking.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>
                            {typeof booking.location === 'string'
                              ? booking.location
                              : booking.location.name}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      {booking.status === 'pending' && (
                        <div className="flex gap-2 mt-4">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleConfirmBooking(booking.id)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleCancelBooking(booking.id)}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      )}

                      {booking.status === 'confirmed' && (
                        <div className="flex gap-2 mt-4">
                          <Button size="sm" variant="outline">
                            Reschedule
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleCancelBooking(booking.id)}
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              ))
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

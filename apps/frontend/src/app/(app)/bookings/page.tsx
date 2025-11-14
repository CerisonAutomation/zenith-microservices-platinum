/**
 * 📅 Bookings Page - Schedule Dates
 * Next.js 14 App Router page
 */

'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, MapPin, User, Video, Check, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/utils/supabase/client'

interface Booking {
  id: string
  date: string
  time: string
  location?: string
  type: 'in-person' | 'video'
  status: 'pending' | 'confirmed' | 'cancelled'
  with_user: {
    name: string
    avatar_url?: string
  }
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          with_user:profiles!bookings_partner_id_fkey(name, avatar_url)
        `)
        .or(`user_id.eq.${user.id},partner_id.eq.${user.id}`)
        .order('booking_date', { ascending: true })

      if (!error && data) {
        const formattedBookings = data.map(b => ({
          id: b.id,
          date: new Date(b.booking_date).toLocaleDateString(),
          time: new Date(b.booking_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          location: b.location,
          type: b.booking_type,
          status: b.status,
          with_user: b.with_user || { name: 'Unknown', avatar_url: null }
        }))
        setBookings(formattedBookings)
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const upcomingBookings = bookings.filter(b => b.status === 'confirmed')
  const pendingBookings = bookings.filter(b => b.status === 'pending')
  const pastBookings = bookings.filter(b => b.status === 'cancelled')

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-amber-900/20 to-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-amber-50">Bookings</h1>
          <p className="text-amber-200/80 mt-2">Manage your date schedules</p>
        </div>

        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800/50">
            <TabsTrigger value="upcoming">
              Upcoming ({upcomingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({pendingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past ({pastBookings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4 mt-6">
            {upcomingBookings.length === 0 ? (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="pt-6 text-center text-gray-400">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No upcoming bookings</p>
                </CardContent>
              </Card>
            ) : (
              upcomingBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} showActions />
              ))
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4 mt-6">
            {pendingBookings.length === 0 ? (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="pt-6 text-center text-gray-400">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No pending bookings</p>
                </CardContent>
              </Card>
            ) : (
              pendingBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} showActions />
              ))
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4 mt-6">
            {pastBookings.length === 0 ? (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="pt-6 text-center text-gray-400">
                  <p>No past bookings</p>
                </CardContent>
              </Card>
            ) : (
              pastBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function BookingCard({ booking, showActions = false }: { booking: Booking; showActions?: boolean }) {
  return (
    <Card className="bg-gray-800/50 border-gray-700 hover:border-amber-500/50 transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white font-semibold">
              {booking.with_user.name[0]}
            </div>
            <div>
              <CardTitle className="text-lg text-amber-50">{booking.with_user.name}</CardTitle>
              <CardDescription className="text-amber-200/60">
                {booking.date} at {booking.time}
              </CardDescription>
            </div>
          </div>
          <Badge
            variant={booking.status === 'confirmed' ? 'default' : 'secondary'}
            className={booking.status === 'confirmed' ? 'bg-green-600' : ''}
          >
            {booking.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-amber-100/80">
          {booking.type === 'video' ? (
            <>
              <Video className="w-4 h-4" />
              <span>Video Date</span>
            </>
          ) : (
            <>
              <MapPin className="w-4 h-4" />
              <span>{booking.location || 'Location TBD'}</span>
            </>
          )}
        </div>

        {showActions && booking.status === 'pending' && (
          <div className="flex gap-2 pt-2">
            <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700">
              <Check className="w-4 h-4 mr-2" />
              Confirm
            </Button>
            <Button size="sm" variant="outline" className="flex-1 border-red-500 text-red-400 hover:bg-red-500/10">
              <X className="w-4 h-4 mr-2" />
              Decline
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

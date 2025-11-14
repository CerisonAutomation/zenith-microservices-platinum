/**
 * 📅 FULL BOOKING PAGE
 * This page loads when:
 * 1. Direct navigation to /bookings/create
 * 2. Page refresh on /bookings/create
 * 3. Intercepting route not matched
 */

'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, Video, Clock, DollarSign, ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function CreateBookingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const boyfriendId = searchParams.get('with')

  const [bookingType, setBookingType] = useState<'video' | 'in-person'>('in-person')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSubmit = async () => {
    if (!boyfriendId || !selectedDate || !selectedTime) {
      alert('Please fill all required fields')
      return
    }

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const bookingDateTime = new Date(`${selectedDate}T${selectedTime}`)

      const { error } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          partner_id: boyfriendId,
          booking_date: bookingDateTime.toISOString(),
          booking_type: bookingType,
          location: bookingType === 'in-person' ? location : null,
          status: 'pending',
        })

      if (error) throw error

      alert('Booking request sent! Waiting for confirmation.')
      router.push('/bookings')
    } catch (error) {
      console.error('Booking error:', error)
      alert('Failed to create booking. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-amber-900/20 to-gray-900 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Booking Form Card */}
        <div className="bg-gray-800/50 border border-amber-500/30 rounded-xl p-8">
          <h1 className="text-3xl font-bold text-amber-50 mb-2">Book a Date</h1>
          <p className="text-amber-200/70 mb-8">
            Fill out the details below to request a booking
          </p>

          <div className="space-y-6">
            {/* Booking Type */}
            <div>
              <label className="text-sm font-medium text-amber-200 mb-3 block">
                Date Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={bookingType === 'in-person' ? 'default' : 'outline'}
                  onClick={() => setBookingType('in-person')}
                  className={`py-6 ${bookingType === 'in-person' ? 'bg-amber-600' : ''}`}
                >
                  <MapPin className="w-5 h-5 mr-2" />
                  In Person
                </Button>
                <Button
                  type="button"
                  variant={bookingType === 'video' ? 'default' : 'outline'}
                  onClick={() => setBookingType('video')}
                  className={`py-6 ${bookingType === 'video' ? 'bg-amber-600' : ''}`}
                >
                  <Video className="w-5 h-5 mr-2" />
                  Video Call
                </Button>
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="text-sm font-medium text-amber-200 mb-3 block">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-amber-50 focus:border-amber-500 focus:outline-none text-lg"
              />
            </div>

            {/* Time */}
            <div>
              <label className="text-sm font-medium text-amber-200 mb-3 block">
                <Clock className="w-4 h-4 inline mr-1" />
                Time
              </label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-amber-50 focus:border-amber-500 focus:outline-none text-lg"
              />
            </div>

            {/* Location (only for in-person) */}
            {bookingType === 'in-person' && (
              <div>
                <label className="text-sm font-medium text-amber-200 mb-3 block">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Enter meeting location"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-amber-50 placeholder:text-gray-500 focus:border-amber-500 focus:outline-none text-lg"
                />
              </div>
            )}

            {/* Pricing Info */}
            <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-amber-200 mb-1">
                <DollarSign className="w-5 h-5" />
                <span className="text-lg font-semibold">
                  {bookingType === 'video' ? '$25/hour' : '$50/hour'}
                </span>
              </div>
              <p className="text-sm text-amber-200/60">
                Payment will be processed after confirmation
              </p>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1 py-6 text-lg"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                className="flex-1 bg-amber-600 hover:bg-amber-700 py-6 text-lg"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Request'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

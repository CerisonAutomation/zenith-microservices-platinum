/**
 * 🎯 INTERCEPTING ROUTE - Create Booking Modal
 * When user clicks "Book Date", show modal instead of navigating
 * URL updates but content stays on current page with overlay
 */

'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, Video, Clock, DollarSign } from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function CreateBookingModal() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const boyfriendId = searchParams.get('with')

  const [bookingType, setBookingType] = useState<'video' | 'in-person'>('in-person')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleClose = () => {
    router.back()
  }

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
      handleClose()
    } catch (error) {
      console.error('Booking error:', error)
      alert('Failed to create booking. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-gray-900 border-amber-500/30">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-amber-50">
            Book a Date
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Booking Type */}
          <div>
            <label className="text-sm font-medium text-amber-200 mb-2 block">
              Date Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={bookingType === 'in-person' ? 'default' : 'outline'}
                onClick={() => setBookingType('in-person')}
                className={bookingType === 'in-person' ? 'bg-amber-600' : ''}
              >
                <MapPin className="w-4 h-4 mr-2" />
                In Person
              </Button>
              <Button
                variant={bookingType === 'video' ? 'default' : 'outline'}
                onClick={() => setBookingType('video')}
                className={bookingType === 'video' ? 'bg-amber-600' : ''}
              >
                <Video className="w-4 h-4 mr-2" />
                Video Call
              </Button>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="text-sm font-medium text-amber-200 mb-2 block">
              <Calendar className="w-4 h-4 inline mr-1" />
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-amber-50 focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Time */}
          <div>
            <label className="text-sm font-medium text-amber-200 mb-2 block">
              <Clock className="w-4 h-4 inline mr-1" />
              Time
            </label>
            <input
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-amber-50 focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Location (only for in-person) */}
          {bookingType === 'in-person' && (
            <div>
              <label className="text-sm font-medium text-amber-200 mb-2 block">
                <MapPin className="w-4 h-4 inline mr-1" />
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter meeting location"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-amber-50 placeholder:text-gray-500 focus:border-amber-500 focus:outline-none"
              />
            </div>
          )}

          {/* Pricing Info */}
          <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2 text-amber-200">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm">
                {bookingType === 'video' ? '$25/hour' : '$50/hour'}
              </span>
            </div>
            <p className="text-xs text-amber-200/60 mt-1">
              Payment will be processed after confirmation
            </p>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-amber-600 hover:bg-amber-700"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Request'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

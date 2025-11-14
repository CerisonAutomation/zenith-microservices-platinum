'use client'

import { useEffect } from 'react'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function CreateBookingError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    console.error('Create booking error:', error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-amber-900/20 to-gray-900 p-6">
      <div className="max-w-md text-center">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-amber-50 mb-2">
          Unable to create booking
        </h2>
        <p className="text-amber-200/80 mb-6">
          There was a problem processing your booking request. Please try again or go back.
        </p>
        <div className="flex gap-3">
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="flex-1 border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
          <Button
            onClick={reset}
            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
          >
            Try Again
          </Button>
        </div>
      </div>
    </div>
  )
}

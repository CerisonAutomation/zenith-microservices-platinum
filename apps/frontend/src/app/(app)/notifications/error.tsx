'use client'

import { useEffect } from 'react'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Notifications page error:', error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-amber-900/20 to-gray-900 p-6">
      <div className="max-w-md text-center">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-amber-50 mb-2">
          Unable to load notifications
        </h2>
        <p className="text-amber-200/80 mb-6">
          There was a problem loading your notifications. Please try again.
        </p>
        <Button
          onClick={reset}
          className="bg-amber-600 hover:bg-amber-700 text-white"
        >
          Try again
        </Button>
      </div>
    </div>
  )
}

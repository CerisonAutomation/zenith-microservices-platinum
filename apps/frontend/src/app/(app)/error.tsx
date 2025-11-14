'use client'

import { useEffect } from 'react'
import { AlertCircle, Home, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Only log errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('App section error:', error)
    }
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-amber-900/20 to-gray-900 p-6">
      <div className="max-w-md text-center">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-amber-50 mb-2">
          Something went wrong
        </h2>
        <p className="text-amber-200/80 mb-6">
          We encountered an error while loading this section. Please try again.
        </p>
        {process.env.NODE_ENV === 'development' && error && (
          <div className="mb-6 p-3 bg-red-950/30 border border-red-500/30 rounded text-left overflow-auto max-h-32">
            <p className="text-xs font-mono text-red-400 break-all">
              {error.toString()}
            </p>
          </div>
        )}
        <div className="flex gap-3">
          <Button
            onClick={reset}
            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <Button
            onClick={() => (window.location.href = '/')}
            variant="outline"
            className="flex-1 border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white"
          >
            <Home className="w-4 h-4 mr-2" />
            Home
          </Button>
        </div>
      </div>
    </div>
  )
}

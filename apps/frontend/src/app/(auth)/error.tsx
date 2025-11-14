'use client'

import { useEffect } from 'react'
import { AlertCircle, Home, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Only log errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Authentication error:', error)
    }
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 p-6">
      <div className="max-w-md w-full text-center bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/20">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">
          Authentication Error
        </h2>
        <p className="text-gray-300 mb-6">
          There was a problem with authentication. Please try again or return home.
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
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <Button
            onClick={() => (window.location.href = '/')}
            variant="outline"
            className="flex-1 border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white"
          >
            <Home className="w-4 h-4 mr-2" />
            Home
          </Button>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect } from 'react'
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Only log errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Global application error:', error)
    }

    // Send to error tracking service
    if (typeof window !== 'undefined') {
      // You can integrate with Sentry, Datadog, etc.
      if ((window as any).Sentry) {
        ;(window as any).Sentry.captureException(error, {
          level: 'error',
          tags: {
            errorBoundary: 'global',
          },
        })
      }
    }
  }, [error])

  return (
    <html lang="en" className="dark">
      <body className="bg-gray-950 text-amber-50 min-h-screen">
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-amber-900/20 to-gray-900 p-6">
          <div className="max-w-lg w-full text-center">
            <div className="mb-6">
              <AlertTriangle className="w-20 h-20 text-red-500 mx-auto mb-4" />
              <h1 className="text-4xl font-bold text-amber-50 mb-2">
                Oops! Something went wrong
              </h1>
              <p className="text-amber-200/80 text-lg">
                We encountered an unexpected error. Our team has been notified.
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && error && (
              <div className="mb-6 p-4 bg-red-950/30 border border-red-500/30 rounded-lg text-left overflow-auto max-h-48">
                <p className="text-sm font-mono text-red-400 break-all">
                  {error.toString()}
                </p>
                {error.digest && (
                  <p className="text-xs font-mono text-red-300 mt-2">
                    Error ID: {error.digest}
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={reset}
                className="bg-amber-600 hover:bg-amber-700 text-white"
                size="lg"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button
                onClick={() => (window.location.href = '/')}
                variant="outline"
                className="border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white"
                size="lg"
              >
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}

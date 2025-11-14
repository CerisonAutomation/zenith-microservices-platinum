'use client'

import { useEffect } from 'react'
import { UserX, ArrowLeft, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function ProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    console.error('Profile page error:', error)
  }, [error])

  const isNotFound = error.message?.includes('404') || error.message?.includes('not found')

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-amber-900/20 to-gray-900 p-6">
      <div className="max-w-md text-center">
        <UserX className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-amber-50 mb-2">
          {isNotFound ? 'Profile not found' : 'Unable to load profile'}
        </h2>
        <p className="text-amber-200/80 mb-6">
          {isNotFound
            ? 'This profile may have been removed or does not exist.'
            : 'There was a problem loading this profile. Please try again.'}
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
          {!isNotFound && (
            <Button
              onClick={reset}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Example Component: Profile with Comprehensive Error Handling
 * Demonstrates best practices for error handling in React components
 */

'use client'

import { useState, useEffect } from 'react'
import { useAsync } from '@/hooks/use-async'
import { useErrorHandler } from '@/hooks/use-error-handler'
import { retryWithBackoff } from '@/lib/error-handler'
import { userService } from '@/lib/api'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ErrorMessage } from '@/components/ui/error-message'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ProfileData {
  id: string
  name: string
  email: string
  bio?: string
  avatar_url?: string
}

export function ProfileWithErrorHandling() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const { error, setError, clearError } = useErrorHandler()
  const { data, loading, execute } = useAsync(
    async () => {
      // Use retry logic for network requests
      return await retryWithBackoff(
        () => userService.getProfile(),
        { maxAttempts: 3, delayMs: 1000 }
      )
    }
  )

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    clearError()
    try {
      const result = await execute()
      if (result) {
        setProfile(result as ProfileData)
      }
    } catch (err) {
      // Error is already handled by useErrorHandler
      console.error('Failed to load profile:', err)
    }
  }

  const handleRetry = () => {
    loadProfile()
  }

  // Loading state
  if (loading && !profile) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" text="Loading profile..." />
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error && !profile) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="py-6">
          <ErrorMessage
            title="Failed to load profile"
            message={error.message}
            onRetry={handleRetry}
            variant="card"
          />
        </CardContent>
      </Card>
    )
  }

  // Success state
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Your account information</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <ErrorMessage
            message={error.message}
            onDismiss={clearError}
            className="mb-4"
          />
        )}

        {profile && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-300">Name</label>
              <p className="text-lg text-white">{profile.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">Email</label>
              <p className="text-lg text-white">{profile.email}</p>
            </div>
            {profile.bio && (
              <div>
                <label className="text-sm font-medium text-gray-300">Bio</label>
                <p className="text-gray-200">{profile.bio}</p>
              </div>
            )}
            <Button onClick={loadProfile} variant="outline">
              Refresh Profile
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

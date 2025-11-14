/**
 * 👤 FULL PROFILE PAGE
 * This page loads when:
 * 1. Direct navigation to /profile/[id]
 * 2. Page refresh on /profile/[id]
 * 3. Intercepting route not matched
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Loader2, Heart, MessageCircle, Calendar, Shield, MapPin, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

interface ProfilePageProps {
  params: {
    id: string
  }
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', params.id)
        .single()

      if (!error && data) {
        setProfile(data)
      }
      setLoading(false)
    }

    fetchProfile()
  }, [params.id, supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-amber-900/20 to-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-amber-900/20 to-gray-900">
        <div className="text-center">
          <p className="text-amber-200 mb-4">Profile not found</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-amber-900/20 to-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Profile Content */}
        <div className="bg-gray-800/50 border border-amber-500/30 rounded-xl p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-amber-500">
              {profile.avatar_url ? (
                <Image src={profile.avatar_url} alt={profile.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white text-3xl font-bold">
                  {profile.name?.[0] || '?'}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-amber-50 flex items-center gap-2">
                {profile.name || 'Unknown'}
                {profile.verified && (
                  <Shield className="w-6 h-6 text-blue-400" />
                )}
              </h1>
              <p className="text-amber-200/70 text-lg">
                {profile.age || '?'} years old
              </p>
            </div>
          </div>

          {/* Location */}
          {profile.location && (
            <div className="flex items-center gap-2 text-amber-100/80">
              <MapPin className="w-5 h-5" />
              <span className="text-lg">{profile.location}</span>
            </div>
          )}

          {/* Bio */}
          {profile.bio && (
            <div>
              <h2 className="text-xl font-semibold text-amber-50 mb-3">About</h2>
              <p className="text-amber-100/80 text-lg leading-relaxed">{profile.bio}</p>
            </div>
          )}

          {/* Photos Grid */}
          {profile.photos && profile.photos.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-amber-50 mb-3">Photos</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {profile.photos.map((photo: string, idx: number) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden">
                    <Image src={photo} alt={`Photo ${idx + 1}`} fill className="object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t border-amber-500/20">
            <Button className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-lg py-6">
              <Heart className="w-5 h-5 mr-2" />
              Like
            </Button>
            <Button className="flex-1 bg-amber-600 hover:bg-amber-700 text-lg py-6">
              <MessageCircle className="w-5 h-5 mr-2" />
              Message
            </Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700 text-lg py-6"
              onClick={() => router.push(`/bookings/create?with=${profile.id}`)}
            >
              <Calendar className="w-5 h-5 mr-2" />
              Book Date
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

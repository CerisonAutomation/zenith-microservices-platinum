/**
 * 🎯 INTERCEPTING ROUTE - Profile Modal
 * When user clicks profile from explore, show in modal
 * URL changes but modal overlays current page
 */

'use client'

import { useRouter } from 'next/navigation'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Loader2, X, Heart, MessageCircle, Calendar, Shield, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

interface ProfileModalProps {
  params: {
    id: string
  }
}

export default function ProfileModal({ params }: ProfileModalProps) {
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

  const handleClose = () => {
    router.back()
  }

  return (
    <Dialog open={true} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 border-amber-500/30">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          </div>
        ) : profile ? (
          <div className="space-y-6">
            {/* Header with close button */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-amber-500">
                  {profile.avatar_url ? (
                    <Image src={profile.avatar_url} alt={profile.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white text-2xl font-bold">
                      {profile.name?.[0] || '?'}
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-amber-50 flex items-center gap-2">
                    {profile.name || 'Unknown'}
                    {profile.verified && (
                      <Shield className="w-5 h-5 text-blue-400" />
                    )}
                  </h2>
                  <p className="text-amber-200/70 text-sm">
                    {profile.age || '?'} years old
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Location */}
            {profile.location && (
              <div className="flex items-center gap-2 text-amber-100/80">
                <MapPin className="w-4 h-4" />
                <span>{profile.location}</span>
              </div>
            )}

            {/* Bio */}
            {profile.bio && (
              <div>
                <h3 className="text-lg font-semibold text-amber-50 mb-2">About</h3>
                <p className="text-amber-100/80">{profile.bio}</p>
              </div>
            )}

            {/* Photos Grid */}
            {profile.photos && profile.photos.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-amber-50 mb-2">Photos</h3>
                <div className="grid grid-cols-3 gap-2">
                  {profile.photos.map((photo: string, idx: number) => (
                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden">
                      <Image src={photo} alt={`Photo ${idx + 1}`} fill className="object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-amber-500/20">
              <Button className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600">
                <Heart className="w-4 h-4 mr-2" />
                Like
              </Button>
              <Button className="flex-1 bg-amber-600 hover:bg-amber-700">
                <MessageCircle className="w-4 h-4 mr-2" />
                Message
              </Button>
              <Button className="flex-1 bg-green-600 hover:bg-green-700">
                <Calendar className="w-4 h-4 mr-2" />
                Book Date
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-amber-200">Profile not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

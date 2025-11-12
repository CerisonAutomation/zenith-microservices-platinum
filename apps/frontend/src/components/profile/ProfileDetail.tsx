/**
 * Profile Detail Component
 *
 * Full profile view with:
 * - Photo gallery (carousel)
 * - Bio and details
 * - Kinks and preferences
 * - Hidden albums (premium feature)
 * - Verification badges
 * - Action buttons (like, message, book)
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Heart,
  MessageCircle,
  Calendar,
  MapPin,
  Ruler,
  Weight,
  Shield,
  Lock,
  Star,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  Clock,
  Verified,
  Flag,
  Share2,
  Bookmark,
  Info,
} from 'lucide-react';
import { DATING_APP_CONFIG } from '@/config/dating-app.config';
import type { DatingProfile } from '@/types/dating.types';

interface ProfileDetailProps {
  profile: DatingProfile;
  userIsPremium: boolean;
  onClose: () => void;
  onLike?: () => void;
  onMessage?: () => void;
  onBook?: () => void;
  onReport?: () => void;
  onUnlockHiddenAlbum?: (albumId: string) => void;
}

export function ProfileDetail({
  profile,
  userIsPremium,
  onClose,
  onLike,
  onMessage,
  onBook,
  onReport,
  onUnlockHiddenAlbum,
}: ProfileDetailProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);

  // Free users only see first public photo, rest are blurred
  const publicPhotos = profile.photos.filter((p) => p.isPublic);
  const canSeeAllPhotos = userIsPremium;
  const canSeeCurrentPhoto = canSeeAllPhotos || currentPhotoIndex === 0;

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % publicPhotos.length);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + publicPhotos.length) % publicPhotos.length);
  };

  // Calculate age from date
  const calculateAge = (birthDate: Date) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-6xl bg-gradient-to-br from-purple-900/50 via-black to-pink-900/50 rounded-2xl overflow-hidden border-2 border-purple-500/30 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grid md:grid-cols-2 gap-0">
          {/* Left Side - Photos */}
          <div className="relative bg-black">
            {/* Photo Gallery */}
            <div className="relative aspect-[3/4] overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentPhotoIndex}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.3 }}
                  src={publicPhotos[currentPhotoIndex]?.url}
                  alt={profile.displayName}
                  className={`w-full h-full object-cover ${
                    !canSeeCurrentPhoto ? 'blur-2xl scale-110' : ''
                  }`}
                />
              </AnimatePresence>

              {/* Blur Overlay for Free Users */}
              {!canSeeCurrentPhoto && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
                  <Lock className="w-12 h-12 text-white mb-4" />
                  <p className="text-white font-semibold text-lg mb-2">Premium Only</p>
                  <p className="text-gray-300 text-sm mb-4">Unlock all photos with Premium</p>
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500">
                    <Star className="w-4 h-4 mr-2" />
                    Upgrade Now
                  </Button>
                </div>
              )}

              {/* Navigation Arrows */}
              {publicPhotos.length > 1 && (
                <>
                  <button
                    onClick={prevPhoto}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-all"
                  >
                    <ChevronLeft className="w-6 h-6 text-white" />
                  </button>

                  <button
                    onClick={nextPhoto}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-all"
                  >
                    <ChevronRight className="w-6 h-6 text-white" />
                  </button>
                </>
              )}

              {/* Photo Indicators */}
              <div className="absolute top-4 left-0 right-0 flex justify-center gap-1 px-4">
                {publicPhotos.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPhotoIndex(idx)}
                    className={`h-1 flex-1 max-w-12 rounded-full transition-all ${
                      idx === currentPhotoIndex
                        ? 'bg-white'
                        : 'bg-white/30 hover:bg-white/50'
                    }`}
                  />
                ))}
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-all"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              {/* Verification Badge */}
              {profile.verified.photo && (
                <div className="absolute top-4 left-4">
                  <Badge className="bg-blue-500 text-white border-0">
                    <Shield className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                </div>
              )}

              {/* Premium Badge */}
              {profile.isPremium && (
                <div className="absolute bottom-4 right-4">
                  <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0">
                    <Star className="w-4 h-4 mr-1" />
                    Premium
                  </Badge>
                </div>
              )}
            </div>

            {/* Hidden Albums (Premium Feature) */}
            {profile.hiddenAlbums && profile.hiddenAlbums.length > 0 && (
              <div className="p-4 bg-black/50">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Hidden Albums ({profile.hiddenAlbums.length})
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {profile.hiddenAlbums.map((album) => (
                    <div
                      key={album.id}
                      className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
                      onClick={() => {
                        if (userIsPremium) {
                          setSelectedAlbum(album.id);
                        } else {
                          onUnlockHiddenAlbum?.(album.id);
                        }
                      }}
                    >
                      <img
                        src={album.photos[0]?.url}
                        alt={album.name}
                        className="w-full h-full object-cover blur-lg"
                      />
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
                        <Lock className="w-6 h-6 text-white mb-1" />
                        <span className="text-white text-xs font-semibold">{album.photos.length}</span>
                      </div>
                      {!userIsPremium && (
                        <div className="absolute inset-0 bg-purple-600/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Star className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Profile Info */}
          <div className="flex flex-col overflow-y-auto max-h-[80vh] bg-black/40 backdrop-blur-xl">
            {/* Header */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                    {profile.displayName}
                    {profile.verified.id && (
                      <Verified className="w-6 h-6 text-blue-400" />
                    )}
                  </h1>
                  <p className="text-gray-300 text-lg">@{profile.username}</p>
                </div>
                <div className="flex gap-2">
                  <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
                    <Share2 className="w-5 h-5 text-white" />
                  </button>
                  <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
                    <Bookmark className="w-5 h-5 text-white" />
                  </button>
                  <button
                    onClick={onReport}
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-red-500/20 flex items-center justify-center transition-all"
                  >
                    <Flag className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="flex items-center gap-2 text-gray-300">
                  <div className="w-8 h-8 rounded-lg bg-purple-600/30 flex items-center justify-center">
                    <span className="text-lg">{profile.age}</span>
                  </div>
                  <span className="text-sm">years old</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{profile.location.city}</span>
                </div>
                {profile.stats.lastActive && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">Active now</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                {onLike && (
                  <Button
                    onClick={onLike}
                    className="bg-gradient-to-r from-pink-600 to-red-600 hover:from-pink-500 hover:to-red-500"
                  >
                    <Heart className="w-5 h-5 mr-2" />
                    Like
                  </Button>
                )}
                {onMessage && userIsPremium && (
                  <Button
                    onClick={onMessage}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Message
                  </Button>
                )}
                {onBook && profile.userMode === 'become_boyfriend' && userIsPremium && (
                  <Button
                    onClick={onBook}
                    className="col-span-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500"
                  >
                    <Calendar className="w-5 h-5 mr-2" />
                    Book a Date
                  </Button>
                )}
                {!userIsPremium && (onMessage || onBook) && (
                  <div className="col-span-2 p-3 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-purple-400" />
                      <span className="text-sm text-purple-200">Premium feature</span>
                    </div>
                    <Button size="sm" className="bg-gradient-to-r from-purple-600 to-pink-600">
                      Upgrade
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Bio */}
            <div className="p-6 border-b border-white/10">
              <h2 className="text-white font-semibold text-lg mb-3">About</h2>
              <p className="text-gray-300 leading-relaxed">{profile.bio}</p>
            </div>

            {/* Body Type & Physical Attributes */}
            <div className="p-6 border-b border-white/10">
              <h2 className="text-white font-semibold text-lg mb-3">Physical</h2>
              <div className="space-y-3">
                {/* Body Types */}
                <div>
                  <p className="text-gray-400 text-sm mb-2">Body Type</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.bodyType.map((type) => {
                      const bodyTypeConfig = DATING_APP_CONFIG.bodyTypes.find((bt) => bt.id === type);
                      return (
                        <Badge
                          key={type}
                          className="bg-purple-600/30 text-purple-200 border-purple-500/50"
                        >
                          {bodyTypeConfig?.label || type}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                {/* Height & Weight */}
                <div className="grid grid-cols-2 gap-3">
                  {profile.height && (
                    <div className="flex items-center gap-2 text-gray-300">
                      <Ruler className="w-4 h-4" />
                      <span>{profile.height} cm</span>
                    </div>
                  )}
                  {profile.weight && (
                    <div className="flex items-center gap-2 text-gray-300">
                      <Weight className="w-4 h-4" />
                      <span>{profile.weight} kg</span>
                    </div>
                  )}
                </div>

                {/* Ethnicity */}
                {profile.ethnicity && profile.ethnicity.length > 0 && (
                  <div>
                    <p className="text-gray-400 text-sm mb-2">Ethnicity</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.ethnicity.map((eth) => (
                        <Badge key={eth} variant="secondary" className="bg-white/10 text-gray-200">
                          {eth}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Kinks & Preferences */}
            <div className="p-6 border-b border-white/10">
              <h2 className="text-white font-semibold text-lg mb-3">Interests</h2>
              <div className="space-y-4">
                {/* Position */}
                <div>
                  <p className="text-gray-400 text-sm mb-2">Position</p>
                  <Badge className="bg-pink-600/30 text-pink-200 border-pink-500/50">
                    {DATING_APP_CONFIG.kinks.positions.find((p) => p.id === profile.kinks.position)?.label}
                  </Badge>
                </div>

                {/* Intensity */}
                {profile.kinks.intensity.length > 0 && (
                  <div>
                    <p className="text-gray-400 text-sm mb-2">Style</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.kinks.intensity.map((int) => {
                        const config = DATING_APP_CONFIG.kinks.intensity.find((i) => i.id === int);
                        return (
                          <Badge key={int} className="bg-purple-600/30 text-purple-200 border-purple-500/50">
                            {config?.label}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Activities */}
                {profile.kinks.activities.length > 0 && (
                  <div>
                    <p className="text-gray-400 text-sm mb-2">Activities</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.kinks.activities.map((act) => {
                        const config = DATING_APP_CONFIG.kinks.activities.find((a) => a.id === act);
                        return (
                          <Badge key={act} className="bg-amber-600/30 text-amber-200 border-amber-500/50">
                            {config?.label}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Safety */}
                {profile.kinks.safety.length > 0 && (
                  <div>
                    <p className="text-gray-400 text-sm mb-2 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-green-400" />
                      Safety & Health
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {profile.kinks.safety.map((safe) => {
                        const config = DATING_APP_CONFIG.kinks.safety.find((s) => s.id === safe);
                        return (
                          <Badge key={safe} className="bg-green-600/30 text-green-200 border-green-500/50">
                            {config?.label}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Relationship Goals */}
            <div className="p-6 border-b border-white/10">
              <h2 className="text-white font-semibold text-lg mb-3">Looking For</h2>
              <div className="flex flex-wrap gap-2">
                {profile.relationshipGoals.map((goal) => {
                  const config = DATING_APP_CONFIG.relationshipGoals.find((rg) => rg.id === goal);
                  return (
                    <Badge key={goal} className="bg-blue-600/30 text-blue-200 border-blue-500/50">
                      {config?.label}
                    </Badge>
                  );
                })}
              </div>
            </div>

            {/* Verification Status */}
            <div className="p-6">
              <h2 className="text-white font-semibold text-lg mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-400" />
                Verification
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(profile.verified).map(([key, value]) => (
                  <div
                    key={key}
                    className={`p-3 rounded-lg border ${
                      value
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {value ? (
                        <Verified className="w-4 h-4 text-green-400" />
                      ) : (
                        <X className="w-4 h-4 text-gray-500" />
                      )}
                      <span className={value ? 'text-green-300' : 'text-gray-400'}>
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Availability (for Become a Boyfriend mode) */}
            {profile.availability && (
              <div className="p-6 border-t border-white/10">
                <h2 className="text-white font-semibold text-lg mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-400" />
                  Availability & Rates
                </h2>
                <div className="space-y-3">
                  <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <p className="text-2xl font-bold text-amber-400">
                      {profile.availability.currency} {profile.availability.hourlyRate}/hour
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-2">Available Days</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.availability.availableDays.map((day) => (
                        <Badge key={day} variant="secondary" className="bg-white/10 text-gray-200">
                          {day.toUpperCase()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {profile.availability.location.willTravel && (
                    <div className="flex items-center gap-2 text-gray-300 text-sm">
                      <MapPin className="w-4 h-4" />
                      <span>
                        Will travel up to {profile.availability.location.maxTravelDistance} km
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

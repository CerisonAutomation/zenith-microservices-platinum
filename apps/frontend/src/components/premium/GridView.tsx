/**
 * Premium Grid View Component
 *
 * Displays user profiles in a responsive grid layout
 * Features:
 * - Premium users: see all photos
 * - Free users: only first photo visible, rest blurred
 * - Body type badges, distance, online status
 * - Verification indicators
 * - Hidden albums access (premium only)
 * - Responsive 2-4 column layout
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Heart,
  MapPin,
  Clock,
  Verified,
  Lock,
  Image as ImageIcon,
  Star,
  Shield,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { DATING_APP_CONFIG } from '@/config/dating-app.config';
import type { GridViewProfile, GridViewFilter } from '@/types/dating.types';

interface GridViewProps {
  profiles: GridViewProfile[];
  userIsPremium: boolean;
  onProfileClick: (profileId: string) => void;
  onLike?: (profileId: string) => void;
  onUnlock?: (profileId: string) => void;
  filters?: GridViewFilter;
}

export function GridView({
  profiles,
  userIsPremium,
  onProfileClick,
  onLike,
  onUnlock,
  filters,
}: GridViewProps) {
  const [hoveredProfile, setHoveredProfile] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);

  return (
    <div className="w-full">
      {/* Premium Upsell Banner for Free Users */}
      {!userIsPremium && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-6 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Star className="w-6 h-6" />
              <div>
                <h3 className="font-bold text-lg">Upgrade to Premium</h3>
                <p className="text-sm opacity-90">
                  Unlock all photos, unlimited swipes, and advanced filters
                </p>
              </div>
            </div>
            <Button
              onClick={() => onUnlock?.('premium')}
              className="bg-white text-purple-600 hover:bg-gray-100"
            >
              Upgrade Now
            </Button>
          </div>
        </motion.div>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {profiles.map((profile, index) => (
          <ProfileCard
            key={profile.id}
            profile={profile}
            userIsPremium={userIsPremium}
            isHovered={hoveredProfile === profile.id}
            onHover={() => setHoveredProfile(profile.id)}
            onLeave={() => setHoveredProfile(null)}
            onClick={() => onProfileClick(profile.id)}
            onLike={onLike}
            onUnlock={onUnlock}
            index={index}
          />
        ))}
      </div>

      {/* Empty State */}
      {profiles.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Eye className="w-10 h-10 text-purple-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No profiles found</h3>
          <p className="text-gray-400">Try adjusting your filters or check back later</p>
        </motion.div>
      )}
    </div>
  );
}

interface ProfileCardProps {
  profile: GridViewProfile;
  userIsPremium: boolean;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
  onLike?: (profileId: string) => void;
  onUnlock?: (profileId: string) => void;
  index: number;
}

function ProfileCard({
  profile,
  userIsPremium,
  isHovered,
  onHover,
  onLeave,
  onClick,
  onLike,
  onUnlock,
  index,
}: ProfileCardProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Free users only see first photo, rest are blurred
  const canSeePhoto = userIsPremium || currentPhotoIndex === 0;
  const hasMultiplePhotos = profile.photos.length > 1;

  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentPhotoIndex((prev) => (prev + 1) % profile.photos.length);
    setImageLoaded(false);
  };

  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentPhotoIndex((prev) => (prev - 1 + profile.photos.length) % profile.photos.length);
    setImageLoaded(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className="relative group"
    >
      <Card
        className={`
          relative overflow-hidden cursor-pointer transition-all duration-300
          bg-black/40 border-white/10 hover:border-purple-500/50
          ${isHovered ? 'scale-105 shadow-2xl shadow-purple-500/20' : 'shadow-lg'}
        `}
        onClick={onClick}
      >
        {/* Photo Container */}
        <div className="relative aspect-[3/4] overflow-hidden">
          {/* Main Photo */}
          <div className="relative w-full h-full">
            <img
              src={profile.photos[currentPhotoIndex]}
              alt={profile.name}
              className={`
                w-full h-full object-cover transition-all duration-300
                ${!canSeePhoto ? 'blur-2xl scale-110' : ''}
                ${imageLoaded ? 'opacity-100' : 'opacity-0'}
              `}
              onLoad={() => setImageLoaded(true)}
            />

            {/* Loading Skeleton */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 to-pink-900/50 animate-pulse" />
            )}

            {/* Blur Overlay for Free Users */}
            {!canSeePhoto && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center"
              >
                <Lock className="w-8 h-8 text-white mb-2" />
                <p className="text-white font-semibold mb-2">Premium Only</p>
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUnlock?.(profile.id);
                  }}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
                >
                  Unlock
                </Button>
              </motion.div>
            )}
          </div>

          {/* Photo Navigation */}
          {hasMultiplePhotos && userIsPremium && (
            <>
              <div className="absolute top-0 left-0 right-0 flex justify-center gap-1 p-2">
                {profile.photos.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1 flex-1 rounded-full transition-all ${
                      idx === currentPhotoIndex
                        ? 'bg-white'
                        : 'bg-white/30 hover:bg-white/50'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={prevPhoto}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>

              <button
                onClick={nextPhoto}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </>
          )}

          {/* Photo Count Badge */}
          {hasMultiplePhotos && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-black/60 backdrop-blur-sm text-white border-0">
                <ImageIcon className="w-3 h-3 mr-1" />
                {profile.photos.length}
              </Badge>
            </div>
          )}

          {/* Online Status */}
          {profile.online && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-green-500 text-white border-0 flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                Online
              </Badge>
            </div>
          )}

          {/* Verification Badge */}
          {profile.verified && (
            <div className="absolute top-3 left-3" style={{ marginLeft: profile.online ? '80px' : '0' }}>
              <Badge className="bg-blue-500 text-white border-0">
                <Shield className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            </div>
          )}

          {/* Premium Badge */}
          {profile.isPremium && (
            <div className="absolute bottom-3 right-3">
              <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0">
                <Star className="w-3 h-3 mr-1" />
                Premium
              </Badge>
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        </div>

        {/* Profile Info */}
        <CardContent className="absolute bottom-0 left-0 right-0 p-4">
          <div className="space-y-2">
            {/* Name & Age */}
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                {profile.name}, {profile.age}
                {profile.verified && <Verified className="w-4 h-4 text-blue-400" />}
              </h3>

              {/* Like Button */}
              {onLike && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onLike(profile.id);
                  }}
                  className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 flex items-center justify-center transition-all hover:scale-110"
                >
                  <Heart className="w-5 h-5 text-white" />
                </button>
              )}
            </div>

            {/* Distance */}
            <div className="flex items-center gap-1 text-gray-300 text-sm">
              <MapPin className="w-4 h-4" />
              <span>{profile.distance}</span>
            </div>

            {/* Body Type Badges */}
            <div className="flex flex-wrap gap-1">
              {profile.bodyType.slice(0, 2).map((type) => {
                const bodyTypeConfig = DATING_APP_CONFIG.bodyTypes.find((bt) => bt.id === type);
                return (
                  <Badge
                    key={type}
                    variant="secondary"
                    className="bg-purple-600/30 text-purple-200 border-purple-500/50 text-xs"
                  >
                    {bodyTypeConfig?.label || type}
                  </Badge>
                );
              })}
              {profile.bodyType.length > 2 && (
                <Badge
                  variant="secondary"
                  className="bg-purple-600/30 text-purple-200 border-purple-500/50 text-xs"
                >
                  +{profile.bodyType.length - 2}
                </Badge>
              )}
            </div>

            {/* Availability (for Become a Boyfriend mode) */}
            {profile.availability && (
              <div className="flex items-center gap-1 text-gray-300 text-xs">
                <Clock className="w-3 h-3" />
                <span>{profile.availability}</span>
              </div>
            )}
          </div>
        </CardContent>

        {/* Hover Overlay with Actions */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-4"
            >
              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
              >
                View Profile
              </Button>

              {onLike && (
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full border-white/20 text-white hover:bg-white/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    onLike(profile.id);
                  }}
                >
                  <Heart className="w-5 h-5 mr-2" />
                  Like
                </Button>
              )}

              {!userIsPremium && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUnlock?.(profile.id);
                  }}
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Unlock All Photos
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

/**
 * Grid View Filters Component
 */
interface GridViewFiltersProps {
  filters: GridViewFilter;
  onChange: (filters: GridViewFilter) => void;
  userIsPremium: boolean;
}

export function GridViewFilters({ filters, onChange, userIsPremium }: GridViewFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!userIsPremium) {
    return (
      <div className="p-6 rounded-xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-2 border-purple-500/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Lock className="w-6 h-6 text-purple-400" />
            <div>
              <h3 className="font-bold text-white">Advanced Filters</h3>
              <p className="text-sm text-gray-300">Premium feature - Upgrade to unlock</p>
            </div>
          </div>
          <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500">
            Upgrade
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter controls would go here */}
      <div className="text-white">
        <p className="text-sm text-gray-400">Filters: Active</p>
      </div>
    </div>
  );
}

'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, MessageCircle, MapPin, Shield, Zap } from 'lucide-react'

interface User {
  id: string
  username: string
  full_name: string
  avatar_url?: string
  bio?: string
  birth_date: string
  gender: string
  location?: {
    city?: string
    country?: string
  }
  is_online: boolean
  is_verified: boolean
  meet_now_available: boolean
  interests?: string[]
  last_seen_at: string
}

interface EliteProfileCardProps {
  user: User
  onLike: (userId: string) => void
  onMessage: (userId: string) => void
  className?: string
}

export function EliteProfileCard({ user, onLike, onMessage, className = '' }: EliteProfileCardProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const age = new Date().getFullYear() - new Date(user.birth_date).getFullYear()
  const isOnline = user.is_online
  const distance = user.location ? Math.floor(Math.random() * 50) + 1 : null // Mock distance

  const handleLike = () => {
    setIsLiked(!isLiked)
    onLike(user.id)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className={`relative bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden ${className}`}
    >
      {/* Profile Image */}
      <div className="relative h-64 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-slate-700 dark:to-slate-800">
        {user.avatar_url ? (
          <>
            <img
              src={user.avatar_url}
              alt={user.full_name}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
            />
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-slate-700 dark:to-slate-800 animate-pulse" />
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-20 h-20 bg-amber-200 dark:bg-slate-600 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                {user.full_name[0].toUpperCase()}
              </span>
            </div>
          </div>
        )}

        {/* Status Indicators */}
        <div className="absolute top-3 left-3 flex gap-2">
          {isOnline && (
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          )}
          {user.is_verified && (
            <div className="bg-blue-500 rounded-full p-1">
              <Shield className="w-3 h-3 text-white" />
            </div>
          )}
          {user.meet_now_available && (
            <div className="bg-amber-500 rounded-full p-1">
              <Zap className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        {/* Like Button */}
        <button
          onClick={handleLike}
          className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
            isLiked
              ? 'bg-red-500 text-white'
              : 'bg-white/80 text-slate-600 hover:bg-white hover:scale-110'
          }`}
        >
          <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Profile Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {user.full_name}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              @{user.username}, {age}
            </p>
          </div>
        </div>

        {user.location && (
          <div className="flex items-center gap-1 mb-2">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {user.location.city && user.location.country
                ? `${user.location.city}, ${user.location.country}`
                : user.location.city || user.location.country || 'Location not set'
              }
              {distance && ` • ${distance}km away`}
            </span>
          </div>
        )}

        {user.bio && (
          <p className="text-sm text-slate-700 dark:text-slate-300 mb-3 line-clamp-2">
            {user.bio}
          </p>
        )}

        {user.interests && user.interests.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {user.interests.slice(0, 3).map((interest, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-xs rounded-full"
              >
                {interest}
              </span>
            ))}
            {user.interests.length > 3 && (
              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs rounded-full">
                +{user.interests.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => onMessage(user.id)}
            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            Message
          </button>
        </div>
      </div>

      {/* Online Status Indicator */}
      {isOnline && (
        <div className="absolute bottom-4 left-4">
          <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            Online now
          </div>
        </div>
      )}
    </motion.div>
  )
}
'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { Avatar, AvatarImage, AvatarFallback } from './avatar'
import { cn } from '@/lib/utils'

interface InteractiveAvatarProps {
  src?: string
  alt?: string
  fallback?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  status?: 'online' | 'offline' | 'away' | 'busy'
  onClick?: () => void
  showBorder?: boolean
  className?: string
}

const sizes = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
  '2xl': 'w-32 h-32',
}

const statusColors = {
  online: 'bg-green-500',
  offline: 'bg-gray-500',
  away: 'bg-yellow-500',
  busy: 'bg-red-500',
}

export function InteractiveAvatar({
  src,
  alt = 'Avatar',
  fallback = 'U',
  size = 'md',
  status,
  onClick,
  showBorder = true,
  className,
}: InteractiveAvatarProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      className={cn('relative inline-block', className)}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.1 }}
      whileTap={onClick ? { scale: 0.95 } : {}}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {/* Animated border ring */}
      {showBorder && (
        <motion.div
          className={cn(
            'absolute inset-0 rounded-full',
            'bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500',
            sizes[size]
          )}
          animate={
            isHovered
              ? { rotate: 360 }
              : { rotate: 0 }
          }
          transition={{
            duration: isHovered ? 2 : 0,
            repeat: isHovered ? Infinity : 0,
            ease: 'linear',
          }}
          style={{ padding: '2px' }}
        />
      )}

      {/* Avatar */}
      <div className={cn('relative', sizes[size])}>
        <Avatar className={cn('w-full h-full', showBorder && 'border-2 border-gray-900')}>
          <AvatarImage src={src} alt={alt} />
          <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white font-bold">
            {fallback}
          </AvatarFallback>
        </Avatar>

        {/* Status indicator */}
        {status && (
          <motion.div
            className={cn(
              'absolute bottom-0 right-0',
              'w-3 h-3 rounded-full border-2 border-gray-900',
              statusColors[status]
            )}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
          >
            {status === 'online' && (
              <motion.div
                className="absolute inset-0 rounded-full bg-green-500"
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

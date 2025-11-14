'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular' | 'avatar'
  animation?: 'pulse' | 'wave'
}

export function EnhancedSkeleton({
  className,
  variant = 'rectangular',
  animation = 'pulse',
}: SkeletonProps) {
  const baseClasses = 'bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800'

  const variantClasses = {
    text: 'h-4 w-full rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
    avatar: 'w-12 h-12 rounded-full',
  }

  return (
    <motion.div
      className={cn(baseClasses, variantClasses[variant], className)}
      animate={
        animation === 'pulse'
          ? {
              opacity: [0.5, 1, 0.5],
            }
          : {
              backgroundPosition: ['200% 0', '-200% 0'],
            }
      }
      transition={
        animation === 'pulse'
          ? {
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }
          : {
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }
      }
      style={
        animation === 'wave'
          ? {
              backgroundSize: '200% 100%',
            }
          : {}
      }
    />
  )
}

export function ProfileCardSkeleton() {
  return (
    <div className="bg-gray-900 rounded-2xl p-6 space-y-4">
      <EnhancedSkeleton variant="avatar" className="mx-auto w-24 h-24" />
      <EnhancedSkeleton variant="text" className="w-3/4 mx-auto" />
      <EnhancedSkeleton variant="text" className="w-1/2 mx-auto" />
      <div className="space-y-2">
        <EnhancedSkeleton variant="rectangular" className="h-12" />
        <EnhancedSkeleton variant="rectangular" className="h-12" />
      </div>
    </div>
  )
}

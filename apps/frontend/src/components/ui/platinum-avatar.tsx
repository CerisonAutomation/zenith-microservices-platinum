/**
 * 🏛️ ZENITH ORACLE EXECUTIVE APEX AVATAR COMPONENT
 * Transcendent-grade avatar with mathematical precision and opulent aesthetics
 * Enterprise-grade component with atomic architecture and platinum intelligence
 */

import React, { forwardRef, useState, useCallback } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { platinumTokens } from '@/design-system/platinum-tokens'
import { User, Camera, CheckCircle, Crown, Shield, Star } from 'lucide-react'

// Oracle-grade avatar variants with mathematical precision
const avatarVariants = cva(
  // Base styles - atomic foundation
  [
    'relative inline-flex items-center justify-center rounded-full',
    'transition-all duration-300 ease-in-out',
    'overflow-hidden group',
  ],
  {
    variants: {
      variant: {
        // Platinum default - transcendent elegance
        default: [
          'bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600',
          'shadow-lg shadow-violet-500/25',
          'hover:shadow-xl hover:shadow-violet-500/40',
          'hover:scale-105',
        ],
        
        // Platinum elevated - sophisticated presence
        elevated: [
          'bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-500',
          'shadow-xl shadow-amber-500/30',
          'hover:shadow-2xl hover:shadow-amber-500/40',
          'hover:scale-110',
        ],
        
        // Platinum glass - ethereal transparency
        glass: [
          'bg-white/10 backdrop-blur-xl border border-white/20',
          'shadow-lg shadow-white/10',
          'hover:bg-white/20 hover:border-white/30',
          'hover:shadow-xl hover:shadow-white/20',
        ],
        
        // Platinum outline - sophisticated minimalism
        outline: [
          'border-2 border-violet-500/50 bg-transparent',
          'hover:border-violet-400/70 hover:bg-violet-500/10',
        ],
        
        // Platinum verified - achievement state
        verified: [
          'bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500',
          'shadow-lg shadow-emerald-500/25',
          'hover:shadow-xl hover:shadow-emerald-500/40',
        ],
        
        // Platinum premium - luxury state
        premium: [
          'bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-500',
          'shadow-xl shadow-amber-500/30',
          'hover:shadow-2xl hover:shadow-amber-500/40',
        ],
      },
      
      size: {
        // Mathematical scaling based on golden ratio
        xs: 'h-6 w-6 text-xs',
        sm: 'h-8 w-8 text-sm',
        md: 'h-10 w-10 text-base',
        lg: 'h-12 w-12 text-lg',
        xl: 'h-16 w-16 text-xl',
        '2xl': 'h-20 w-20 text-2xl',
        '3xl': 'h-24 w-24 text-3xl',
        '4xl': 'h-32 w-32 text-4xl',
      },
      
      // Oracle-grade badge positions
      badgePosition: {
        'top-right': 'top-0 right-0',
        'bottom-right': 'bottom-0 right-0',
        'top-left': 'top-0 left-0',
        'bottom-left': 'bottom-0 left-0',
      },
      
      // Platinum glow effects
      glow: {
        true: 'shadow-2xl shadow-violet-500/30',
        false: '',
      },
    },
    
    // Compound variants for transcendent combinations
    compoundVariants: [
      {
        variant: 'elevated',
        size: 'lg',
        class: 'shadow-2xl shadow-amber-500/40',
      },
      {
        variant: 'verified',
        glow: true,
        class: 'shadow-2xl shadow-emerald-500/40',
      },
    ],
    
    // Default classes
    defaultVariants: {
      variant: 'default',
      size: 'md',
      badgePosition: 'bottom-right',
      glow: false,
    },
  }
)

// Oracle-grade avatar interface
export interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  // Image source
  src?: string
  // Alt text
  alt?: string
  // Fallback text (initials)
  fallback?: string
  // Badge configuration
  badge?: {
    type: 'verified' | 'premium' | 'online' | 'offline' | 'away' | 'custom'
    content?: React.ReactNode
    show?: boolean
  }
  // Status indicator
  status?: 'online' | 'offline' | 'away' | 'busy'
  // Editable state
  editable?: boolean
  onEdit?: () => void
  // Loading state
  loading?: boolean
  // Platinum shimmer effect
  shimmer?: boolean
  // Border decoration
  borderDecoration?: boolean
}

// Transcendent avatar component
const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({
    className,
    variant,
    size,
    badgePosition,
    glow,
    src,
    alt,
    fallback,
    badge,
    status,
    editable = false,
    onEdit,
    loading = false,
    shimmer = true,
    borderDecoration = false,
    children,
    ...props
  }, ref) => {
    // Internal state
    const [imageError, setImageError] = useState(false)
    const [isHovered, setIsHovered] = useState(false)
    
    // Handle image error
    const handleImageError = useCallback(() => {
      setImageError(true)
    }, [])
    
    // Generate initials from fallback text
    const getInitials = useCallback((text: string) => {
      if (!text) return ''
      const words = text.trim().split(' ')
      if (words.length === 1) {
        return words[0].slice(0, 2).toUpperCase()
      }
      return words.slice(0, 2).map(word => word[0]).join('').toUpperCase()
    }, [])
    
    // Get status color
    const getStatusColor = useCallback((statusType: string) => {
      switch (statusType) {
        case 'online': return 'bg-emerald-500'
        case 'offline': return 'bg-neutral-500'
        case 'away': return 'bg-amber-500'
        case 'busy': return 'bg-red-500'
        default: return 'bg-neutral-500'
      }
    }, [])
    
    // Get badge content
    const getBadgeContent = useCallback((badgeType: string) => {
      switch (badgeType) {
        case 'verified': return <CheckCircle className="h-3 w-3 text-emerald-400" />
        case 'premium': return <Crown className="h-3 w-3 text-amber-400" />
        case 'online': return <div className="h-2 w-2 bg-emerald-500 rounded-full" />
        case 'offline': return <div className="h-2 w-2 bg-neutral-500 rounded-full" />
        case 'away': return <div className="h-2 w-2 bg-amber-500 rounded-full" />
        default: return badge?.content
      }
    }, [badge?.content])
    
    // Determine content to display
    const displayContent = () => {
      if (src && !imageError) {
        return (
          <img
            src={src}
            alt={alt || 'Avatar'}
            className="h-full w-full object-cover"
            onError={handleImageError}
          />
        )
      }
      
      if (children) {
        return children
      }
      
      if (fallback) {
        return (
          <span className="font-medium text-white">
            {getInitials(fallback)}
          </span>
        )
      }
      
      return <User className="h-1/2 w-1/2 text-white" />
    }
    
    return (
      <div
        ref={ref}
        className={cn(
          avatarVariants({ variant, size, badgePosition, glow }),
          editable && 'cursor-pointer',
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={editable ? onEdit : undefined}
        {...props}
      >
        {/* Avatar content */}
        <div className="relative h-full w-full">
          {displayContent()}
          
          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="h-1/2 w-1/2 animate-spin rounded-full border-2 border-white border-t-transparent" />
            </div>
          )}
          
          {/* Edit overlay */}
          {editable && isHovered && !loading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Camera className="h-1/3 w-1/3 text-white" />
            </div>
          )}
          
          {/* Platinum shimmer effect */}
          {shimmer && !loading && (
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>
          )}
          
          {/* Border decoration */}
          {borderDecoration && (
            <div className="absolute inset-0 rounded-full border-2 border-violet-400/30" />
          )}
        </div>
        
        {/* Badge */}
        {badge?.show && (
          <div className={cn(
            'absolute flex h-4 w-4 items-center justify-center rounded-full bg-neutral-900 border border-neutral-700',
            badgePosition
          )}>
            {getBadgeContent(badge.type)}
          </div>
        )}
        
        {/* Status indicator */}
        {status && (
          <div className={cn(
            'absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-neutral-900',
            getStatusColor(status)
          )} />
        )}
        
        {/* Platinum glow overlay */}
        {variant === 'elevated' && (
          <div className="absolute inset-0 rounded-full bg-gradient-to-t from-amber-500/10 to-transparent pointer-events-none" />
        )}
        
        {/* Styles for shimmer animation */}
        <style jsx>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
      </div>
    )
  }
)

Avatar.displayName = 'OracleExecutiveApexAvatar'

// Avatar Image Component (for more control)
const AvatarImage = forwardRef<
  HTMLImageElement,
  React.ImgHTMLAttributes<HTMLImageElement>
>(({ className, ...props }, ref) => (
  <img
    ref={ref}
    className={cn('aspect-square h-full w-full', className)}
    {...props}
  />
))
AvatarImage.displayName = 'OracleExecutiveApexAvatarImage'

// Avatar Fallback Component
const AvatarFallback = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex h-full w-full items-center justify-center rounded-full bg-neutral-600',
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = 'OracleExecutiveApexAvatarFallback'

export { 
  Avatar, 
  AvatarImage, 
  AvatarFallback,
  avatarVariants 
}
/**
 * 🚀 ZENITH PLATINUM COMPONENT LIBRARY
 * Oracle-grade atomic components with mathematical precision
 * Enterprise-grade React components for Next.js 14
 */

'use client'

import React, { forwardRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { platinumTokens } from './platinum-tokens'

// ==========================================================================
// PLATINUM BUTTON COMPONENT
// ==========================================================================

export interface PlatinumButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'platinum' | 'gold'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
  glow?: boolean
}

export const PlatinumButton = forwardRef<HTMLButtonElement, PlatinumButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    loading = false,
    icon,
    iconPosition = 'left',
    fullWidth = false,
    glow = false,
    children,
    disabled,
    ...props 
  }, ref) => {
    const [isPressed, setIsPressed] = useState(false)
    
    const baseClasses = cn(
      // Base styles
      'relative inline-flex items-center justify-center font-medium transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      
      // Size variants
      {
        'px-3 py-1.5 text-xs': size === 'xs',
        'px-4 py-2 text-sm': size === 'sm',
        'px-6 py-2.5 text-base': size === 'md',
        'px-8 py-3 text-lg': size === 'lg',
        'px-10 py-4 text-xl': size === 'xl',
      },
      
      // Full width
      { 'w-full': fullWidth },
      
      // Variant styles
      {
        // Primary variant
        'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 focus:ring-purple-500': variant === 'primary',
        
        // Secondary variant
        'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 focus:ring-amber-500': variant === 'secondary',
        
        // Outline variant
        'border-2 border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white focus:ring-purple-500': variant === 'outline',
        
        // Ghost variant
        'text-gray-300 hover:bg-white/10 hover:text-white focus:ring-white': variant === 'ghost',
        
        // Platinum variant
        'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 focus:ring-purple-400 shadow-lg shadow-purple-500/25': variant === 'platinum',
        
        // Gold variant
        'bg-gradient-to-r from-amber-400 to-yellow-500 text-gray-900 hover:from-amber-500 hover:to-yellow-600 focus:ring-amber-400 shadow-lg shadow-amber-500/25': variant === 'gold',
      },
      
      // Glow effect
      { 'shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/40': glow && variant === 'primary' },
      { 'shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/40': glow && variant === 'secondary' },
      
      className
    )
    
    return (
      <motion.button
        ref={ref}
        className={baseClasses}
        disabled={disabled || loading}
        onTapStart={() => setIsPressed(true)}
        onTap={() => setIsPressed(false)}
        onTapCancel={() => setIsPressed(false)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        {...props}
      >
        {/* Loading spinner */}
        {loading && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          </motion.div>
        )}
        
        {/* Button content */}
        <span className={cn('flex items-center gap-2', { 'opacity-0': loading })}>
          {icon && iconPosition === 'left' && icon}
          {children}
          {icon && iconPosition === 'right' && icon}
        </span>
        
        {/* Ripple effect */}
        <AnimatePresence>
          {isPressed && (
            <motion.div
              className="absolute inset-0 bg-white/20 rounded-inherit"
              initial={{ scale: 0, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 0 }}
              exit={{ scale: 1, opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          )}
        </AnimatePresence>
      </motion.button>
    )
  }
)

PlatinumButton.displayName = 'PlatinumButton'

// ==========================================================================
// PLATINUM INPUT COMPONENT
// ==========================================================================

export interface PlatinumInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  error?: string
  helperText?: string
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  variant?: 'default' | 'filled' | 'outlined'
  size?: 'sm' | 'md' | 'lg'
}

export const PlatinumInput = forwardRef<HTMLInputElement, PlatinumInputProps>(
  ({
    className,
    label,
    error,
    helperText,
    icon,
    iconPosition = 'left',
    variant = 'default',
    size = 'md',
    id,
    ...props
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false)
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
    
    const baseClasses = cn(
      // Base styles
      'w-full transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900',
      
      // Size variants
      {
        'px-3 py-2 text-sm': size === 'sm',
        'px-4 py-2.5 text-base': size === 'md',
        'px-5 py-3 text-lg': size === 'lg',
      },
      
      // Variant styles
      {
        // Default variant
        'bg-gray-800/50 border border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500': variant === 'default',
        
        // Filled variant
        'bg-gray-800 border-0 text-white placeholder-gray-400 focus:bg-gray-700 focus:ring-purple-500': variant === 'filled',
        
        // Outlined variant
        'bg-transparent border-2 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500': variant === 'outlined',
      },
      
      // Error state
      { 'border-red-500 focus:border-red-500 focus:ring-red-500': error },
      
      // Icon padding
      { 'pl-10': icon && iconPosition === 'left' },
      { 'pr-10': icon && iconPosition === 'right' },
      
      className
    )
    
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {icon && iconPosition === 'left' && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            className={baseClasses}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />
          
          {icon && iconPosition === 'right' && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
        </div>
        
        {error && (
          <motion.p
            className="mt-2 text-sm text-red-400"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {error}
          </motion.p>
        )}
        
        {helperText && !error && (
          <p className="mt-2 text-sm text-gray-400">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

PlatinumInput.displayName = 'PlatinumInput'

// ==========================================================================
// PLATINUM CARD COMPONENT
// ==========================================================================

export interface PlatinumCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'platinum' | 'gold'
  elevation?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  hover?: boolean
  glow?: boolean
}

export const PlatinumCard = forwardRef<HTMLDivElement, PlatinumCardProps>(
  ({
    className,
    variant = 'default',
    elevation = 'md',
    padding = 'md',
    hover = false,
    glow = false,
    children,
    ...props
  }, ref) => {
    const baseClasses = cn(
      // Base styles
      'rounded-xl transition-all duration-300',
      
      // Padding variants
      {
        'p-0': padding === 'none',
        'p-4': padding === 'sm',
        'p-6': padding === 'md',
        'p-8': padding === 'lg',
        'p-10': padding === 'xl',
      },
      
      // Variant styles
      {
        // Default variant
        'bg-gray-900 border border-gray-800': variant === 'default',
        
        // Glass variant
        'bg-white/5 backdrop-blur-xl border border-white/10': variant === 'glass',
        
        // Platinum variant
        'bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/20': variant === 'platinum',
        
        // Gold variant
        'bg-gradient-to-br from-amber-900/20 to-yellow-900/20 border border-amber-500/20': variant === 'gold',
      },
      
      // Elevation variants
      {
        'shadow-none': elevation === 'none',
        'shadow-sm': elevation === 'sm',
        'shadow-md': elevation === 'md',
        'shadow-lg': elevation === 'lg',
        'shadow-xl': elevation === 'xl',
      },
      
      // Hover effects
      { 'hover:shadow-xl hover:scale-105': hover },
      
      // Glow effects
      { 'shadow-lg shadow-purple-500/25': glow && variant === 'platinum' },
      { 'shadow-lg shadow-amber-500/25': glow && variant === 'gold' },
      
      className
    )
    
    return (
      <motion.div
        ref={ref}
        className={baseClasses}
        whileHover={hover ? { y: -4 } : {}}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

PlatinumCard.displayName = 'PlatinumCard'

// ==========================================================================
// PLATINUM AVATAR COMPONENT
// ==========================================================================

export interface PlatinumAvatarProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string
  alt?: string
  fallback?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  variant?: 'circle' | 'square' | 'rounded'
  status?: 'online' | 'offline' | 'away' | 'busy'
  showStatus?: boolean
}

export const PlatinumAvatar = forwardRef<HTMLImageElement, PlatinumAvatarProps>(
  ({
    src,
    alt = 'Avatar',
    fallback,
    size = 'md',
    variant = 'circle',
    status = 'offline',
    showStatus = false,
    className,
    ...props
  }, ref) => {
    const [imageError, setImageError] = useState(false)
    const [imageLoaded, setImageLoaded] = useState(false)
    
    const sizeClasses = {
      xs: 'w-6 h-6 text-xs',
      sm: 'w-8 h-8 text-sm',
      md: 'w-12 h-12 text-base',
      lg: 'w-16 h-16 text-lg',
      xl: 'w-20 h-20 text-xl',
      '2xl': 'w-24 h-24 text-2xl',
    }
    
    const variantClasses = {
      circle: 'rounded-full',
      square: 'rounded-none',
      rounded: 'rounded-lg',
    }
    
    const statusColors = {
      online: 'bg-green-500',
      offline: 'bg-gray-500',
      away: 'bg-yellow-500',
      busy: 'bg-red-500',
    }
    
    const baseClasses = cn(
      'relative inline-flex items-center justify-center font-medium text-white bg-gradient-to-br from-purple-500 to-pink-500',
      sizeClasses[size],
      variantClasses[variant],
      className
    )
    
    const initials = fallback
      ? fallback
          .split(' ')
          .map(word => word.charAt(0).toUpperCase())
          .slice(0, 2)
          .join('')
      : '?'
    
    return (
      <div className={baseClasses}>
        {/* Image */}
        {src && !imageError && (
          <motion.img
            ref={ref}
            src={src}
            alt={alt}
            className={cn(
              'absolute inset-0 w-full h-full object-cover',
              variantClasses[variant]
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: imageLoaded ? 1 : 0 }}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            {...props}
          />
        )}
        
        {/* Fallback */}
        {(!src || imageError) && (
          <span className="select-none">
            {initials}
          </span>
        )}
        
        {/* Status indicator */}
        {showStatus && (
          <div
            className={cn(
              'absolute -bottom-0 -right-0 w-3 h-3 rounded-full border-2 border-gray-900',
              statusColors[status],
              {
                'w-2 h-2': size === 'xs' || size === 'sm',
                'w-3 h-3': size === 'md' || size === 'lg',
                'w-4 h-4': size === 'xl' || size === '2xl',
              }
            )}
          />
        )}
      </div>
    )
  }
)

PlatinumAvatar.displayName = 'PlatinumAvatar'

// ==========================================================================
// PLATINUM BADGE COMPONENT
// ==========================================================================

export interface PlatinumBadgeProps {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  dot?: boolean
  pulse?: boolean
  className?: string
  children?: React.ReactNode
}

export const PlatinumBadge = forwardRef<HTMLSpanElement, PlatinumBadgeProps>(
  ({
    className,
    variant = 'default',
    size = 'md',
    dot = false,
    pulse = false,
    children,
    ...props
  }, ref) => {
    const baseClasses = cn(
      // Base styles
      'inline-flex items-center justify-center font-medium',
      
      // Size variants
      {
        'px-1.5 py-0.5 text-xs': size === 'xs',
        'px-2 py-1 text-xs': size === 'sm',
        'px-2.5 py-1 text-sm': size === 'md',
        'px-3 py-1.5 text-sm': size === 'lg',
      },
      
      // Variant styles
      {
        // Default variant
        'bg-gray-800 text-gray-300 border border-gray-700': variant === 'default',
        
        // Primary variant
        'bg-purple-500/20 text-purple-300 border border-purple-500/30': variant === 'primary',
        
        // Secondary variant
        'bg-amber-500/20 text-amber-300 border border-amber-500/30': variant === 'secondary',
        
        // Success variant
        'bg-green-500/20 text-green-300 border border-green-500/30': variant === 'success',
        
        // Warning variant
        'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30': variant === 'warning',
        
        // Error variant
        'bg-red-500/20 text-red-300 border border-red-500/30': variant === 'error',
      },
      
      // Dot variant
      { 'w-2 h-2 p-0 rounded-full': dot },
      
      className
    )
    
    return (
      <motion.span
        ref={ref}
        className={baseClasses}
        whileHover={{ scale: 1.05 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        {...props}
      >
        {pulse && (
          <motion.div
            className="absolute inset-0 rounded-full bg-current opacity-75"
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
        {!dot && children}
      </motion.span>
    )
  }
)

PlatinumBadge.displayName = 'PlatinumBadge'

export default {
  PlatinumButton,
  PlatinumInput,
  PlatinumCard,
  PlatinumAvatar,
  PlatinumBadge,
}
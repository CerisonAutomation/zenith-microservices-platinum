/**
 * 🏛️ ZENITH ORACLE EXECUTIVE APEX CARD COMPONENT
 * Transcendent-grade card with mathematical precision and opulent aesthetics
 * Enterprise-grade component with atomic architecture and platinum intelligence
 */

import React, { forwardRef, HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { platinumTokens } from '@/design-system/platinum-tokens'

// Oracle-grade card variants with mathematical precision
const cardVariants = cva(
  // Base styles - atomic foundation
  [
    'rounded-xl border shadow-lg backdrop-blur-sm',
    'transition-all duration-300 ease-in-out',
    'relative overflow-hidden group',
  ],
  {
    variants: {
      variant: {
        // Platinum default - transcendent elegance
        default: [
          'bg-gradient-to-br from-neutral-900/90 via-neutral-800/90 to-neutral-900/90',
          'border-neutral-700/50 shadow-2xl shadow-black/50',
          'hover:shadow-3xl hover:shadow-purple-500/10',
          'hover:scale-[1.02] hover:-translate-y-1',
        ],
        
        // Platinum elevated - sophisticated presence
        elevated: [
          'bg-gradient-to-br from-neutral-800/95 via-neutral-700/95 to-neutral-800/95',
          'border-violet-500/30 shadow-2xl shadow-violet-500/20',
          'hover:shadow-3xl hover:shadow-violet-500/30',
          'hover:scale-[1.03] hover:-translate-y-2',
        ],
        
        // Platinum glass - ethereal transparency
        glass: [
          'bg-white/5 backdrop-blur-xl',
          'border-white/10 shadow-xl',
          'hover:bg-white/10 hover:border-white/20',
          'hover:shadow-2xl hover:shadow-white/10',
        ],
        
        // Platinum gradient - dynamic brilliance
        gradient: [
          'bg-gradient-to-br from-violet-600/20 via-purple-600/20 to-indigo-600/20',
          'border-violet-400/30 shadow-xl shadow-violet-500/20',
          'hover:from-violet-600/30 hover:via-purple-600/30 hover:to-indigo-600/30',
          'hover:shadow-2xl hover:shadow-violet-500/30',
        ],
        
        // Platinum outline - sophisticated minimalism
        outline: [
          'bg-transparent border-violet-500/50',
          'hover:bg-violet-500/10 hover:border-violet-400/70',
          'hover:shadow-lg hover:shadow-violet-500/20',
        ],
        
        // Platinum success - achievement state
        success: [
          'bg-gradient-to-br from-emerald-600/20 via-green-600/20 to-teal-600/20',
          'border-emerald-400/50 shadow-lg shadow-emerald-500/20',
          'hover:from-emerald-600/30 hover:via-green-600/30 hover:to-teal-600/30',
        ],
        
        // Platinum warning - attention state
        warning: [
          'bg-gradient-to-br from-amber-600/20 via-yellow-600/20 to-orange-600/20',
          'border-amber-400/50 shadow-lg shadow-amber-500/20',
          'hover:from-amber-600/30 hover:via-yellow-600/30 hover:to-orange-600/30',
        ],
        
        // Platinum error - critical state
        error: [
          'bg-gradient-to-br from-red-600/20 via-rose-600/20 to-pink-600/20',
          'border-red-400/50 shadow-lg shadow-red-500/20',
          'hover:from-red-600/30 hover:via-rose-600/30 hover:to-pink-600/30',
        ],
      },
      
      size: {
        // Mathematical scaling based on modular scale
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
        xl: 'p-10',
        '2xl': 'p-12',
      },
      
      // Oracle-grade interactive states
      interactive: {
        true: 'cursor-pointer hover:shadow-2xl active:scale-[0.98]',
        false: '',
      },
      
      // Platinum glow effects
      glow: {
        true: 'shadow-2xl shadow-purple-500/20',
        false: '',
      },
    },
    
    // Compound variants for transcendent combinations
    compoundVariants: [
      {
        variant: 'elevated',
        interactive: true,
        class: 'hover:shadow-3xl hover:shadow-violet-500/40',
      },
      {
        variant: 'glass',
        interactive: true,
        class: 'hover:bg-white/15 hover:backdrop-blur-2xl',
      },
    ],
    
    // Default classes
    defaultVariants: {
      variant: 'default',
      size: 'md',
      interactive: false,
      glow: false,
    },
  }
)

// Oracle-grade card interface
export interface CardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  // Enhanced interaction support
  onClick?: () => void
  // Hover elevation
  hoverElevation?: boolean
  // Platinum shimmer effect
  shimmer?: boolean
  // Corner decoration
  cornerAccent?: boolean
}

// Transcendent card component
const Card = forwardRef<HTMLDivElement, CardProps>(
  ({
    className,
    variant,
    size,
    interactive,
    glow,
    onClick,
    hoverElevation = true,
    shimmer = true,
    cornerAccent = false,
    children,
    ...props
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          cardVariants({ variant, size, interactive, glow }),
          onClick && 'cursor-pointer',
          hoverElevation && 'hover:-translate-y-1',
          className
        )}
        onClick={onClick}
        {...props}
      >
        {/* Corner accent decoration */}
        {cornerAccent && (
          <div className="absolute top-0 right-0 w-8 h-8 overflow-hidden">
            <div className="absolute top-0 right-0 w-4 h-4 bg-gradient-to-br from-violet-400 to-transparent transform rotate-45 translate-x-2" />
          </div>
        )}
        
        {/* Platinum shimmer effect */}
        {shimmer && (
          <div className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
          </div>
        )}
        
        {/* Platinum glow overlay */}
        {variant === 'elevated' && (
          <div className="absolute inset-0 bg-gradient-to-t from-violet-500/5 to-transparent pointer-events-none" />
        )}
        
        {/* Card content */}
        <div className="relative z-10">
          {children}
        </div>
        
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

Card.displayName = 'OracleExecutiveApexCard'

// Card Header Component
const CardHeader = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex flex-col space-y-1.5 pb-6 border-b border-neutral-700/50',
      className
    )}
    {...props}
  />
))
CardHeader.displayName = 'OracleExecutiveApexCardHeader'

// Card Title Component
const CardTitle = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-2xl font-semibold leading-none tracking-tight text-neutral-100',
      className
    )}
    {...props}
  />
))
CardTitle.displayName = 'OracleExecutiveApexCardTitle'

// Card Description Component
const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      'text-sm text-neutral-400 leading-relaxed',
      className
    )}
    {...props}
  />
))
CardDescription.displayName = 'OracleExecutiveApexCardDescription'

// Card Content Component
const CardContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('pt-6', className)}
    {...props}
  />
))
CardContent.displayName = 'OracleExecutiveApexCardContent'

// Card Footer Component
const CardFooter = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex items-center pt-6 border-t border-neutral-700/50',
      className
    )}
    {...props}
  />
))
CardFooter.displayName = 'OracleExecutiveApexCardFooter'

export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent,
  cardVariants 
}
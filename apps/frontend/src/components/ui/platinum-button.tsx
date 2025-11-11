/**
 * 🏛️ ZENITH ORACLE EXECUTIVE APEX BUTTON COMPONENT
 * Transcendent-grade button with mathematical precision and opulent interactions
 * Enterprise-grade component with atomic architecture and platinum aesthetics
 */

import React, { forwardRef, ButtonHTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { platinumTokens } from '@/design-system/platinum-tokens'

// Oracle-grade button variants with mathematical precision
const buttonVariants = cva(
  // Base styles - atomic foundation
  [
    'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium',
    'transition-all duration-200 ease-in-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'relative overflow-hidden group',
  ],
  {
    variants: {
      variant: {
        // Platinum primary - transcendent gradient
        primary: [
          'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600',
          'text-white shadow-lg shadow-purple-500/25',
          'hover:shadow-xl hover:shadow-purple-500/40',
          'hover:scale-[1.02] active:scale-[0.98]',
          'before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent',
          'before:translate-x-[-100%] before:transition-transform before:duration-700',
          'hover:before:translate-x-[100%]',
        ],
        
        // Platinum secondary - opulent elegance
        secondary: [
          'bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500',
          'text-neutral-900 shadow-lg shadow-amber-500/25',
          'hover:shadow-xl hover:shadow-amber-500/40',
          'hover:scale-[1.02] active:scale-[0.98]',
        ],
        
        // Platinum outline - sophisticated minimalism
        outline: [
          'border border-violet-500/50 bg-transparent',
          'text-violet-400 hover:text-violet-300',
          'hover:bg-violet-500/10 hover:border-violet-400/70',
          'backdrop-blur-sm',
        ],
        
        // Platinum ghost - ethereal presence
        ghost: [
          'bg-transparent text-neutral-300',
          'hover:bg-neutral-800/50 hover:text-neutral-100',
          'hover:backdrop-blur-sm',
        ],
        
        // Platinum destructive - controlled power
        destructive: [
          'bg-gradient-to-r from-red-600 via-rose-600 to-pink-600',
          'text-white shadow-lg shadow-red-500/25',
          'hover:shadow-xl hover:shadow-red-500/40',
          'hover:scale-[1.02] active:scale-[0.98]',
        ],
        
        // Oracle-grade link - intelligent connection
        link: [
          'text-violet-400 underline-offset-4',
          'hover:underline hover:text-violet-300',
          'p-0 h-auto font-normal',
        ],
      },
      
      size: {
        // Mathematical scaling based on golden ratio
        xs: 'h-8 px-3 text-xs',
        sm: 'h-9 px-4 text-sm',
        md: 'h-10 px-6 text-base',
        lg: 'h-12 px-8 text-lg',
        xl: 'h-14 px-10 text-xl',
        '2xl': 'h-16 px-12 text-2xl',
      },
      
      // Oracle-grade states
      state: {
        default: '',
        loading: 'cursor-not-allowed opacity-70',
        success: 'bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600',
        warning: 'bg-gradient-to-r from-amber-600 via-yellow-600 to-orange-600',
        error: 'bg-gradient-to-r from-red-600 via-rose-600 to-pink-600',
      },
    },
    
    // Compound variants for transcendent combinations
    compoundVariants: [
      {
        variant: 'primary',
        size: 'lg',
        class: 'text-lg font-semibold',
      },
      {
        variant: 'secondary',
        size: 'lg',
        class: 'text-lg font-semibold',
      },
    ],
    
    // Default classes
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      state: 'default',
    },
  }
)

// Oracle-grade button interface
export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  // Enhanced loading state
  loading?: boolean
  // Loading text
  loadingText?: string
  // Success state
  success?: boolean
  // Icon support
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  // Platinum ripple effect
  ripple?: boolean
}

// Transcendent button component
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant,
    size,
    state,
    loading = false,
    loadingText,
    success = false,
    leftIcon,
    rightIcon,
    ripple = true,
    children,
    disabled,
    onClick,
    ...props
  }, ref) => {
    // Determine actual state
    const actualState = loading ? 'loading' : success ? 'success' : state
    
    // Handle ripple effect
    const createRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (!ripple || loading || disabled) return
      
      const button = event.currentTarget
      const rect = button.getBoundingClientRect()
      const size = Math.max(rect.width, rect.height)
      const x = event.clientX - rect.left - size / 2
      const y = event.clientY - rect.top - size / 2
      
      const rippleElement = document.createElement('span')
      rippleElement.className = 'absolute rounded-full bg-white/30 animate-ping'
      rippleElement.style.width = rippleElement.style.height = size + 'px'
      rippleElement.style.left = x + 'px'
      rippleElement.style.top = y + 'px'
      rippleElement.style.transform = 'scale(0)'
      rippleElement.style.animation = 'ripple 0.6s ease-out'
      
      button.appendChild(rippleElement)
      
      setTimeout(() => {
        rippleElement.remove()
      }, 600)
    }
    
    return (
      <button
        className={cn(buttonVariants({ variant, size, state: actualState }), className)}
        ref={ref}
        disabled={disabled || loading}
        onClick={createRipple}
        {...props}
      >
        {/* Loading state */}
        {loading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        
        {/* Left icon */}
        {leftIcon && !loading && (
          <span className="mr-2">{leftIcon}</span>
        )}
        
        {/* Button content */}
        <span className="relative z-10">
          {loading && loadingText ? loadingText : children}
        </span>
        
        {/* Right icon */}
        {rightIcon && !loading && (
          <span className="ml-2">{rightIcon}</span>
        )}
        
        {/* Platinum shimmer effect */}
        <div className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
        </div>
        
        {/* Styles for ripple animation */}
        <style jsx>{`
          @keyframes ripple {
            to {
              transform: scale(4);
              opacity: 0;
            }
          }
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
      </button>
    )
  }
)

Button.displayName = 'OracleExecutiveApexButton'

export { Button, buttonVariants }
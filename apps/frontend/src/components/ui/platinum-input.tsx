/**
 * 🏛️ ZENITH ORACLE EXECUTIVE APEX INPUT COMPONENT
 * Transcendent-grade input with mathematical precision and opulent interactions
 * Enterprise-grade component with atomic architecture and platinum intelligence
 */

import React, { forwardRef, useState, useCallback } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { platinumTokens } from '@/design-system/platinum-tokens'
import { Eye, EyeOff, AlertCircle, CheckCircle, Info } from 'lucide-react'

// Oracle-grade input variants with mathematical precision
const inputVariants = cva(
  // Base styles - atomic foundation
  [
    'flex w-full rounded-md border px-3 py-2 text-sm placeholder:text-neutral-500',
    'transition-all duration-200 ease-in-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'file:border-0 file:bg-transparent file:text-sm file:font-medium',
    'relative bg-transparent',
  ],
  {
    variants: {
      variant: {
        // Platinum default - transcendent elegance
        default: [
          'border-neutral-700 bg-neutral-800/50 text-neutral-100',
          'focus:border-violet-500 focus:ring-violet-500/20',
          'hover:border-neutral-600',
          'backdrop-blur-sm',
        ],
        
        // Platinum elevated - sophisticated presence
        elevated: [
          'border-violet-500/30 bg-gradient-to-r from-violet-500/10 to-purple-500/10 text-neutral-100',
          'focus:border-violet-400 focus:ring-violet-400/30',
          'hover:border-violet-400/50',
          'shadow-lg shadow-violet-500/10',
        ],
        
        // Platinum glass - ethereal transparency
        glass: [
          'border-white/20 bg-white/5 text-neutral-100',
          'focus:border-white/40 focus:ring-white/20',
          'hover:border-white/30',
          'backdrop-blur-xl',
        ],
        
        // Platinum outline - sophisticated minimalism
        outline: [
          'border-violet-500/50 bg-transparent text-neutral-100',
          'focus:border-violet-400 focus:ring-violet-400/20',
          'hover:border-violet-400/70',
        ],
        
        // Platinum success - achievement state
        success: [
          'border-emerald-500/50 bg-emerald-500/10 text-neutral-100',
          'focus:border-emerald-400 focus:ring-emerald-400/20',
          'hover:border-emerald-400/70',
        ],
        
        // Platinum warning - attention state
        warning: [
          'border-amber-500/50 bg-amber-500/10 text-neutral-100',
          'focus:border-amber-400 focus:ring-amber-400/20',
          'hover:border-amber-400/70',
        ],
        
        // Platinum error - critical state
        error: [
          'border-red-500/50 bg-red-500/10 text-neutral-100',
          'focus:border-red-400 focus:ring-red-400/20',
          'hover:border-red-400/70',
        ],
      },
      
      size: {
        // Mathematical scaling based on modular scale
        sm: 'h-9 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        xl: 'h-14 px-8 text-lg',
        '2xl': 'h-16 px-10 text-xl',
      },
      
      // Oracle-grade states
      state: {
        default: '',
        loading: 'cursor-wait opacity-70',
        success: 'border-emerald-500 bg-emerald-500/10',
        error: 'border-red-500 bg-red-500/10',
        warning: 'border-amber-500 bg-amber-500/10',
      },
    },
    
    // Compound variants for transcendent combinations
    compoundVariants: [
      {
        variant: 'elevated',
        size: 'lg',
        class: 'text-lg shadow-xl shadow-violet-500/20',
      },
      {
        variant: 'glass',
        size: 'lg',
        class: 'backdrop-blur-2xl',
      },
    ],
    
    // Default classes
    defaultVariants: {
      variant: 'default',
      size: 'md',
      state: 'default',
    },
  }
)

// Oracle-grade input interface
export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  // Enhanced validation states
  error?: boolean
  success?: boolean
  warning?: boolean
  // Helper text
  helperText?: string
  // Loading state
  loading?: boolean
  // Icon support
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  // Password visibility
  showPasswordToggle?: boolean
  // Character counter
  showCharCount?: boolean
  maxLength?: number
  // Platinum shimmer effect
  shimmer?: boolean
}

// Transcendent input component
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    variant,
    size,
    state,
    error,
    success,
    warning,
    helperText,
    loading = false,
    leftIcon,
    rightIcon,
    showPasswordToggle = false,
    showCharCount = false,
    maxLength,
    shimmer = true,
    type,
    value,
    onChange,
    ...props
  }, ref) => {
    // Internal state for password visibility
    const [showPassword, setShowPassword] = useState(false)
    const [isFocused, setIsFocused] = useState(false)
    
    // Determine actual state
    const actualState = loading ? 'loading' : 
                       error ? 'error' : 
                       success ? 'success' : 
                       warning ? 'warning' : state
    
    // Handle password visibility toggle
    const togglePasswordVisibility = useCallback(() => {
      setShowPassword(prev => !prev)
    }, [])
    
    // Determine input type
    const inputType = type === 'password' && showPassword ? 'text' : type
    
    // Calculate character count
    const charCount = typeof value === 'string' ? value.length : 0
    const charCountValid = maxLength ? charCount <= maxLength : true
    
    // Get status icon
    const getStatusIcon = () => {
      if (error) return <AlertCircle className="h-4 w-4 text-red-400" />
      if (success) return <CheckCircle className="h-4 w-4 text-emerald-400" />
      if (warning) return <Info className="h-4 w-4 text-amber-400" />
      return null
    }
    
    return (
      <div className="space-y-2">
        {/* Input container */}
        <div className="relative">
          {/* Left icon */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400">
              {leftIcon}
            </div>
          )}
          
          {/* Main input */}
          <input
            type={inputType}
            className={cn(
              inputVariants({ variant, size, state: actualState }),
              leftIcon && 'pl-10',
              (rightIcon || showPasswordToggle || getStatusIcon()) && 'pr-10',
              isFocused && 'scale-[1.01]',
              className
            )}
            ref={ref}
            value={value}
            onChange={onChange}
            onFocus={(e) => {
              setIsFocused(true)
              props.onFocus?.(e)
            }}
            onBlur={(e) => {
              setIsFocused(false)
              props.onBlur?.(e)
            }}
            maxLength={maxLength}
            {...props}
          />
          
          {/* Right side icons */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
            {/* Status icon */}
            {getStatusIcon()}
            
            {/* Password toggle */}
            {showPasswordToggle && type === 'password' && (
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="text-neutral-400 hover:text-neutral-200 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            )}
            
            {/* Custom right icon */}
            {rightIcon && !showPasswordToggle && (
              <div className="text-neutral-400">
                {rightIcon}
              </div>
            )}
          </div>
          
          {/* Platinum shimmer effect */}
          {shimmer && isFocused && (
            <div className="absolute inset-0 -z-10 opacity-30">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-violet-400/20 to-transparent animate-shimmer" />
            </div>
          )}
          
          {/* Focus ring */}
          {isFocused && (
            <div className="absolute inset-0 -z-10 rounded-md">
              <div className="absolute inset-0 rounded-md shadow-lg shadow-violet-500/20" />
            </div>
          )}
        </div>
        
        {/* Helper text and character count */}
        {(helperText || showCharCount) && (
          <div className="flex items-center justify-between text-xs">
            {/* Helper text */}
            {helperText && (
              <p className={cn(
                'flex items-center space-x-1',
                error && 'text-red-400',
                success && 'text-emerald-400',
                warning && 'text-amber-400',
                !error && !success && !warning && 'text-neutral-400'
              )}>
                {getStatusIcon()}
                <span>{helperText}</span>
              </p>
            )}
            
            {/* Character count */}
            {showCharCount && maxLength && (
              <p className={cn(
                'text-xs',
                charCountValid ? 'text-neutral-400' : 'text-red-400'
              )}>
                {charCount}/{maxLength}
              </p>
            )}
          </div>
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

Input.displayName = 'OracleExecutiveApexInput'

export { Input, inputVariants }
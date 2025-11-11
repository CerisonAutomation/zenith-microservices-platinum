/**
 * 🏛️ ZENITH ORACLE EXECUTIVE APEX AUTHENTICATION FLOW
 * Transcendent-grade authentication with mathematical precision and opulent security
 * Enterprise-grade auth system with atomic architecture and platinum intelligence
 */

import React, { useState, useCallback, useEffect, forwardRef } from 'react'
import { Button } from '@/components/ui/platinum-button'
import { Input } from '@/components/ui/platinum-input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/platinum-card'
import { Avatar } from '@/components/ui/platinum-avatar'
import { cn } from '@/lib/utils'
import { platinumTokens } from '@/design-system/platinum-tokens'
import { 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  Shield, 
  CheckCircle, 
  AlertCircle,
  Chrome,
  Apple,
  Facebook,
  Sparkles,
  Crown,
  Heart
} from 'lucide-react'

// Simple validation functions
const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
const validatePassword = (password: string) => password.length >= 8
const validateName = (name: string) => name.length >= 2

// Form data types
interface LoginFormData {
  email: string
  password: string
  rememberMe?: boolean
}

interface RegisterFormData {
  name: string
  email: string
  password: string
  confirmPassword: string
  agreeToTerms: boolean
}

interface ResetPasswordFormData {
  email: string
}

// Form state hook
const useForm = <T extends Record<string, any>>(initialValues: T) => {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})
  
  const setValue = (field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }))
    // Clear error for this field when value changes
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }
  
  const setError = (field: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }))
  }
  
  const clearErrors = () => setErrors({})
  
  const validate = () => {
    const newErrors: any = {}
    
    if ('email' in values && !validateEmail(values.email)) {
      newErrors.email = 'Invalid email address'
    }
    
    if ('password' in values && !validatePassword(values.password)) {
      newErrors.password = 'Password must be at least 8 characters'
    }
    
    if ('name' in values && !validateName(values.name)) {
      newErrors.name = 'Name must be at least 2 characters'
    }
    
    if ('confirmPassword' in values && values.password !== values.confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match"
    }
    
    if ('agreeToTerms' in values && !values.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleSubmit = (onSubmit: (data: T) => void) => (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      onSubmit(values)
    }
  }
  
  const register = (field: keyof T, options?: any) => ({
    name: field,
    value: String(values[field]) || '',
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setValue(field, e.target.value),
    onBlur: () => {
      // Validate on blur
      if (field === 'email' && !validateEmail(String(values[field]))) {
        setError(field, 'Invalid email address')
      } else if (field === 'password' && !validatePassword(String(values[field]))) {
        setError(field, 'Password must be at least 8 characters')
      } else if (field === 'name' && !validateName(String(values[field]))) {
        setError(field, 'Name must be at least 2 characters')
      }
    }
  })
  
  const formState = { errors }
  
  return {
    values,
    errors,
    formState,
    setValue,
    setError,
    clearErrors,
    validate,
    handleSubmit,
    register
  }
}

// Oracle-grade auth interface
export interface AuthFlowProps {
  // Initial view
  initialView?: 'login' | 'register' | 'reset'
  // Callbacks
  onSuccess?: (user: any) => void
  onError?: (error: Error) => void
  // OAuth providers
  oauthProviders?: {
    google?: boolean
    apple?: boolean
    facebook?: boolean
  }
  // Platinum aesthetics
  showBranding?: boolean
  showSocialProof?: boolean
  animations?: boolean
}

// Transcendent authentication flow component
const AuthFlow = forwardRef<HTMLDivElement, AuthFlowProps>(
  ({
    initialView = 'login',
    onSuccess,
    onError,
    oauthProviders = { google: true, apple: true, facebook: true },
    showBranding = true,
    showSocialProof = true,
    animations = true,
    ...props
  }, ref) => {
    // State management
    const [currentView, setCurrentView] = useState<'login' | 'register' | 'reset'>(initialView)
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [passwordStrength, setPasswordStrength] = useState(0)
    
    // Form management
    const loginForm = useForm<LoginFormData>({
      email: '',
      password: '',
      rememberMe: false
    })
    
    const registerForm = useForm<RegisterFormData>({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false
    })
    
    const resetPasswordForm = useForm<{ email: string }>({
      email: ''
    })
    
    // Password strength calculation
    const calculatePasswordStrength = useCallback((password: string) => {
      let strength = 0
      if (password.length >= 8) strength += 25
      if (password.length >= 12) strength += 25
      if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25
      if (/\d/.test(password)) strength += 12.5
      if (/[^a-zA-Z\d]/.test(password)) strength += 12.5
      return Math.min(strength, 100)
    }, [])
    
    // Handle password change
    const handlePasswordChange = useCallback((password: string) => {
      const strength = calculatePasswordStrength(password)
      setPasswordStrength(strength)
    }, [calculatePasswordStrength])
    
    // Handle form submissions
    const handleLogin = useCallback(async (data: LoginFormData) => {
      setIsLoading(true)
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Simulate successful login
        const user = {
          id: '1',
          email: data.email,
          name: 'Zenith User',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zenith',
        }
        
        onSuccess?.(user)
      } catch (error) {
        onError?.(error as Error)
      } finally {
        setIsLoading(false)
      }
    }, [onSuccess, onError])
    
    const handleRegister = useCallback(async (data: RegisterFormData) => {
      setIsLoading(true)
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Simulate successful registration
        const user = {
          id: '1',
          email: data.email,
          name: data.name,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.email}`,
        }
        
        onSuccess?.(user)
      } catch (error) {
        onError?.(error as Error)
      } finally {
        setIsLoading(false)
      }
    }, [onSuccess, onError])
    
    const handleResetPassword = useCallback(async (data: ResetPasswordFormData) => {
      setIsLoading(true)
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Show success message
        setCurrentView('login')
      } catch (error) {
        onError?.(error as Error)
      } finally {
        setIsLoading(false)
      }
    }, [onSuccess, onError])
    
    // Handle OAuth authentication
    const handleOAuth = useCallback(async (provider: string) => {
      setIsLoading(true)
      try {
        // Simulate OAuth flow
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // Simulate successful OAuth
        const user = {
          id: '1',
          email: `user@${provider}.com`,
          name: `${provider} User`,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${provider}`,
        }
        
        onSuccess?.(user)
      } catch (error) {
        onError?.(error as Error)
      } finally {
        setIsLoading(false)
      }
    }, [onSuccess, onError])
    
    // Social proof data
    const socialProof = [
      { name: 'Sarah Chen', text: 'Found my soulmate in just 2 weeks!', avatar: 'sarah' },
      { name: 'Michael Rodriguez', text: 'Best dating app I\'ve ever used!', avatar: 'michael' },
      { name: 'Emma Thompson', text: 'The AI matching is incredibly accurate!', avatar: 'emma' },
    ]
    
    return (
      <div
        ref={ref}
        className={cn(
          'min-h-screen flex items-center justify-center p-4',
          'bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950',
          animations && 'animate-fade-in'
        )}
        {...props}
      >
        {/* Platinum background effects */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-500" />
        </div>
        
        {/* Main auth container */}
        <div className="w-full max-w-md">
          {/* Branding */}
          {showBranding && (
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <div className="h-12 w-12 bg-gradient-to-br from-violet-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/25">
                  <Crown className="h-6 w-6 text-white" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Zenith</h1>
              <p className="text-neutral-400">Where elite connections begin</p>
            </div>
          )}
          
          {/* Auth card */}
          <Card variant="elevated" size="lg" className="backdrop-blur-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-white">
                {currentView === 'login' && 'Welcome Back'}
                {currentView === 'register' && 'Join Zenith'}
                {currentView === 'reset' && 'Reset Password'}
              </CardTitle>
              <CardDescription className="text-neutral-400">
                {currentView === 'login' && 'Sign in to your account to continue'}
                {currentView === 'register' && 'Create your account to start your journey'}
                {currentView === 'reset' && 'Enter your email to receive reset instructions'}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Login form */}
              {currentView === 'login' && (
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                  <Input
                    variant="elevated"
                    size="lg"
                    type="email"
                    placeholder="Enter your email"
                    leftIcon={<Mail className="h-4 w-4" />}
                    {...loginForm.register('email')}
                    error={!!loginForm.formState.errors.email}
                    helperText={loginForm.errors.email}
                  />
                  
                  <Input
                    variant="elevated"
                    size="lg"
                    type="password"
                    placeholder="Enter your password"
                    leftIcon={<Lock className="h-4 w-4" />}
                    showPasswordToggle
                    {...loginForm.register('password')}
                    error={!!loginForm.formState.errors.password}
                    helperText={loginForm.errors.password}
                  />
                  
                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-2 text-sm text-neutral-400">
                      <input
                        type="checkbox"
                        {...loginForm.register('rememberMe')}
                        className="rounded border-neutral-600 bg-neutral-800 text-violet-600 focus:ring-violet-500"
                      />
                      <span>Remember me</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setCurrentView('reset')}
                      className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  
                  <Button
                    variant="primary"
                    size="lg"
                    type="submit"
                    loading={isLoading}
                    loadingText="Signing in..."
                    className="w-full"
                  >
                    Sign In
                  </Button>
                </form>
              )}
              
              {/* Register form */}
              {currentView === 'register' && (
                <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                  <Input
                    variant="elevated"
                    size="lg"
                    placeholder="Enter your name"
                    leftIcon={<User className="h-4 w-4" />}
                    {...registerForm.register('name')}
                    error={!!registerForm.formState.errors.name}
                    helperText={registerForm.errors.name}
                  />
                  
                  <Input
                    variant="elevated"
                    size="lg"
                    type="email"
                    placeholder="Enter your email"
                    leftIcon={<Mail className="h-4 w-4" />}
                    {...registerForm.register('email')}
                    error={!!registerForm.errors.email}
                    helperText={registerForm.errors.email}
                  />
                  
                  <Input
                    variant="elevated"
                    size="lg"
                    type="password"
                    placeholder="Create a password"
                    leftIcon={<Lock className="h-4 w-4" />}
                    showPasswordToggle
                    showCharCount
                    maxLength={32}
                    {...registerForm.register('password', {
                      onChange: (e: React.ChangeEvent<HTMLInputElement>) => handlePasswordChange(e.target.value)
                    })}
                    error={!!registerForm.errors.password}
                    helperText={registerForm.errors.password}
                  />
                  
                  {/* Password strength indicator */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-400">Password strength</span>
                      <span className={cn(
                        passwordStrength < 33 && 'text-red-400',
                        passwordStrength >= 33 && passwordStrength < 66 && 'text-amber-400',
                        passwordStrength >= 66 && 'text-emerald-400'
                      )}>
                        {passwordStrength < 33 && 'Weak'}
                        {passwordStrength >= 33 && passwordStrength < 66 && 'Medium'}
                        {passwordStrength >= 66 && 'Strong'}
                      </span>
                    </div>
                    <div className="h-2 bg-neutral-700 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full transition-all duration-300',
                          passwordStrength < 33 && 'bg-red-500',
                          passwordStrength >= 33 && passwordStrength < 66 && 'bg-amber-500',
                          passwordStrength >= 66 && 'bg-emerald-500'
                        )}
                        style={{ width: `${passwordStrength}%` }}
                      />
                    </div>
                  </div>
                  
                  <Input
                    variant="elevated"
                    size="lg"
                    type="password"
                    placeholder="Confirm your password"
                    leftIcon={<Lock className="h-4 w-4" />}
                    showPasswordToggle
                    {...registerForm.register('confirmPassword')}
                    error={!!registerForm.errors.confirmPassword}
                    helperText={registerForm.errors.confirmPassword}
                  />
                  
                  <label className="flex items-start space-x-2 text-sm text-neutral-400">
                    <input
                      type="checkbox"
                      {...registerForm.register('agreeToTerms')}
                      className="mt-1 rounded border-neutral-600 bg-neutral-800 text-violet-600 focus:ring-violet-500"
                    />
                    <span>
                      I agree to the{' '}
                      <a href="/terms" className="text-violet-400 hover:text-violet-300 transition-colors">
                        Terms of Service
                      </a>{' '}
                      and{' '}
                      <a href="/privacy" className="text-violet-400 hover:text-violet-300 transition-colors">
                        Privacy Policy
                      </a>
                    </span>
                  </label>
                  
                  {registerForm.formState.errors.agreeToTerms && (
                    <p className="text-sm text-red-400 flex items-center space-x-1">
                      <AlertCircle className="h-4 w-4" />
                      <span>{registerForm.errors.agreeToTerms}</span>
                    </p>
                  )}
                  
                  <Button
                    variant="primary"
                    size="lg"
                    type="submit"
                    loading={isLoading}
                    loadingText="Creating account..."
                    className="w-full"
                  >
                    Create Account
                  </Button>
                </form>
              )}
              
              {/* Reset password form */}
              {currentView === 'reset' && (
                <form onSubmit={resetPasswordForm.handleSubmit(handleResetPassword)} className="space-y-4">
                  <Input
                    variant="elevated"
                    size="lg"
                    type="email"
                    placeholder="Enter your email address"
                    leftIcon={<Mail className="h-4 w-4" />}
                    {...resetPasswordForm.register('email')}
                    error={!!resetPasswordForm.errors.email}
                    helperText={resetPasswordForm.errors.email}
                  />
                  
                  <Button
                    variant="primary"
                    size="lg"
                    type="submit"
                    loading={isLoading}
                    loadingText="Sending reset link..."
                    className="w-full"
                  >
                    Send Reset Link
                  </Button>
                </form>
              )}
              
              {/* OAuth providers */}
              {(oauthProviders.google || oauthProviders.apple || oauthProviders.facebook) && (
                <div className="space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-neutral-700" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-transparent text-neutral-400">Or continue with</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    {oauthProviders.google && (
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => handleOAuth('google')}
                        loading={isLoading}
                        className="w-full"
                      >
                        <Chrome className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {oauthProviders.apple && (
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => handleOAuth('apple')}
                        loading={isLoading}
                        className="w-full"
                      >
                        <Apple className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {oauthProviders.facebook && (
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => handleOAuth('facebook')}
                        loading={isLoading}
                        className="w-full"
                      >
                        <Facebook className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
              
              {/* View switcher */}
              <div className="text-center text-sm text-neutral-400">
                {currentView === 'login' && (
                  <span>
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setCurrentView('register')}
                      className="text-violet-400 hover:text-violet-300 transition-colors font-medium"
                    >
                      Sign up
                    </button>
                  </span>
                )}
                
                {currentView === 'register' && (
                  <span>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setCurrentView('login')}
                      className="text-violet-400 hover:text-violet-300 transition-colors font-medium"
                    >
                      Sign in
                    </button>
                  </span>
                )}
                
                {currentView === 'reset' && (
                  <span>
                    Remember your password?{' '}
                    <button
                      type="button"
                      onClick={() => setCurrentView('login')}
                      className="text-violet-400 hover:text-violet-300 transition-colors font-medium"
                    >
                      Sign in
                    </button>
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Social proof */}
          {showSocialProof && currentView === 'login' && (
            <div className="mt-8 text-center">
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-2">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  <span className="text-sm text-neutral-400">Join 50,000+ happy couples</span>
                  <Sparkles className="h-4 w-4 text-amber-400" />
                </div>
                
                <div className="space-y-3">
                  {socialProof.map((proof, index) => (
                    <div key={index} className="flex items-center space-x-3 text-sm text-neutral-300">
                      <Avatar
                        size="sm"
                        variant="elevated"
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${proof.avatar}`}
                        fallback={proof.name}
                      />
                      <div className="text-left">
                        <p className="font-medium">{proof.name}</p>
                        <p className="text-xs text-neutral-400">{proof.text}</p>
                      </div>
                      <Heart className="h-4 w-4 text-red-400 ml-auto" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Animation styles */}
        <style jsx>{`
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fade-in 0.8s ease-out;
          }
        `}</style>
      </div>
    )
  }
)

AuthFlow.displayName = 'OracleExecutiveApexAuthFlow'

export { AuthFlow }
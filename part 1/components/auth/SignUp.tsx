/**
 * 🔐 Sign Up Page
 * Zenith Oracle Executive Apex - PKCE Flow Implementation
 *
 * Features:
 * - Email/password registration with PKCE
 * - User profile metadata collection
 * - Email verification flow
 * - OAuth providers integration
 * - Form validation and error handling
 * - Terms and privacy policy acceptance
 *
 * @see https://supabase.com/docs/guides/auth/auth-pkce
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { ErrorTracker, UserAnalytics } from '@/lib/observability';

const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  acceptTerms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
  acceptPrivacy: z.boolean().refine(val => val === true, 'You must accept the privacy policy'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignUpForm = z.infer<typeof signUpSchema>;

export default function SignUp() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const { signUp, signInWithOAuth } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
  } = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
  });

  const acceptTerms = watch('acceptTerms');
  const acceptPrivacy = watch('acceptPrivacy');

  const onSubmit = async (data: SignUpForm) => {
    setIsLoading(true);
    try {
      const metadata = {
        first_name: data.firstName,
        last_name: data.lastName,
        full_name: `${data.firstName} ${data.lastName}`,
      };

      await signUp(data.email, data.password, metadata);
      UserAnalytics.trackEvent('sign_up_attempt', {
        method: 'email',
        success: true,
      });
      // Note: User will be redirected to email verification
    } catch (error) {
      UserAnalytics.trackEvent('sign_up_attempt', {
        method: 'email',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      setError('root', {
        message: error instanceof Error ? error.message : 'Sign up failed',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'facebook' | 'apple' | 'github') => {
    setOauthLoading(provider);
    try {
      await signInWithOAuth(provider);
      UserAnalytics.trackEvent('oauth_sign_up_initiated', {
        provider,
      });
    } catch (error) {
      ErrorTracker.trackError(error as Error, { context: 'oauth_sign_up', provider });
      setOauthLoading(null);
    }
  };

  const oauthProviders = [
    { id: 'google', name: 'Google', icon: '🌐' },
    { id: 'facebook', name: 'Facebook', icon: '📘' },
    { id: 'apple', name: 'Apple', icon: '🍎' },
    { id: 'github', name: 'GitHub', icon: '🐙' },
  ] as const;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 p-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Create Account
          </CardTitle>
          <CardDescription className="text-lg">
            Join our dating community today
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* OAuth Providers */}
          <div className="space-y-3">
            {oauthProviders.map((provider) => (
              <Button
                key={provider.id}
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleOAuthSignIn(provider.id)}
                disabled={!!oauthLoading}
              >
                {oauthLoading === provider.id ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <span className="mr-2">{provider.icon}</span>
                )}
                Sign up with {provider.name}
              </Button>
            ))}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or create account with email
              </span>
            </div>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  {...register('firstName')}
                  disabled={isLoading}
                />
                {errors.firstName && (
                  <p className="text-sm text-red-500">{errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  {...register('lastName')}
                  disabled={isLoading}
                />
                {errors.lastName && (
                  <p className="text-sm text-red-500">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                {...register('email')}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  {...register('password')}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  {...register('confirmPassword')}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Terms and Privacy */}
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="acceptTerms"
                  {...register('acceptTerms')}
                  disabled={isLoading}
                  className="mt-0.5"
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="acceptTerms"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I agree to the{' '}
                    <Link to="/terms" className="text-purple-600 hover:text-purple-500 underline">
                      Terms of Service
                    </Link>
                  </label>
                  {errors.acceptTerms && (
                    <p className="text-sm text-red-500">{errors.acceptTerms.message}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="acceptPrivacy"
                  {...register('acceptPrivacy')}
                  disabled={isLoading}
                  className="mt-0.5"
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="acceptPrivacy"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I agree to the{' '}
                    <Link to="/privacy" className="text-purple-600 hover:text-purple-500 underline">
                      Privacy Policy
                    </Link>
                  </label>
                  {errors.acceptPrivacy && (
                    <p className="text-sm text-red-500">{errors.acceptPrivacy.message}</p>
                  )}
                </div>
              </div>
            </div>

            {errors.root && (
              <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
                {errors.root.message}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !acceptTerms || !acceptPrivacy}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          {/* Links */}
          <div className="text-center">
            <div className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link
                to="/auth/signin"
                className="text-purple-600 hover:text-purple-500 font-medium"
              >
                Sign in
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
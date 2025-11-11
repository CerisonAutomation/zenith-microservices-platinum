/**
 * 🔐 Sign In Page
 * Zenith Oracle Executive Apex - PKCE Flow Implementation
 *
 * Features:
 * - Email/password authentication with PKCE
 * - OAuth providers (Google, Facebook, Apple, GitHub)
 * - Password reset functionality
 * - Form validation and error handling
 * - Responsive design with loading states
 *
 * @see https://supabase.com/docs/guides/auth/auth-pkce
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { ErrorTracker, UserAnalytics } from '@/lib/observability';

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type SignInForm = z.infer<typeof signInSchema>;

export default function SignIn() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const navigate = useNavigate();
  const { signIn, signInWithOAuth } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (data: SignInForm) => {
    setIsLoading(true);
    try {
      await signIn(data.email, data.password);
      UserAnalytics.trackEvent('sign_in_attempt', {
        method: 'password',
        success: true,
      });
      navigate('/');
    } catch (error) {
      UserAnalytics.trackEvent('sign_in_attempt', {
        method: 'password',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      setError('root', {
        message: error instanceof Error ? error.message : 'Sign in failed',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'facebook' | 'apple' | 'github') => {
    setOauthLoading(provider);
    try {
      await signInWithOAuth(provider);
      UserAnalytics.trackEvent('oauth_sign_in_initiated', {
        provider,
      });
    } catch (error) {
      ErrorTracker.trackError(error as Error, { context: 'oauth_sign_in', provider });
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-lg">
            Sign in to your account to continue
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
                Continue with {provider.name}
              </Button>
            ))}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
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
                  placeholder="Enter your password"
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

            {errors.root && (
              <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
                {errors.root.message}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Links */}
          <div className="text-center space-y-2">
            <Link
              to="/auth/forgot-password"
              className="text-sm text-purple-600 hover:text-purple-500"
            >
              Forgot your password?
            </Link>
            <div className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link
                to="/auth/signup"
                className="text-purple-600 hover:text-purple-500 font-medium"
              >
                Sign up
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
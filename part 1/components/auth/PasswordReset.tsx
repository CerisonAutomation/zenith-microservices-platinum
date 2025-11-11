/**
 * 🔐 Password Reset Page
 * Zenith Oracle Executive Apex - Secure Password Recovery
 *
 * Features:
 * - Email-based password reset requests
 * - Secure token validation
 * - New password setting with validation
 * - Rate limiting and security measures
 * - User-friendly error handling
 *
 * @see https://supabase.com/docs/guides/auth/auth-password-reset
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ErrorTracker, UserAnalytics } from '@/lib/observability';

const requestResetSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const setPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RequestResetForm = z.infer<typeof requestResetSchema>;
type SetPasswordForm = z.infer<typeof setPasswordSchema>;

export default function PasswordReset() {
  const [mode, setMode] = useState<'request' | 'reset'>('request');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { resetPassword, updatePassword } = useAuth();

  // Check if we have a reset token in the URL
  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const type = searchParams.get('type');

    if (accessToken && refreshToken && type === 'recovery') {
      setMode('reset');
      UserAnalytics.trackEvent('password_reset_link_opened');
    }
  }, [searchParams]);

  const requestForm = useForm<RequestResetForm>({
    resolver: zodResolver(requestResetSchema),
  });

  const resetForm = useForm<SetPasswordForm>({
    resolver: zodResolver(setPasswordSchema),
  });

  const onRequestReset = async (data: RequestResetForm) => {
    setIsLoading(true);
    try {
      await resetPassword(data.email);
      setEmailSent(true);
      UserAnalytics.trackEvent('password_reset_requested', {
        email: data.email.toLowerCase(),
      });
    } catch (error) {
      UserAnalytics.trackEvent('password_reset_request_failed', {
        email: data.email.toLowerCase(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      requestForm.setError('root', {
        message: error instanceof Error ? error.message : 'Failed to send reset email',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSetPassword = async (data: SetPasswordForm) => {
    setIsLoading(true);
    try {
      // Set the session from URL parameters
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');

      if (!accessToken || !refreshToken) {
        throw new Error('Invalid reset link');
      }

      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) throw error;

      // Update the password
      await updatePassword(data.password);

      UserAnalytics.trackEvent('password_reset_completed');

      // Redirect to sign in with success message
      navigate('/auth/signin?message=password-updated');
    } catch (error) {
      ErrorTracker.trackError(error as Error, { context: 'password_reset' });
      UserAnalytics.trackEvent('password_reset_failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      resetForm.setError('root', {
        message: error instanceof Error ? error.message : 'Failed to update password',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Mail className="h-12 w-12 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
            <CardDescription className="text-lg">
              We've sent password reset instructions to your email address.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              If you don't see the email in your inbox, check your spam folder.
              The link will expire in 1 hour.
            </p>
            <Button
              onClick={() => {
                setEmailSent(false);
                requestForm.reset();
              }}
              variant="outline"
              className="w-full"
            >
              Send Another Email
            </Button>
            <Button
              onClick={() => navigate('/auth/signin')}
              className="w-full"
            >
              Back to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Lock className="h-8 w-8 text-purple-500" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {mode === 'request' ? 'Reset Password' : 'Set New Password'}
          </CardTitle>
          <CardDescription className="text-lg">
            {mode === 'request'
              ? 'Enter your email to receive reset instructions'
              : 'Enter your new password below'
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {mode === 'request' ? (
            <form onSubmit={requestForm.handleSubmit(onRequestReset)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  {...requestForm.register('email')}
                  disabled={isLoading}
                />
                {requestForm.formState.errors.email && (
                  <p className="text-sm text-red-500">{requestForm.formState.errors.email.message}</p>
                )}
              </div>

              {requestForm.formState.errors.root && (
                <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
                  {requestForm.formState.errors.root.message}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Reset Email'
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={resetForm.handleSubmit(onSetPassword)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your new password"
                    {...resetForm.register('password')}
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
                {resetForm.formState.errors.password && (
                  <p className="text-sm text-red-500">{resetForm.formState.errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your new password"
                    {...resetForm.register('confirmPassword')}
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
                {resetForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-red-500">{resetForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              {resetForm.formState.errors.root && (
                <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
                  {resetForm.formState.errors.root.message}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating Password...
                  </>
                ) : (
                  'Update Password'
                )}
              </Button>
            </form>
          )}

          <div className="text-center">
            <Button
              onClick={() => navigate('/auth/signin')}
              variant="ghost"
              className="text-sm"
            >
              Back to Sign In
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
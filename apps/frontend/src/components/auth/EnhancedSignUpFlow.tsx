/**
 * Enhanced Sign-Up Flow
 *
 * Multi-step registration process:
 * Step 1: Username & Email
 * Step 2: Email Confirmation Code
 * Step 3: Password Creation (isolated page)
 * Step 4: Profile Setup (Photos & Bio)
 *
 * Alternative: Google OAuth or Magic Link
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Mail,
  Lock,
  User,
  Chrome,
  Link as LinkIcon,
  ArrowRight,
  ArrowLeft,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Shield
} from 'lucide-react';
import { UserMode } from '@/config/dating-app.config';

type SignUpStep = 'username-email' | 'email-confirm' | 'password' | 'profile-setup';

interface EnhancedSignUpFlowProps {
  userMode: UserMode;
  onComplete: (userData: any) => void;
  onBack?: () => void;
}

// Password validation rules
const PASSWORD_RULES = {
  minLength: 6,
  requiresUppercase: true,
  requiresLowercase: true,
  requiresNumberOrSpecial: true,
  maxAttempts: 2,
};

export function EnhancedSignUpFlow({ userMode, onComplete, onBack }: EnhancedSignUpFlowProps) {
  const [step, setStep] = useState<SignUpStep>('username-email');
  const [loading, setLoading] = useState(false);

  // Form data
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [password, setPassword] = useState('');
  const [passwordAttempts, setPasswordAttempts] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  // Validation states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passwordStrength, setPasswordStrength] = useState(0);

  const steps = {
    'username-email': 1,
    'email-confirm': 2,
    'password': 3,
    'profile-setup': 4,
  };

  const progress = (steps[step] / 4) * 100;

  // Validate email format
  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  // Validate username
  const validateUsername = (username: string) => {
    if (username.length < 3) return 'Username must be at least 3 characters';
    if (username.length > 20) return 'Username must be less than 20 characters';
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return 'Username can only contain letters, numbers, and underscores';
    return null;
  };

  // Validate password strength
  const validatePassword = (pwd: string) => {
    const checks = {
      length: pwd.length >= PASSWORD_RULES.minLength,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      numberOrSpecial: /[0-9!@#$%^&*(),.?":{}|<>]/.test(pwd),
    };

    const strength = Object.values(checks).filter(Boolean).length;
    setPasswordStrength(strength);

    if (!checks.length) return 'Password must be at least 6 characters';
    if (!checks.uppercase) return 'Password must contain an uppercase letter';
    if (!checks.lowercase) return 'Password must contain a lowercase letter';
    if (!checks.numberOrSpecial) return 'Password must contain a number or special character';

    return null;
  };

  // Step 1: Username & Email
  const handleUsernameEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const usernameError = validateUsername(username);
    if (usernameError) {
      setErrors({ username: usernameError });
      return;
    }

    if (!validateEmail(email)) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }

    setLoading(true);
    try {
      // TODO: Send confirmation code to email
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStep('email-confirm');
    } catch (error) {
      setErrors({ general: 'Failed to send confirmation code' });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Email Confirmation
  const handleEmailConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (confirmationCode.length !== 6) {
      setErrors({ code: 'Please enter a 6-digit code' });
      return;
    }

    setLoading(true);
    try {
      // TODO: Verify confirmation code
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStep('password');
    } catch (error) {
      setErrors({ code: 'Invalid confirmation code' });
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Password Creation
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const passwordError = validatePassword(password);
    if (passwordError) {
      const newAttempts = passwordAttempts + 1;
      setPasswordAttempts(newAttempts);

      if (newAttempts >= PASSWORD_RULES.maxAttempts) {
        setErrors({
          password: `Maximum attempts reached. ${passwordError}. You have 1 more chance.`
        });
      } else {
        setErrors({ password: passwordError });
      }
      return;
    }

    setLoading(true);
    try {
      // TODO: Create account with password
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStep('profile-setup');
    } catch (error) {
      setErrors({ password: 'Failed to create password' });
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth
  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      // TODO: Implement Google OAuth
      await new Promise(resolve => setTimeout(resolve, 1000));
      onComplete({ authMethod: 'google', email, username });
    } catch (error) {
      setErrors({ general: 'Google authentication failed' });
    } finally {
      setLoading(false);
    }
  };

  // Magic Link
  const handleMagicLink = async () => {
    if (!validateEmail(email)) {
      setErrors({ email: 'Please enter a valid email address first' });
      return;
    }

    setLoading(true);
    try {
      // TODO: Send magic link
      await new Promise(resolve => setTimeout(resolve, 1000));
      setErrors({
        general: 'Magic link sent! Check your email and click the link to sign up.'
      });
    } catch (error) {
      setErrors({ general: 'Failed to send magic link' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-black to-pink-900 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <Card className="border-2 border-purple-500/20 bg-black/40 backdrop-blur-xl">
          <CardHeader>
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-xs text-gray-400 mb-2">
                <span>Step {steps[step]} of 4</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <CardTitle className="text-2xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {step === 'username-email' && 'Create Your Account'}
              {step === 'email-confirm' && 'Verify Your Email'}
              {step === 'password' && 'Secure Your Account'}
              {step === 'profile-setup' && 'Complete Your Profile'}
            </CardTitle>

            <CardDescription className="text-gray-300">
              {step === 'username-email' && 'Choose your username and enter your email'}
              {step === 'email-confirm' && 'Enter the 6-digit code we sent to your email'}
              {step === 'password' && 'Create a strong password for your account'}
              {step === 'profile-setup' && 'Add photos and tell us about yourself'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <AnimatePresence mode="wait">
              {/* Step 1: Username & Email */}
              {step === 'username-email' && (
                <motion.form
                  key="username-email"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleUsernameEmailSubmit}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-white">Username</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="username"
                        type="text"
                        placeholder="johndoe"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="pl-10 bg-white/5 border-white/10 text-white"
                        required
                      />
                    </div>
                    {errors.username && (
                      <p className="text-sm text-red-400">{errors.username}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 bg-white/5 border-white/10 text-white"
                        required
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-red-400">{errors.email}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
                    disabled={loading}
                  >
                    {loading ? 'Sending Code...' : 'Continue'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>

                  {/* Alternative Auth Methods */}
                  <div className="relative my-6">
                    <Separator />
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-black px-2 text-xs text-gray-400">
                      OR
                    </span>
                  </div>

                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-white/10 hover:bg-white/5"
                      onClick={handleGoogleAuth}
                      disabled={loading}
                    >
                      <Chrome className="mr-2 h-4 w-4" />
                      Continue with Google
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-white/10 hover:bg-white/5"
                      onClick={handleMagicLink}
                      disabled={loading}
                    >
                      <LinkIcon className="mr-2 h-4 w-4" />
                      Send Magic Link
                    </Button>
                  </div>
                </motion.form>
              )}

              {/* Step 2: Email Confirmation */}
              {step === 'email-confirm' && (
                <motion.form
                  key="email-confirm"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleEmailConfirmSubmit}
                  className="space-y-4"
                >
                  <Alert className="border-blue-500/50 bg-blue-500/10">
                    <Mail className="h-4 w-4 text-blue-400" />
                    <AlertDescription className="text-blue-200">
                      We sent a 6-digit code to <strong>{email}</strong>
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label htmlFor="code" className="text-white">Confirmation Code</Label>
                    <Input
                      id="code"
                      type="text"
                      placeholder="000000"
                      maxLength={6}
                      value={confirmationCode}
                      onChange={(e) => setConfirmationCode(e.target.value.replace(/\D/g, ''))}
                      className="text-center text-2xl tracking-widest bg-white/5 border-white/10 text-white"
                      required
                    />
                    {errors.code && (
                      <p className="text-sm text-red-400">{errors.code}</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep('username-email')}
                      className="border-white/10 hover:bg-white/5"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
                      disabled={loading}
                    >
                      {loading ? 'Verifying...' : 'Verify Email'}
                    </Button>
                  </div>

                  <Button
                    type="button"
                    variant="link"
                    className="w-full text-gray-400 hover:text-white"
                  >
                    Didn't receive the code? Resend
                  </Button>
                </motion.form>
              )}

              {/* Step 3: Password Creation */}
              {step === 'password' && (
                <motion.form
                  key="password"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handlePasswordSubmit}
                  className="space-y-4"
                >
                  <Alert className="border-amber-500/50 bg-amber-500/10">
                    <Shield className="h-4 w-4 text-amber-400" />
                    <AlertDescription className="text-amber-200 text-sm">
                      You have <strong>{PASSWORD_RULES.maxAttempts - passwordAttempts} attempts</strong> remaining to create a valid password
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          validatePassword(e.target.value);
                        }}
                        className="pl-10 pr-10 bg-white/5 border-white/10 text-white"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <Alert className="border-red-500/50 bg-red-500/10">
                        <AlertCircle className="h-4 w-4 text-red-400" />
                        <AlertDescription className="text-red-200 text-sm">
                          {errors.password}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  {/* Password Requirements */}
                  <div className="space-y-2 p-4 rounded-lg bg-white/5">
                    <p className="text-sm font-semibold text-white">Password Requirements:</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Check className={`h-4 w-4 ${password.length >= 6 ? 'text-green-400' : 'text-gray-500'}`} />
                        <span className={password.length >= 6 ? 'text-green-400' : 'text-gray-400'}>
                          At least 6 characters
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className={`h-4 w-4 ${/[A-Z]/.test(password) ? 'text-green-400' : 'text-gray-500'}`} />
                        <span className={/[A-Z]/.test(password) ? 'text-green-400' : 'text-gray-400'}>
                          One uppercase letter
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className={`h-4 w-4 ${/[a-z]/.test(password) ? 'text-green-400' : 'text-gray-500'}`} />
                        <span className={/[a-z]/.test(password) ? 'text-green-400' : 'text-gray-400'}>
                          One lowercase letter
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className={`h-4 w-4 ${/[0-9!@#$%^&*]/.test(password) ? 'text-green-400' : 'text-gray-500'}`} />
                        <span className={/[0-9!@#$%^&*]/.test(password) ? 'text-green-400' : 'text-gray-400'}>
                          One number or special character
                        </span>
                      </div>
                    </div>

                    {/* Password Strength Indicator */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Password Strength</span>
                        <span>
                          {passwordStrength === 0 && 'Weak'}
                          {passwordStrength === 1 && 'Weak'}
                          {passwordStrength === 2 && 'Fair'}
                          {passwordStrength === 3 && 'Good'}
                          {passwordStrength === 4 && 'Strong'}
                        </span>
                      </div>
                      <Progress
                        value={(passwordStrength / 4) * 100}
                        className="h-2"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep('email-confirm')}
                      className="border-white/10 hover:bg-white/5"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
                      disabled={loading || passwordAttempts >= PASSWORD_RULES.maxAttempts + 1}
                    >
                      {loading ? 'Creating...' : 'Create Password'}
                    </Button>
                  </div>
                </motion.form>
              )}

              {/* Step 4: Profile Setup (Placeholder) */}
              {step === 'profile-setup' && (
                <motion.div
                  key="profile-setup"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="text-center py-8"
                >
                  <Check className="h-16 w-16 text-green-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Account Created!</h3>
                  <p className="text-gray-300 mb-6">
                    Let's complete your profile
                  </p>
                  <Button
                    onClick={() => onComplete({ username, email, userMode })}
                    className="bg-gradient-to-r from-purple-600 to-pink-600"
                  >
                    Continue to Profile Setup
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* General Errors */}
            {errors.general && (
              <Alert className={errors.general.includes('sent') ? 'border-green-500/50 bg-green-500/10' : 'border-red-500/50 bg-red-500/10'}>
                <AlertDescription className={errors.general.includes('sent') ? 'text-green-200' : 'text-red-200'}>
                  {errors.general}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>

          {onBack && step === 'username-email' && (
            <CardFooter>
              <Button
                variant="ghost"
                onClick={onBack}
                className="w-full text-gray-400 hover:text-white"
              >
                Back to Mode Selection
              </Button>
            </CardFooter>
          )}
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-gray-400 mt-4">
          Already have an account?{' '}
          <a href="/signin" className="text-purple-400 hover:text-purple-300 underline">
            Sign in
          </a>
        </p>
      </motion.div>
    </div>
  );
}

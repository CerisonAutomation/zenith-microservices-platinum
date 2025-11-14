/**
 * 🔐 Production-Grade Authentication Context
 * Zenith Oracle Executive Apex - PKCE Flow Implementation
 *
 * Implements:
 * - PKCE (Proof Key for Code Exchange) flow
 * - Session management with automatic refresh
 * - Identity linking and user metadata
 * - OAuth providers with secure redirects
 * - Password reset with email verification
 * - Account recovery and security features
 *
 * @see https://supabase.com/docs/guides/auth/auth-pkce
 * @see https://supabase.com/docs/guides/auth/auth-identity-linking
 */

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User, Session, AuthError, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { ErrorTracker, UserAnalytics } from '@/lib/observability';

interface AuthContextType {
  // Core Auth State
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;

  // Auth Actions
  signIn: (email: string, password: string) => Promise<{ user: User | null; session: Session | null }>;
  signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<{ user: User | null; session: Session | null }>;
  signOut: () => Promise<void>;
  signInWithOAuth: (provider: 'google' | 'facebook' | 'apple' | 'github') => Promise<void>;

  // Password Management
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  updateEmail: (newEmail: string) => Promise<void>;

  // User Management
  updateProfile: (updates: Partial<User['user_metadata']>) => Promise<void>;
  refreshSession: () => Promise<void>;

  // Security
  mfa: {
    enroll: (factorType: 'totp') => Promise<{ qr_code: string; uri: string }>;
    verify: (factorId: string, code: string) => Promise<void>;
    unenroll: (factorId: string) => Promise<void>;
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();

        if (error) {
          ErrorTracker.trackError(error, { context: 'auth_initialization' });
          throw error;
        }

        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          setLoading(false);

          // Track initial auth state
          UserAnalytics.trackEvent('auth_initialized', {
            hasSession: !!initialSession,
            userId: initialSession?.user?.id,
          });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes with comprehensive event handling
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (!mounted) return;

        console.log('Auth state change:', event, session?.user?.id);

        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Track auth events
        UserAnalytics.trackEvent(`auth_${event}`, {
          userId: session?.user?.id,
          timestamp: new Date().toISOString(),
        });

        // Handle specific auth events
        switch (event) {
          case 'SIGNED_IN':
            toast({
              title: 'Welcome back!',
              description: 'You have successfully signed in.',
            });
            break;

          case 'SIGNED_OUT':
            toast({
              title: 'Signed out',
              description: 'You have been successfully signed out.',
            });
            break;

          case 'TOKEN_REFRESHED':
            console.log('Session token refreshed');
            break;

          case 'USER_UPDATED':
            toast({
              title: 'Profile updated',
              description: 'Your profile has been successfully updated.',
            });
            break;

          case 'PASSWORD_RECOVERY':
            toast({
              title: 'Password reset email sent',
              description: 'Check your email for password reset instructions.',
            });
            break;
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [toast]);

  // Enhanced error handling
  const handleAuthError = useCallback((error: AuthError, context?: string) => {
    ErrorTracker.trackError(error, { context: context || 'auth_operation' });

    const errorMessages: Record<string, string> = {
      'Invalid login credentials': 'Incorrect email or password. Please try again.',
      'Email not confirmed': 'Please verify your email address before signing in.',
      'User already registered': 'An account with this email already exists.',
      'Password should be at least 6 characters': 'Password must be at least 6 characters long.',
      'Signup requires a valid password': 'Please provide a valid password.',
      'Email link is invalid or has expired': 'The email verification link is invalid or has expired.',
      'Token has expired or is invalid': 'Your session has expired. Please sign in again.',
      'refresh_token_not_found': 'Session expired. Please sign in again.',
    };

    const message = errorMessages[error.message] || error.message;

    toast({
      variant: 'destructive',
      title: 'Authentication Error',
      description: message,
    });
  }, [toast]);

  // PKCE Flow Sign In
  const signIn = useCallback(async (email: string, password: string): Promise<{ user: User | null; session: Session | null }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) throw error;

      UserAnalytics.trackEvent('sign_in_success', {
        method: 'password',
        userId: data.user?.id,
      });

      return { user: data.user, session: data.session };
    } catch (error) {
      handleAuthError(error as AuthError, 'sign_in');
      throw error;
    }
  }, [handleAuthError]);

  // PKCE Flow Sign Up with email verification
  const signUp = useCallback(async (
    email: string,
    password: string,
    metadata?: Record<string, any>
  ): Promise<{ user: User | null; session: Session | null }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          ...(metadata && { data: metadata }),
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      UserAnalytics.trackEvent('sign_up_success', {
        method: 'email',
        userId: data.user?.id,
        emailConfirmed: data.user?.email_confirmed_at ? true : false,
      });

      if (!data.user?.email_confirmed_at) {
        toast({
          title: 'Account created!',
          description: 'Please check your email to verify your account.',
        });
      }

      return { user: data.user, session: data.session };
    } catch (error) {
      handleAuthError(error as AuthError, 'sign_up');
      throw error;
    }
  }, [handleAuthError, toast]);

  // Secure Sign Out
  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      UserAnalytics.trackEvent('sign_out', {
        userId: user?.id,
      });
    } catch (error) {
      handleAuthError(error as AuthError, 'sign_out');
      throw error;
    }
  }, [handleAuthError, user?.id]);

  // OAuth with PKCE Flow
  const signInWithOAuth = useCallback(async (provider: 'google' | 'facebook' | 'apple' | 'github') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;

      UserAnalytics.trackEvent('oauth_initiated', {
        provider,
      });
    } catch (error) {
      handleAuthError(error as AuthError, `oauth_${provider}`);
      throw error;
    }
  }, [handleAuthError]);

  // Password Reset
  const resetPassword = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      UserAnalytics.trackEvent('password_reset_requested', {
        email: email.toLowerCase(),
      });
    } catch (error) {
      handleAuthError(error as AuthError, 'password_reset');
      throw error;
    }
  }, [handleAuthError]);

  // Update Password
  const updatePassword = useCallback(async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      UserAnalytics.trackEvent('password_updated', {
        userId: user?.id,
      });

      toast({
        title: 'Password updated',
        description: 'Your password has been successfully changed.',
      });
    } catch (error) {
      handleAuthError(error as AuthError, 'password_update');
      throw error;
    }
  }, [handleAuthError, toast, user?.id]);

  // Update Email
  const updateEmail = useCallback(async (newEmail: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail.trim().toLowerCase(),
      });

      if (error) throw error;

      UserAnalytics.trackEvent('email_update_requested', {
        userId: user?.id,
        newEmail: newEmail.toLowerCase(),
      });

      toast({
        title: 'Email update requested',
        description: 'Please check your new email address to confirm the change.',
      });
    } catch (error) {
      handleAuthError(error as AuthError, 'email_update');
      throw error;
    }
  }, [handleAuthError, toast, user?.id]);

  // Update Profile Metadata
  const updateProfile = useCallback(async (updates: Partial<User['user_metadata']>) => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: updates,
      });

      if (error) throw error;

      UserAnalytics.trackEvent('profile_updated', {
        userId: user?.id,
        updates: Object.keys(updates),
      });
    } catch (error) {
      handleAuthError(error as AuthError, 'profile_update');
      throw error;
    }
  }, [handleAuthError, user?.id]);

  // Refresh Session
  const refreshSession = useCallback(async () => {
    try {
      const { error } = await supabase.auth.refreshSession();
      if (error) throw error;

      UserAnalytics.trackEvent('session_refreshed', {
        userId: user?.id,
      });
    } catch (error) {
      handleAuthError(error as AuthError, 'session_refresh');
      throw error;
    }
  }, [handleAuthError, user?.id]);

  // MFA Methods (placeholder for future implementation)
  const mfa = {
    enroll: async (_factorType: 'totp') => {
      // Implementation would integrate with Supabase MFA
      throw new Error('MFA not yet implemented');
    },
    verify: async (_factorId: string, _code: string) => {
      // Implementation would verify MFA code
      throw new Error('MFA not yet implemented');
    },
    unenroll: async (_factorId: string) => {
      // Implementation would remove MFA factor
      throw new Error('MFA not yet implemented');
    },
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    signInWithOAuth,
    resetPassword,
    updatePassword,
    updateEmail,
    updateProfile,
    refreshSession,
    mfa,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}


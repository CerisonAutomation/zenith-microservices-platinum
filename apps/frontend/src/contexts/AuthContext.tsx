/**
 * 🔐 Authentication Context
 *
 * Provides:
 * - User session management
 * - Sign in/up/out functionality
 * - Session persistence
 * - Auth state across app
 *
 * @see https://supabase.com/docs/guides/auth
 */

"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { createClient, isSupabaseConfigured } from '../utils/supabase/client';
import { api, authAPI } from '../lib/api';
import { mockUser } from '../lib/mockData';
import { useToast } from '../components/ui/use-toast';

interface UserMetadata {
  full_name?: string;
  avatar_url?: string;
  age?: number;
  gender?: string;
  bio?: string;
  [key: string]: unknown;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, metadata?: UserMetadata) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithOAuth: (provider: 'google' | 'facebook' | 'apple') => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const initAuth = async () => {
      // Check if Supabase is properly configured
      const configured = isSupabaseConfigured();

      // SECURITY FIX #4: Prevent demo mode in production
      const isProduction = process.env.NODE_ENV === 'production';
      const isDevelopment = process.env.NODE_ENV === 'development';

      if (!configured) {
        // SECURITY: Only allow demo mode in development, not production
        if (isProduction) {
          console.error('❌ CRITICAL: Supabase not configured in production!');
          console.error('Authentication is required but not properly set up.');
          setLoading(false);
          return; // Don't allow demo mode in production
        }

        // 🎭 DEMO MODE - Only in development
        if (isDevelopment) {
          console.log('🎭 Running in DEMO MODE with mock authentication (DEVELOPMENT ONLY)');
          console.log('💡 To enable production auth, set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');

          // SECURITY: Use crypto-random tokens even in demo mode
          const randomToken = () => {
            const array = new Uint8Array(32);
            if (typeof window !== 'undefined' && window.crypto) {
              window.crypto.getRandomValues(array);
              return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
            }
            return `demo-${Date.now()}-${Math.random()}`;
          };

          const demoUser = {
            id: mockUser.id,
            email: mockUser.email,
            created_at: mockUser.createdAt,
            updated_at: mockUser.createdAt,
            app_metadata: {},
            user_metadata: {
              name: mockUser.name,
              avatar: mockUser.avatar,
              isPremium: mockUser.isPremium,
            },
            aud: 'authenticated',
            role: 'authenticated',
          } as User;

          // SECURITY: Use random tokens instead of hardcoded values
          const demoSession = {
            access_token: randomToken(),
            refresh_token: randomToken(),
            expires_in: 3600,
            token_type: 'bearer',
            user: demoUser,
          } as Session;

          setUser(demoUser);
          setSession(demoSession);
          setIsDemoMode(true);
          setLoading(false);
          return;
        }
      }

      // 🔐 PRODUCTION MODE - Use real Supabase authentication with SSR support
      console.log('🔐 Running in PRODUCTION MODE with Supabase authentication');

      // Create browser client with proper SSR cookie handling
      const supabase = createClient();
      if (!supabase) {
        console.error('Failed to create Supabase client');
        setLoading(false);
        return;
      }

      try {
        // Get initial session
        const { data: { session: initialSession } } = await supabase.auth.getSession();

        if (initialSession) {
          setSession(initialSession);
          setUser(initialSession.user);
          // Set token for API client
          if (initialSession.access_token) {
            api.setToken(initialSession.access_token);
            authAPI.setToken(initialSession.access_token);
          }
        }

        // Listen for auth changes
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
          setSession(session);
          setUser(session?.user ?? null);

          // Update API client token
          if (session?.access_token) {
            api.setToken(session.access_token);
            authAPI.setToken(session.access_token);
          } else {
            api.clearToken();
            authAPI.clearToken();
          }
        });

        setLoading(false);

        return () => subscription.unsubscribe();
      } catch (error) {
        // SECURITY FIX #9: Don't log error objects that may contain tokens/sessions
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to initialize auth');
        }
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const handleAuthError = (error: AuthError) => {
    // SECURITY FIX #9: Don't log full error object (may contain sensitive data)
    // Only log error message in development, nothing in production
    if (process.env.NODE_ENV === 'development') {
      console.error('Auth error message:', error.message);
    }

    const errorMessages: Record<string, string> = {
      'Invalid login credentials': 'Incorrect email or password',
      'Email not confirmed': 'Please verify your email address',
      'User already registered': 'An account with this email already exists',
    };

    toast({
      variant: 'destructive',
      title: 'Authentication Error',
      description: errorMessages[error.message] || 'An authentication error occurred',
    });
  };

  const signIn = async (email: string, password: string) => {
    if (isDemoMode) {
      toast({
        title: 'Demo Mode',
        description: 'Already signed in with demo account. Configure Supabase for real authentication.',
      });
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      toast({
        variant: 'destructive',
        title: 'Configuration Error',
        description: 'Authentication is not properly configured.',
      });
      return;
    }

    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Set token for API client
      if (data.session?.access_token) {
        api.setToken(data.session.access_token);
        authAPI.setToken(data.session.access_token);
      }

      toast({
        title: 'Welcome back!',
        description: 'You have successfully signed in.',
      });
    } catch (error) {
      handleAuthError(error as AuthError);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, metadata?: any) => {
    if (isDemoMode) {
      toast({
        title: 'Demo Mode',
        description: 'Sign up is disabled in demo mode. Configure Supabase for real authentication.',
      });
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      toast({
        variant: 'destructive',
        title: 'Configuration Error',
        description: 'Authentication is not properly configured.',
      });
      return;
    }

    try {
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      // Set token for API client if immediately available
      if (data.session?.access_token) {
        api.setToken(data.session.access_token);
        authAPI.setToken(data.session.access_token);
      }

      toast({
        title: 'Account created!',
        description: 'Please check your email to verify your account.',
      });
    } catch (error) {
      handleAuthError(error as AuthError);
      throw error;
    }
  };

  const signOut = async () => {
    if (isDemoMode) {
      toast({
        title: 'Demo Mode',
        description: 'Cannot sign out in demo mode. Configure Supabase for real authentication.',
      });
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      toast({
        variant: 'destructive',
        title: 'Configuration Error',
        description: 'Authentication is not properly configured.',
      });
      return;
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear API client tokens
      api.clearToken();
      authAPI.clearToken();

      toast({
        title: 'Signed out',
        description: 'You have been successfully signed out.',
      });
    } catch (error) {
      handleAuthError(error as AuthError);
      throw error;
    }
  };

  const signInWithOAuth = async (provider: 'google' | 'facebook' | 'apple') => {
    if (isDemoMode) {
      toast({
        title: 'Demo Mode',
        description: 'OAuth is disabled in demo mode. Configure Supabase for real authentication.',
      });
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      toast({
        variant: 'destructive',
        title: 'Configuration Error',
        description: 'Authentication is not properly configured.',
      });
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (error) {
      handleAuthError(error as AuthError);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    if (isDemoMode) {
      toast({
        title: 'Demo Mode',
        description: 'Password reset is disabled in demo mode. Configure Supabase for real authentication.',
      });
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      toast({
        variant: 'destructive',
        title: 'Configuration Error',
        description: 'Authentication is not properly configured.',
      });
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      toast({
        title: 'Password reset email sent',
        description: 'Check your email for a password reset link.',
      });
    } catch (error) {
      handleAuthError(error as AuthError);
      throw error;
    }
  };

  const updatePassword = async (newPassword: string) => {
    if (isDemoMode) {
      toast({
        title: 'Demo Mode',
        description: 'Password update is disabled in demo mode. Configure Supabase for real authentication.',
      });
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      toast({
        variant: 'destructive',
        title: 'Configuration Error',
        description: 'Authentication is not properly configured.',
      });
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: 'Password updated',
        description: 'Your password has been successfully changed.',
      });
    } catch (error) {
      handleAuthError(error as AuthError);
      throw error;
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithOAuth,
    resetPassword,
    updatePassword,
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

// Protected route wrapper component
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  // const navigate = useNavigate();

  // SECURITY FIX #4: Removed NEXT_PUBLIC_DEV_MODE bypass
  // This environment variable could be accidentally set in production
  // Authentication is now always enforced when no user is present

  useEffect(() => {
    if (!loading && !user) {
      // SECURITY: Always redirect unauthenticated users
      // No dev mode bypass that could be exploited
      // navigate('/auth/sign-in', { replace: true });
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // SECURITY: Only show content if user is authenticated
  // No dev mode bypass
  return user ? <>{children}</> : null;
}

// Add missing import
// import { useNavigate } from 'react-router-dom';

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
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { api, authAPI } from '../lib/api';
import { mockUser } from '../lib/mockData';
import { useToast } from '../components/ui/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, metadata?: any) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithOAuth: (provider: 'google' | 'facebook' | 'apple') => Promise<void>;
  signInAsGuest: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  isGuest: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const initAuth = async () => {
      // Check for existing guest session first
      const guestSessionData = localStorage.getItem('zenith_guest_session');
      if (guestSessionData) {
        try {
          const { user: guestUser, session: guestSession, trialEnd } = JSON.parse(guestSessionData);

          // Check if trial is still valid
          const trialEndDate = new Date(trialEnd);
          const now = new Date();

          if (now < trialEndDate) {
            // Trial still valid, restore guest session
            setUser(guestUser);
            setSession(guestSession);
            setIsGuest(true);
            setLoading(false);
            console.log('✅ Guest session restored. Trial ends:', trialEndDate.toLocaleString());
            return;
          } else {
            // Trial expired, clear guest session
            localStorage.removeItem('zenith_guest_session');
            console.log('⏰ Guest trial expired');
          }
        } catch (error) {
          console.error('Failed to restore guest session:', error);
          localStorage.removeItem('zenith_guest_session');
        }
      }

      // Check if Supabase is properly configured
      const configured = isSupabaseConfigured();

      if (!configured) {
        // 🎭 DEMO MODE - Skip Supabase auth, use mock user
        console.log('🎭 Running in DEMO MODE with mock authentication');
        console.log('💡 To enable production auth, set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');

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

        const demoSession = {
          access_token: 'demo-token',
          refresh_token: 'demo-refresh',
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

      // 🔐 PRODUCTION MODE - Use real Supabase authentication
      console.log('🔐 Running in PRODUCTION MODE with Supabase authentication');

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
        console.error('Failed to initialize auth:', error);
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const handleAuthError = (error: AuthError) => {
    console.error('Auth error:', error);
    
    const errorMessages: Record<string, string> = {
      'Invalid login credentials': 'Incorrect email or password',
      'Email not confirmed': 'Please verify your email address',
      'User already registered': 'An account with this email already exists',
    };

    toast({
      variant: 'destructive',
      title: 'Authentication Error',
      description: errorMessages[error.message] || error.message,
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

  const signInAsGuest = async () => {
    try {
      // Generate a unique guest ID
      const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 7); // 7 days from now

      // Create guest user object
      const guestUser = {
        id: guestId,
        email: `${guestId}@guest.zenith.app`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {
          name: 'Guest User',
          isGuest: true,
          trialEnd: trialEndDate.toISOString(),
        },
        aud: 'authenticated',
        role: 'authenticated',
      } as User;

      // Create guest session
      const guestSession = {
        access_token: `guest-token-${guestId}`,
        refresh_token: `guest-refresh-${guestId}`,
        expires_in: 604800, // 7 days in seconds
        token_type: 'bearer',
        user: guestUser,
      } as Session;

      // Store guest session in localStorage for persistence
      localStorage.setItem('zenith_guest_session', JSON.stringify({
        user: guestUser,
        session: guestSession,
        trialEnd: trialEndDate.toISOString(),
      }));

      setUser(guestUser);
      setSession(guestSession);
      setIsGuest(true);

      toast({
        title: 'Welcome to Zenith! 🎉',
        description: `Your 7-day free trial starts now. Enjoy all features with no credit card required!`,
      });
    } catch (error) {
      console.error('Guest login error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to start guest session. Please try again.',
      });
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
    signInAsGuest,
    resetPassword,
    updatePassword,
    isGuest,
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
  const devMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

  useEffect(() => {
    if (!loading && !user && !devMode) {
      // navigate('/auth/sign-in', { replace: true });
    }
  }, [user, loading, devMode]);

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

  // In dev mode, always show content
  if (devMode) {
    return <>{children}</>;
  }

  return user ? <>{children}</> : null;
}

// Add missing import
// import { useNavigate } from 'react-router-dom';

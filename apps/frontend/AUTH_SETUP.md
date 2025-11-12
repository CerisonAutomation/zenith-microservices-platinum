# Supabase Authentication Setup Guide

This document describes the proper Supabase authentication setup using the recommended `@supabase/ssr` package for Next.js App Router.

## 🏗️ Architecture Overview

The authentication system follows Supabase's official best practices for Next.js App Router with Server-Side Rendering (SSR).

### Three Types of Supabase Clients

1. **Client Component Client** (`utils/supabase/client.ts`)
   - Used in Client Components
   - Handles client-side auth operations
   - Manages cookies via browser APIs

2. **Server Component Client** (`utils/supabase/server.ts`)
   - Used in Server Components, Server Actions, and Route Handlers
   - Handles server-side auth operations
   - Manages cookies via Next.js `cookies()` API

3. **Middleware Client** (`utils/supabase/middleware.ts`)
   - Used in Next.js middleware
   - Refreshes expired auth tokens automatically
   - Protects routes based on auth status

## 📁 File Structure

```
apps/frontend/
├── src/
│   ├── utils/
│   │   └── supabase/
│   │       ├── client.ts          # Client-side Supabase client
│   │       ├── server.ts          # Server-side Supabase client
│   │       └── middleware.ts      # Middleware Supabase client
│   ├── app/
│   │   └── auth/
│   │       ├── callback/
│   │       │   └── route.ts       # Auth callback handler (OAuth, email verification)
│   │       └── error/
│   │           └── page.tsx       # Auth error page
│   ├── contexts/
│   │   └── AuthContext.tsx        # Auth state management
│   └── lib/
│       └── supabase.ts            # Legacy file (kept for backwards compatibility)
├── middleware.ts                   # Next.js middleware with auth
└── .env.local                      # Environment variables (create from .env.example)
```

## 🔧 Setup Instructions

### 1. Install Dependencies

The required packages are already installed:
- `@supabase/supabase-js` - Supabase client library
- `@supabase/ssr` - SSR utilities for Next.js

### 2. Configure Environment Variables

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

Add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Get these from:** Supabase Dashboard → Project Settings → API

### 3. Demo Mode vs Production Mode

The app automatically detects if Supabase is configured:

- **Demo Mode** (no credentials): Uses mock authentication with fake data
- **Production Mode** (credentials set): Uses real Supabase authentication

## 🎯 Usage Examples

### Client Components

```typescript
'use client';

import { createClient } from '@/utils/supabase/client';

export default function ClientComponent() {
  const signIn = async () => {
    const supabase = createClient();
    if (!supabase) return;

    const { error } = await supabase.auth.signInWithPassword({
      email: 'user@example.com',
      password: 'password123',
    });
  };

  return <button onClick={signIn}>Sign In</button>;
}
```

### Server Components

```typescript
import { createClient } from '@/utils/supabase/server';

export default async function ServerComponent() {
  const supabase = await createClient();
  if (!supabase) return <div>Auth not configured</div>;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <div>Welcome {user?.email}</div>;
}
```

### Server Actions

```typescript
'use server';

import { createClient } from '@/utils/supabase/server';

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) return;

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  // Update profile...
}
```

### Route Handlers

```typescript
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Auth not configured' }, { status: 500 });
  }

  const { data: { session } } = await supabase.auth.getSession();

  return NextResponse.json({ session });
}
```

## 🔐 Authentication Flows

### Email/Password Sign Up

```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'securePassword123',
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`,
    data: {
      // Optional metadata
      full_name: 'John Doe',
    },
  },
});
```

### Email/Password Sign In

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'securePassword123',
});
```

### OAuth Sign In (Google, Facebook, Apple)

```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google', // or 'facebook', 'apple'
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
  },
});
```

### Password Reset

```typescript
// Request password reset
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/auth/reset-password`,
});

// Update password (after clicking reset link)
const { error } = await supabase.auth.updateUser({
  password: 'newSecurePassword123',
});
```

### Sign Out

```typescript
const { error } = await supabase.auth.signOut();
```

## 🛡️ Route Protection

### Middleware-based Protection

The middleware automatically refreshes auth tokens on every request. To protect routes, uncomment the protection logic in `utils/supabase/middleware.ts`:

```typescript
const protectedRoutes = ['/profile', '/messages', '/favorites', '/wallet'];
const isProtectedRoute = protectedRoutes.some((route) =>
  request.nextUrl.pathname.startsWith(route)
);

if (isProtectedRoute && !user) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = '/auth/login';
  redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
  return NextResponse.redirect(redirectUrl);
}
```

### Component-based Protection

Use the `RequireAuth` wrapper:

```typescript
import { RequireAuth } from '@/contexts/AuthContext';

export default function ProtectedPage() {
  return (
    <RequireAuth>
      <div>Protected content</div>
    </RequireAuth>
  );
}
```

## 🔄 Session Management

### Automatic Token Refresh

The middleware automatically refreshes expired tokens on every request. No manual intervention needed.

### Listen to Auth State Changes

```typescript
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  (event, session) => {
    if (event === 'SIGNED_IN') {
      console.log('User signed in:', session.user);
    }
    if (event === 'SIGNED_OUT') {
      console.log('User signed out');
    }
    if (event === 'TOKEN_REFRESHED') {
      console.log('Token refreshed');
    }
  }
);

// Cleanup
subscription.unsubscribe();
```

## 🎭 Demo Mode Features

When Supabase credentials are not configured:

- ✅ Mock user with fake profile data
- ✅ UI/UX testing without backend
- ✅ All components work normally
- ⚠️ Auth operations show demo mode messages
- ⚠️ No real data persistence

## 📝 Auth Callback Handler

The `/auth/callback` route handles:

1. **OAuth redirects** (Google, Facebook, Apple)
2. **Email verification** links
3. **Password reset** links
4. **Magic link** authentication

It exchanges the auth code for a session and redirects users appropriately.

## 🐛 Troubleshooting

### "Invalid Refresh Token" Error

**Cause:** User's session has expired beyond the refresh window.

**Solution:**
```typescript
const { error } = await supabase.auth.signOut();
// Redirect to login
```

### OAuth Redirect Not Working

**Checklist:**
1. ✅ Callback URL configured in Supabase Dashboard (Auth → URL Configuration)
2. ✅ OAuth provider configured (Auth → Providers)
3. ✅ Redirect URL matches: `${YOUR_DOMAIN}/auth/callback`

### "User Already Registered" Error

**Cause:** Email already exists in database.

**Solution:** Use sign in instead, or implement "forgot password" flow.

### Cookies Not Being Set

**Cause:** Middleware not running properly.

**Solution:**
1. Check `middleware.ts` matcher includes your routes
2. Verify `updateSession()` is being called
3. Check browser console for cookie errors

## 🔒 Security Best Practices

1. **Never expose service_role key** in frontend code
2. **Always validate user permissions** on the server side
3. **Use Row Level Security (RLS)** in Supabase
4. **Implement rate limiting** (already configured in middleware)
5. **Enable email confirmation** in Supabase settings
6. **Use HTTPS** in production
7. **Configure CORS** properly for your domain

## 📚 Resources

- [Official Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Next.js SSR Guide](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Supabase JS Reference](https://supabase.com/docs/reference/javascript/auth-api)
- [OAuth Configuration](https://supabase.com/docs/guides/auth/social-login)

## 🆕 What's Changed from Old Setup

### Before (Incorrect)

```typescript
// ❌ Single client used everywhere
import { supabase } from '@/lib/supabase';

// Used same client in server and client
export default async function ServerComponent() {
  const { data } = await supabase.auth.getUser();
}
```

### After (Correct)

```typescript
// ✅ Proper SSR-aware clients
import { createClient } from '@/utils/supabase/server';

export default async function ServerComponent() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
}
```

### Key Improvements

1. ✅ **Proper cookie handling** for SSR
2. ✅ **Automatic token refresh** in middleware
3. ✅ **Type-safe clients** for different contexts
4. ✅ **OAuth callback handler** for social login
5. ✅ **Error handling** with user-friendly messages
6. ✅ **Auth state synchronization** across server/client

## ✨ Benefits

- **Better Security:** Server-side auth validation
- **Better Performance:** Automatic token refresh
- **Better UX:** Seamless OAuth flows
- **Better DX:** Type-safe, context-aware clients
- **Production Ready:** Follows Supabase best practices

---

**Last Updated:** 2025-11-12
**Supabase Version:** 2.39.0
**@supabase/ssr Version:** 0.1.0

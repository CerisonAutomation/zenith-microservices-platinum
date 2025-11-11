# Zenith Dating Platform - Supabase Migration Guide

This guide explains how to migrate the Zenith dating platform from a custom backend to a fully Supabase-native backend.

## Overview

The migration replaces:
- Custom JWT authentication → Supabase Auth
- PostgreSQL + SQLAlchemy → Supabase PostgreSQL
- AWS S3 → Supabase Storage
- Custom notification system → Supabase Edge Functions (optional)

## Prerequisites

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Note your project URL and API keys from the dashboard

## Environment Configuration

### Backend (.env)

Update your root `.env` file:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres:[password]@db.your-project-id.supabase.co:5432/postgres
SQLALCHEMY_DATABASE_URL=postgresql://postgres:[password]@db.your-project-id.supabase.co:5432/postgres
```

### Frontend (.env.local)

Update your frontend `.env.local` file:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## Database Setup

1. Go to your Supabase dashboard → SQL Editor
2. Run the `supabase_schema.sql` file to create all tables, policies, and functions
3. This will set up:
   - User profiles table
   - Matches table
   - Messages table
   - Notifications table
   - Storage buckets
   - Row Level Security policies

## Storage Setup

The migration automatically creates these storage buckets:
- `profile-images` - User profile pictures
- `profile-documents` - User verification documents
- `chat-media` - Chat images, videos, audio
- `chat-attachments` - Chat file attachments
- `uploads` - General file uploads

All buckets are configured with appropriate RLS policies.

## Authentication Flow

### Before (Custom JWT)
```python
# Custom authentication with FastAPI + JWT
@app.post("/auth/login")
def login(credentials: UserLogin):
    # Custom JWT creation and validation
    token = create_jwt_token(user.id)
    return {"access_token": token}
```

### After (Supabase Auth)
```python
# Supabase handles authentication
@router.post("/auth/login")
async def login_user(credentials: schemas.UserLogin):
    supabase = get_supabase_client()
    auth_response = supabase.auth.sign_in_with_password({
        "email": credentials.email,
        "password": credentials.password
    })
    return auth_response.session
```

## Frontend Integration

The frontend now uses the Supabase client for all operations:

```typescript
import { supabase, auth, db, storage } from '@/lib/supabase'

// Authentication
const { data, error } = await auth.signIn(email, password)

// Database operations
const { data: profile } = await db.getProfile(userId)

// File uploads
const { data: uploadData } = await storage.uploadFile('profile-images', file, fileName)
const publicUrl = storage.getPublicUrl('profile-images', fileName)

// Realtime subscriptions
const subscription = realtime.subscribeToMessages(matchId, (payload) => {
  console.log('New message:', payload)
})
```

## API Changes

### Authentication Endpoints

| Old Endpoint | New Endpoint | Description |
|-------------|-------------|-------------|
| `POST /auth/login` | `POST /auth/login` | Login with Supabase Auth |
| `POST /auth/register` | `POST /auth/register` | Register with Supabase Auth |
| `POST /auth/refresh` | `POST /auth/refresh` | Refresh tokens |
| `GET /auth/me` | `GET /auth/me` | Get current user |

### Storage Endpoints

| Old Endpoint | New Endpoint | Description |
|-------------|-------------|-------------|
| `POST /storage/upload/profile-image` | `POST /storage/upload/profile-image` | Upload to Supabase Storage |
| `POST /storage/upload/chat-media` | `POST /storage/upload/chat-media` | Upload to Supabase Storage |

## Realtime Features

Supabase provides built-in realtime capabilities:

```typescript
// Subscribe to new messages
const subscription = supabase
  .channel('messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `match_id=eq.${matchId}`
  }, (payload) => {
    console.log('New message:', payload)
  })
  .subscribe()
```

## Security

- **Row Level Security (RLS)**: All tables have RLS enabled with appropriate policies
- **Authentication**: Supabase handles JWT tokens and session management
- **Storage**: Files are secured with bucket policies
- **API Keys**: Use `SUPABASE_SERVICE_ROLE_KEY` for server-side operations only

## Migration Steps

1. ✅ Update environment variables
2. ✅ Create Supabase project and run schema
3. ✅ Update backend authentication
4. ✅ Update storage service
5. ✅ Update frontend client
6. 🔄 Test all features
7. 🔄 Deploy to production

## Benefits of Supabase Migration

- **Reduced Infrastructure**: No need to manage separate auth, database, and storage services
- **Built-in Security**: RLS, JWT handling, and secure file uploads
- **Realtime**: Built-in websocket support for live features
- **Scalability**: Supabase handles scaling automatically
- **Developer Experience**: Rich client libraries and dashboard
- **Cost Effective**: Single platform for multiple services

## Troubleshooting

### Common Issues

1. **"Can't resolve '@/types/supabase'"**
   - Ensure you created the `types/supabase.ts` file

2. **Database connection fails**
   - Check your `DATABASE_URL` in the backend `.env`
   - Ensure the password is URL-encoded if it contains special characters

3. **Storage uploads fail**
   - Verify storage buckets were created in Supabase dashboard
   - Check RLS policies allow uploads

4. **Authentication not working**
   - Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct
   - Check Supabase Auth settings in dashboard

### Getting Help

- Supabase Documentation: [supabase.com/docs](https://supabase.com/docs)
- Community Discord: [supabase.com/discord](https://supabase.com/discord)
- GitHub Issues: [github.com/supabase/supabase](https://github.com/supabase/supabase)

## Next Steps

After migration:
1. Set up Supabase Edge Functions for advanced features
2. Configure monitoring and analytics
3. Set up automated backups
4. Implement advanced security features
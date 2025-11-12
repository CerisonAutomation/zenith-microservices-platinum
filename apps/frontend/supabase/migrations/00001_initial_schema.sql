-- ============================================
-- ZENITH DATING PLATFORM - INITIAL SCHEMA
-- Migration: 00001_initial_schema
-- Created: 2025-11-12
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- ============================================
-- USERS & PROFILES
-- ============================================

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'non-binary', 'other')),
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  city TEXT,
  country TEXT,

  -- Premium features
  is_premium BOOLEAN DEFAULT FALSE,
  premium_expires_at TIMESTAMPTZ,
  subscription_tier TEXT CHECK (subscription_tier IN ('free', 'basic', 'premium', 'elite')),

  -- Account status
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  is_banned BOOLEAN DEFAULT FALSE,
  ban_reason TEXT,
  banned_at TIMESTAMPTZ,
  banned_by UUID REFERENCES public.users(id),

  -- Privacy settings
  show_age BOOLEAN DEFAULT TRUE,
  show_location BOOLEAN DEFAULT TRUE,
  show_online_status BOOLEAN DEFAULT TRUE,

  -- Metadata
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profile details
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- About
  tagline TEXT,
  occupation TEXT,
  education TEXT,
  height_cm INTEGER,
  ethnicity TEXT,
  religion TEXT,
  smoking TEXT CHECK (smoking IN ('never', 'sometimes', 'regularly')),
  drinking TEXT CHECK (drinking IN ('never', 'socially', 'regularly')),

  -- Interests (stored as JSONB array)
  interests JSONB DEFAULT '[]'::JSONB,
  languages JSONB DEFAULT '[]'::JSONB,

  -- Looking for
  looking_for TEXT CHECK (looking_for IN ('relationship', 'dating', 'friends', 'networking')),
  relationship_status TEXT,
  has_children BOOLEAN,
  wants_children BOOLEAN,

  -- Verification
  verified_photo BOOLEAN DEFAULT FALSE,
  verified_id BOOLEAN DEFAULT FALSE,
  verified_income BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

-- ============================================
-- PHOTOS & MEDIA
-- ============================================

CREATE TABLE IF NOT EXISTS public.photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  url TEXT NOT NULL,
  thumbnail_url TEXT,
  storage_path TEXT NOT NULL,

  is_primary BOOLEAN DEFAULT FALSE,
  position INTEGER DEFAULT 0,

  -- Moderation
  is_approved BOOLEAN DEFAULT FALSE,
  is_flagged BOOLEAN DEFAULT FALSE,
  flagged_reason TEXT,
  moderated_at TIMESTAMPTZ,
  moderated_by UUID REFERENCES public.users(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MATCHING & PREFERENCES
-- ============================================

CREATE TABLE IF NOT EXISTS public.preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Age range
  min_age INTEGER DEFAULT 18,
  max_age INTEGER DEFAULT 99,

  -- Distance
  max_distance_km INTEGER DEFAULT 50,

  -- Gender preference
  gender_preference TEXT[] DEFAULT ARRAY['male', 'female'],

  -- Dealbreakers
  must_have_photo BOOLEAN DEFAULT TRUE,
  must_be_verified BOOLEAN DEFAULT FALSE,

  -- Other preferences stored as JSONB
  additional_filters JSONB DEFAULT '{}'::JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

-- Swipes/Likes
CREATE TABLE IF NOT EXISTS public.swipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  action TEXT NOT NULL CHECK (action IN ('like', 'dislike', 'superlike')),

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, target_user_id)
);

-- Matches (mutual likes)
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  matched_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,

  -- Track who unmatched
  unmatched_by UUID REFERENCES public.users(id),
  unmatched_at TIMESTAMPTZ,

  CONSTRAINT different_users CHECK (user1_id < user2_id),
  UNIQUE(user1_id, user2_id)
);

-- Favorites/Bookmarks
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  favorited_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, favorited_user_id)
);

-- ============================================
-- MESSAGING
-- ============================================

CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,

  -- Participants
  user1_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Last message info
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,

  -- Read status
  user1_last_read_at TIMESTAMPTZ,
  user2_last_read_at TIMESTAMPTZ,

  -- Archive/mute
  user1_archived BOOLEAN DEFAULT FALSE,
  user2_archived BOOLEAN DEFAULT FALSE,
  user1_muted BOOLEAN DEFAULT FALSE,
  user2_muted BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT different_users CHECK (user1_id < user2_id),
  UNIQUE(user1_id, user2_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,

  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'text' CHECK (content_type IN ('text', 'image', 'gif', 'voice')),

  -- Media attachments
  media_url TEXT,
  media_thumbnail_url TEXT,

  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,

  -- Moderation
  is_flagged BOOLEAN DEFAULT FALSE,
  flagged_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BOOKINGS & EVENTS
-- ============================================

CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  booked_with_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  event_type TEXT NOT NULL CHECK (event_type IN ('coffee', 'dinner', 'activity', 'video_call', 'other')),
  title TEXT NOT NULL,
  description TEXT,

  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  location TEXT,

  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),

  -- Payment (for premium features)
  requires_payment BOOLEAN DEFAULT FALSE,
  payment_amount DECIMAL(10, 2),
  payment_status TEXT CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PAYMENTS & SUBSCRIPTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  tier TEXT NOT NULL CHECK (tier IN ('basic', 'premium', 'elite')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'paused')),

  -- Billing
  billing_interval TEXT CHECK (billing_interval IN ('monthly', 'quarterly', 'yearly')),
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',

  -- Dates
  started_at TIMESTAMPTZ DEFAULT NOW(),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancelled_at TIMESTAMPTZ,

  -- Stripe integration
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  type TEXT NOT NULL CHECK (type IN ('subscription', 'coins', 'boost', 'gift')),
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',

  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),

  -- Payment provider
  provider TEXT CHECK (provider IN ('stripe', 'paypal', 'apple', 'google')),
  provider_transaction_id TEXT,

  -- Metadata
  description TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.wallet (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  balance_coins INTEGER DEFAULT 0,
  total_spent DECIMAL(10, 2) DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

-- ============================================
-- NOTIFICATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  type TEXT NOT NULL CHECK (type IN ('match', 'message', 'like', 'visit', 'booking', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,

  -- Associated records
  related_user_id UUID REFERENCES public.users(id),
  related_entity_type TEXT,
  related_entity_id UUID,

  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,

  -- Actions
  action_url TEXT,
  action_label TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SAFETY & MODERATION
-- ============================================

CREATE TABLE IF NOT EXISTS public.blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  blocked_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, blocked_user_id)
);

CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  reason TEXT NOT NULL CHECK (reason IN ('inappropriate_content', 'harassment', 'spam', 'fake_profile', 'underage', 'other')),
  description TEXT,

  -- Evidence
  evidence_urls JSONB DEFAULT '[]'::JSONB,

  -- Moderation
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES public.users(id),
  reviewed_at TIMESTAMPTZ,
  resolution TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ANALYTICS & TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS public.profile_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  viewer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  viewed_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  viewed_at TIMESTAMPTZ DEFAULT NOW(),

  -- Track unique views per day
  UNIQUE(viewer_id, viewed_user_id, DATE(viewed_at))
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,

  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,

  -- Request info
  ip_address INET,
  user_agent TEXT,

  -- Changes
  old_values JSONB,
  new_values JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Users
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_location ON public.users(location_lat, location_lng);
CREATE INDEX idx_users_premium ON public.users(is_premium) WHERE is_premium = true;
CREATE INDEX idx_users_active ON public.users(is_active) WHERE is_active = true;
CREATE INDEX idx_users_last_seen ON public.users(last_seen_at DESC);

-- Photos
CREATE INDEX idx_photos_user ON public.photos(user_id);
CREATE INDEX idx_photos_primary ON public.photos(user_id) WHERE is_primary = true;

-- Swipes
CREATE INDEX idx_swipes_user ON public.swipes(user_id, created_at DESC);
CREATE INDEX idx_swipes_target ON public.swipes(target_user_id);
CREATE INDEX idx_swipes_action ON public.swipes(action);

-- Matches
CREATE INDEX idx_matches_user1 ON public.matches(user1_id, matched_at DESC);
CREATE INDEX idx_matches_user2 ON public.matches(user2_id, matched_at DESC);
CREATE INDEX idx_matches_active ON public.matches(is_active) WHERE is_active = true;

-- Messages
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX idx_messages_unread ON public.messages(receiver_id) WHERE is_read = false;

-- Conversations
CREATE INDEX idx_conversations_user1 ON public.conversations(user1_id, last_message_at DESC);
CREATE INDEX idx_conversations_user2 ON public.conversations(user2_id, last_message_at DESC);

-- Notifications
CREATE INDEX idx_notifications_user ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id) WHERE is_read = false;

-- Profile views
CREATE INDEX idx_profile_views_viewed ON public.profile_views(viewed_user_id, viewed_at DESC);

-- Audit logs
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);

-- Text search indexes
CREATE INDEX idx_users_full_name_trgm ON public.users USING gin(full_name gin_trgm_ops);
CREATE INDEX idx_profiles_interests_gin ON public.profiles USING gin(interests);

-- ============================================
-- INITIAL DATA
-- ============================================

-- Insert default preferences for existing users
INSERT INTO public.preferences (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- Insert default wallet for existing users
INSERT INTO public.wallet (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

COMMENT ON TABLE public.users IS 'Extended user profiles with location and premium features';
COMMENT ON TABLE public.matches IS 'Mutual likes between users';
COMMENT ON TABLE public.messages IS 'Chat messages between matched users';
COMMENT ON TABLE public.audit_logs IS 'Audit trail for important actions';

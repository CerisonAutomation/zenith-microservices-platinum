-- ============================================================================
-- ZENITH DATING APP - COMPLETE DATABASE SCHEMA
-- Ultra-secure, performant, GDPR-compliant
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy search

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  user_mode TEXT CHECK (user_mode IN ('looking_for_boyfriend', 'become_boyfriend')) NOT NULL,

  -- Basic Info
  username TEXT UNIQUE NOT NULL CHECK (LENGTH(username) >= 3 AND LENGTH(username) <= 20),
  display_name TEXT NOT NULL CHECK (LENGTH(display_name) >= 1),
  age INTEGER NOT NULL CHECK (age >= 18 AND age <= 99),
  bio TEXT CHECK (LENGTH(bio) >= 10 AND LENGTH(bio) <= 500),

  -- Location (PostGIS for geo queries)
  city TEXT NOT NULL,
  state TEXT,
  country CHAR(2) NOT NULL,
  location GEOGRAPHY(POINT, 4326), -- Lat/lng for distance queries

  -- Physical
  body_types TEXT[] NOT NULL CHECK (array_length(body_types, 1) >= 1),
  height INTEGER CHECK (height >= 120 AND height <= 250), -- cm
  weight INTEGER CHECK (weight >= 40 AND weight <= 200), -- kg
  ethnicity TEXT[],

  -- Kinks & Preferences (JSONB for flexible querying)
  kinks JSONB NOT NULL,
  relationship_goals TEXT[] NOT NULL,
  looking_for TEXT[],
  age_range_min INTEGER CHECK (age_range_min >= 18),
  age_range_max INTEGER CHECK (age_range_max <= 99),

  -- Verification
  verified_email BOOLEAN DEFAULT FALSE,
  verified_phone BOOLEAN DEFAULT FALSE,
  verified_photo BOOLEAN DEFAULT FALSE,
  verified_id BOOLEAN DEFAULT FALSE,

  -- Premium
  is_premium BOOLEAN DEFAULT FALSE,
  premium_expiry TIMESTAMPTZ,

  -- Stats
  response_rate INTEGER DEFAULT 0 CHECK (response_rate >= 0 AND response_rate <= 100),
  avg_response_time INTEGER, -- minutes
  last_active TIMESTAMPTZ DEFAULT NOW(),
  profile_views INTEGER DEFAULT 0,
  total_matches INTEGER DEFAULT 0,

  -- Availability (for Become a Boyfriend mode)
  hourly_rate NUMERIC(10, 2),
  currency TEXT DEFAULT 'USD',
  available_days TEXT[],
  services TEXT[],
  can_host BOOLEAN DEFAULT FALSE,
  will_travel BOOLEAN DEFAULT FALSE,
  max_travel_distance INTEGER,

  -- Safety
  reports_count INTEGER DEFAULT 0,
  blocked_users UUID[] DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Full text search
  search_vector TSVECTOR
);

-- Indexes for performance (CRITICAL)
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_location ON profiles USING GIST(location);
CREATE INDEX idx_profiles_last_active ON profiles(last_active DESC);
CREATE INDEX idx_profiles_is_premium ON profiles(is_premium) WHERE is_premium = TRUE;
CREATE INDEX idx_profiles_body_types ON profiles USING GIN(body_types);
CREATE INDEX idx_profiles_kinks ON profiles USING GIN(kinks);
CREATE INDEX idx_profiles_search ON profiles USING GIN(search_vector);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PHOTOS TABLE
-- ============================================================================
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  is_public BOOLEAN DEFAULT TRUE,
  is_verification_photo BOOLEAN DEFAULT FALSE,
  width INTEGER,
  height INTEGER,
  blurhash TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(profile_id, "order")
);

CREATE INDEX idx_photos_profile_id ON photos(profile_id);
CREATE INDEX idx_photos_is_public ON photos(is_public);

-- ============================================================================
-- HIDDEN ALBUMS TABLE
-- ============================================================================
CREATE TABLE hidden_albums (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  requires_premium BOOLEAN DEFAULT TRUE,
  shared_with UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hidden_albums_profile_id ON hidden_albums(profile_id);

-- ============================================================================
-- MATCHES TABLE
-- ============================================================================
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(user_id) NOT NULL,
  matched_user_id UUID REFERENCES profiles(user_id) NOT NULL,
  matched_at TIMESTAMPTZ DEFAULT NOW(),
  initiated_by UUID NOT NULL,
  conversation_id UUID,
  unmatched BOOLEAN DEFAULT FALSE,

  UNIQUE(user_id, matched_user_id)
);

CREATE INDEX idx_matches_user_id ON matches(user_id);
CREATE INDEX idx_matches_matched_user_id ON matches(matched_user_id);
CREATE INDEX idx_matches_matched_at ON matches(matched_at DESC);

-- ============================================================================
-- SWIPES TABLE (for daily limit tracking)
-- ============================================================================
CREATE TABLE swipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(user_id) NOT NULL,
  target_user_id UUID REFERENCES profiles(user_id) NOT NULL,
  type TEXT CHECK (type IN ('like', 'pass', 'super_like')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, target_user_id)
);

CREATE INDEX idx_swipes_user_id_date ON swipes(user_id, created_at DESC);

-- ============================================================================
-- CONVERSATIONS TABLE
-- ============================================================================
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE NOT NULL,
  participants UUID[] NOT NULL,
  unread_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversations_participants ON conversations USING GIN(participants);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);

-- ============================================================================
-- MESSAGES TABLE
-- ============================================================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  content TEXT NOT NULL CHECK (LENGTH(content) >= 1 AND LENGTH(content) <= 1000),
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'video', 'location', 'booking_request')),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  metadata JSONB
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_recipient_unread ON messages(recipient_id, read_at) WHERE read_at IS NULL;

-- ============================================================================
-- BOOKINGS TABLE
-- ============================================================================
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES profiles(user_id) NOT NULL,
  boyfriend_id UUID REFERENCES profiles(user_id) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show', 'disputed')) DEFAULT 'pending',

  date TIMESTAMPTZ NOT NULL CHECK (date > NOW()),
  duration INTEGER NOT NULL CHECK (duration >= 1 AND duration <= 12),

  location_type TEXT CHECK (location_type IN ('host', 'travel', 'public')) NOT NULL,
  location_address TEXT,
  location_coords GEOGRAPHY(POINT, 4326),

  base_rate NUMERIC(10, 2) NOT NULL,
  total NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',

  services TEXT[] NOT NULL,
  notes TEXT CHECK (LENGTH(notes) <= 500),

  requires_id_verification BOOLEAN DEFAULT TRUE,
  requires_deposit BOOLEAN DEFAULT TRUE,
  deposit_amount NUMERIC(10, 2),
  deposit_paid BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,

  CHECK (client_id != boyfriend_id),
  CHECK (deposit_amount IS NULL OR (deposit_amount >= total * 0.2 AND deposit_amount <= total * 0.5))
);

CREATE INDEX idx_bookings_client_id ON bookings(client_id);
CREATE INDEX idx_bookings_boyfriend_id ON bookings(boyfriend_id);
CREATE INDEX idx_bookings_date ON bookings(date DESC);
CREATE INDEX idx_bookings_status ON bookings(status);

-- ============================================================================
-- REVIEWS TABLE
-- ============================================================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID NOT NULL,
  reviewed_user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT CHECK (LENGTH(comment) <= 500),
  would_recommend BOOLEAN DEFAULT TRUE,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(booking_id, reviewer_id)
);

CREATE INDEX idx_reviews_reviewed_user_id ON reviews(reviewed_user_id);
CREATE INDEX idx_reviews_rating ON reviews(rating DESC);

-- ============================================================================
-- REPORTS TABLE
-- ============================================================================
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID REFERENCES profiles(user_id) NOT NULL,
  reported_user_id UUID REFERENCES profiles(user_id) NOT NULL,
  reason TEXT NOT NULL,
  description TEXT NOT NULL CHECK (LENGTH(description) >= 20),
  evidence JSONB,
  status TEXT CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')) DEFAULT 'pending',
  resolution TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,

  CHECK (reporter_id != reported_user_id)
);

CREATE INDEX idx_reports_reported_user_id ON reports(reported_user_id);
CREATE INDEX idx_reports_status ON reports(status);

-- ============================================================================
-- BANS TABLE
-- ============================================================================
CREATE TABLE bans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(user_id) NOT NULL,
  reason TEXT NOT NULL,
  report_id UUID REFERENCES reports(id),
  duration INTEGER NOT NULL, -- days, -1 for permanent
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  appealable BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bans_user_id ON bans(user_id);
CREATE INDEX idx_bans_is_active ON bans(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- SUBSCRIPTIONS TABLE
-- ============================================================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(user_id) NOT NULL,
  plan TEXT CHECK (plan IN ('monthly', 'quarterly', 'yearly')) NOT NULL,
  status TEXT CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')) DEFAULT 'active',
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ NOT NULL,
  auto_renew BOOLEAN DEFAULT TRUE,
  payment_method_type TEXT,
  payment_method_last4 TEXT,
  price NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- ============================================================================
-- GDPR REQUESTS TABLE
-- ============================================================================
CREATE TABLE gdpr_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(user_id) NOT NULL,
  type TEXT CHECK (type IN ('data_export', 'data_deletion', 'rectification', 'objection')) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'rejected')) DEFAULT 'pending',
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  download_url TEXT
);

CREATE INDEX idx_gdpr_requests_user_id ON gdpr_requests(user_id);

-- ============================================================================
-- CONSENT RECORDS TABLE
-- ============================================================================
CREATE TABLE consent_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(user_id) NOT NULL,
  marketing BOOLEAN DEFAULT FALSE,
  analytics BOOLEAN DEFAULT FALSE,
  cookies BOOLEAN DEFAULT FALSE,
  data_sharing_third_party BOOLEAN DEFAULT FALSE,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET NOT NULL
);

CREATE INDEX idx_consent_records_user_id ON consent_records(user_id);

-- ============================================================================
-- NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(user_id) NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id_read ON notifications(user_id, read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================================================
-- USER ACTIVITY TABLE (for analytics & abuse detection)
-- ============================================================================
CREATE TABLE user_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(user_id),
  action TEXT NOT NULL,
  target_id UUID,
  metadata JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX idx_user_activity_user_id ON user_activity(user_id, timestamp DESC);
CREATE INDEX idx_user_activity_action ON user_activity(action);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - CRITICAL FOR SECURITY
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE hidden_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gdpr_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all, but only update their own
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Photos: Public photos viewable by all, private only by owner
CREATE POLICY "Public photos are viewable by everyone"
  ON photos FOR SELECT
  USING (is_public = true OR profile_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

-- Messages: Only participants can view
CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

-- Bookings: Only involved parties can view
CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  USING (client_id = auth.uid() OR boyfriend_id = auth.uid());

-- Add more RLS policies for other tables...

-- ============================================================================
-- FUNCTIONS FOR BUSINESS LOGIC
-- ============================================================================

-- Function to check daily swipe limit
CREATE OR REPLACE FUNCTION check_swipe_limit(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  swipe_count INTEGER;
  is_premium BOOLEAN;
BEGIN
  -- Check if user is premium
  SELECT profiles.is_premium INTO is_premium
  FROM profiles
  WHERE user_id = p_user_id;

  -- Premium users have unlimited swipes
  IF is_premium THEN
    RETURN -1;
  END IF;

  -- Count swipes today
  SELECT COUNT(*) INTO swipe_count
  FROM swipes
  WHERE user_id = p_user_id
    AND created_at >= CURRENT_DATE;

  RETURN 5 - swipe_count; -- 5 swipes per day for free users
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate distance between users
CREATE OR REPLACE FUNCTION calculate_distance(p_user1_id UUID, p_user2_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  distance NUMERIC;
BEGIN
  SELECT ST_Distance(
    p1.location,
    p2.location
  ) / 1000 INTO distance -- Convert to km
  FROM profiles p1, profiles p2
  WHERE p1.user_id = p_user1_id
    AND p2.user_id = p_user2_id;

  RETURN ROUND(distance, 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-ban on multiple reports
CREATE OR REPLACE FUNCTION auto_ban_on_reports()
RETURNS TRIGGER AS $$
BEGIN
  -- If user has 5+ reports, auto-ban for 7 days
  UPDATE profiles
  SET reports_count = reports_count + 1
  WHERE user_id = NEW.reported_user_id;

  IF (SELECT reports_count FROM profiles WHERE user_id = NEW.reported_user_id) >= 5 THEN
    INSERT INTO bans (user_id, reason, duration, report_id)
    VALUES (NEW.reported_user_id, 'Automatic ban due to multiple reports', 7, NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_ban
  AFTER INSERT ON reports
  FOR EACH ROW
  EXECUTE FUNCTION auto_ban_on_reports();

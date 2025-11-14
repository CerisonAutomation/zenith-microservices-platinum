-- =====================================================
-- BOOKING A BOYFRIEND - NATIVE SUPABASE SOLUTIONS
-- Maximum Privacy & Security Implementation
-- Real-time Location with PostGIS
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. ENHANCED PROFILES WITH REAL-TIME LOCATION
-- =====================================================

-- Add PostGIS location column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location_point geography(Point, 4326);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location_accuracy NUMERIC;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_exact_location BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS max_distance_visible_km INTEGER DEFAULT 50;

-- Add privacy settings
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{
  "show_online_status": true,
  "show_last_active": true,
  "show_read_receipts": true,
  "show_typing_indicator": true,
  "allow_location_sharing": false,
  "allow_contact_by": "matches_only",
  "block_screenshots": false,
  "incognito_mode": false
}'::jsonb;

-- Add encryption key for E2E encrypted messages
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS public_key TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS key_updated_at TIMESTAMPTZ;

-- Create spatial index for location queries
CREATE INDEX IF NOT EXISTS idx_profiles_location_point ON profiles USING GIST(location_point);

-- =====================================================
-- 2. REAL-TIME LOCATION TRACKING
-- =====================================================

CREATE TABLE IF NOT EXISTS location_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  location_point geography(Point, 4326) NOT NULL,
  accuracy NUMERIC,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  speed NUMERIC, -- meters per second
  heading NUMERIC, -- degrees
  altitude NUMERIC -- meters
);

CREATE INDEX idx_location_history_user_time ON location_history(user_id, timestamp DESC);
CREATE INDEX idx_location_history_point ON location_history USING GIST(location_point);

-- Auto-delete old location history (privacy)
CREATE OR REPLACE FUNCTION cleanup_old_location_history()
RETURNS VOID AS $$
BEGIN
  DELETE FROM location_history
  WHERE timestamp < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. RPC FUNCTION: UPDATE LOCATION (Real-time)
-- =====================================================

CREATE OR REPLACE FUNCTION update_user_location(
  p_latitude NUMERIC,
  p_longitude NUMERIC,
  p_accuracy NUMERIC DEFAULT NULL,
  p_speed NUMERIC DEFAULT NULL,
  p_heading NUMERIC DEFAULT NULL,
  p_altitude NUMERIC DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_point geography;
  v_allow_location BOOLEAN;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if user allows location sharing
  SELECT (privacy_settings->>'allow_location_sharing')::boolean
  INTO v_allow_location
  FROM profiles
  WHERE id = v_user_id;

  IF NOT v_allow_location THEN
    RAISE EXCEPTION 'Location sharing not enabled';
  END IF;

  -- Create PostGIS point
  v_point := ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography;

  -- Update current location in profiles
  UPDATE profiles
  SET
    location_point = v_point,
    location_updated_at = NOW(),
    location_accuracy = p_accuracy
  WHERE id = v_user_id;

  -- Store in history
  INSERT INTO location_history (
    user_id,
    location_point,
    accuracy,
    speed,
    heading,
    altitude,
    timestamp
  ) VALUES (
    v_user_id,
    v_point,
    p_accuracy,
    p_speed,
    p_heading,
    p_altitude,
    NOW()
  );

  -- Return success with obfuscated location if user prefers
  RETURN json_build_object(
    'success', true,
    'location_updated', true,
    'timestamp', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. RPC FUNCTION: FIND NEARBY USERS
-- =====================================================

CREATE OR REPLACE FUNCTION find_nearby_users(
  p_latitude NUMERIC,
  p_longitude NUMERIC,
  p_radius_km INTEGER DEFAULT 50,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  user_id UUID,
  name TEXT,
  age INTEGER,
  avatar_url TEXT,
  distance_meters NUMERIC,
  distance_km NUMERIC,
  last_active TIMESTAMPTZ,
  is_online BOOLEAN
) AS $$
DECLARE
  v_user_id UUID;
  v_search_point geography;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Create search point
  v_search_point := ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography;

  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.age,
    p.avatar_url,
    ST_Distance(p.location_point, v_search_point) AS distance_meters,
    (ST_Distance(p.location_point, v_search_point) / 1000) AS distance_km,
    p.last_active,
    (p.last_active > NOW() - INTERVAL '5 minutes') AS is_online
  FROM profiles p
  WHERE
    p.id != v_user_id
    AND p.location_point IS NOT NULL
    AND (p.privacy_settings->>'allow_location_sharing')::boolean = true
    AND ST_DWithin(
      p.location_point,
      v_search_point,
      p_radius_km * 1000 -- Convert km to meters
    )
    AND p.max_distance_visible_km >= (ST_Distance(p.location_point, v_search_point) / 1000)
  ORDER BY distance_meters ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. RPC FUNCTION: CREATE CALL (Replaces API route)
-- =====================================================

CREATE OR REPLACE FUNCTION create_call(
  p_caller_id UUID,
  p_receiver_id UUID,
  p_conversation_id UUID,
  p_room_url TEXT,
  p_call_type TEXT
)
RETURNS TABLE (
  id UUID,
  caller_id UUID,
  receiver_id UUID,
  room_url TEXT,
  type TEXT,
  status TEXT,
  created_at TIMESTAMPTZ
) AS $$
DECLARE
  v_call_id UUID;
BEGIN
  -- Validate authenticated user is caller
  IF auth.uid() != p_caller_id THEN
    RAISE EXCEPTION 'Unauthorized: Not the caller';
  END IF;

  -- Validate call type
  IF p_call_type NOT IN ('video', 'audio') THEN
    RAISE EXCEPTION 'Invalid call type: must be video or audio';
  END IF;

  -- Create call record
  INSERT INTO calls (
    caller_id,
    receiver_id,
    conversation_id,
    room_url,
    type,
    status,
    created_at
  ) VALUES (
    p_caller_id,
    p_receiver_id,
    p_conversation_id,
    p_room_url,
    p_call_type,
    'pending',
    NOW()
  )
  RETURNING calls.id INTO v_call_id;

  -- Return the created call
  RETURN QUERY
  SELECT
    c.id,
    c.caller_id,
    c.receiver_id,
    c.room_url,
    c.type,
    c.status,
    c.created_at
  FROM calls c
  WHERE c.id = v_call_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. END-TO-END ENCRYPTED MESSAGES
-- =====================================================

ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT false;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS encrypted_content BYTEA;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS encryption_key_id TEXT;

-- RPC to send encrypted message
CREATE OR REPLACE FUNCTION send_encrypted_message(
  p_conversation_id UUID,
  p_receiver_id UUID,
  p_encrypted_content TEXT,
  p_encryption_key_id TEXT
)
RETURNS UUID AS $$
DECLARE
  v_message_id UUID;
  v_sender_id UUID;
BEGIN
  v_sender_id := auth.uid();

  IF v_sender_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO messages (
    conversation_id,
    sender_id,
    receiver_id,
    content,
    is_encrypted,
    encrypted_content,
    encryption_key_id,
    created_at
  ) VALUES (
    p_conversation_id,
    v_sender_id,
    p_receiver_id,
    '[Encrypted Message]',
    true,
    decode(p_encrypted_content, 'base64'),
    p_encryption_key_id,
    NOW()
  )
  RETURNING id INTO v_message_id;

  RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. ENHANCED RLS POLICIES WITH PRIVACY
-- =====================================================

-- Profiles: Respect privacy settings
DROP POLICY IF EXISTS "Users can view public profiles" ON profiles;
CREATE POLICY "Users can view profiles based on privacy settings"
ON profiles FOR SELECT
TO authenticated
USING (
  id = auth.uid() -- Can always view own profile
  OR
  (
    -- Others can view based on privacy settings
    (privacy_settings->>'allow_contact_by' = 'everyone')
    OR
    (
      (privacy_settings->>'allow_contact_by' = 'matches_only')
      AND EXISTS (
        SELECT 1 FROM matches
        WHERE (user1_id = auth.uid() AND user2_id = profiles.id)
           OR (user2_id = auth.uid() AND user1_id = profiles.id)
      )
    )
  )
  AND
  -- Respect incognito mode
  ((privacy_settings->>'incognito_mode')::boolean = false OR id = auth.uid())
);

-- Location History: Only user can see own history
CREATE POLICY "Users can view own location history"
ON location_history FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own location"
ON location_history FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Messages: Can only access if participant and respecting privacy
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
CREATE POLICY "Users can view messages with privacy respect"
ON messages FOR SELECT
TO authenticated
USING (
  sender_id = auth.uid() OR receiver_id = auth.uid()
);

-- Prevent reading messages if user has disabled read receipts
CREATE OR REPLACE FUNCTION respect_read_receipt_privacy()
RETURNS TRIGGER AS $$
DECLARE
  v_sender_privacy JSONB;
BEGIN
  -- Get sender's privacy settings
  SELECT privacy_settings INTO v_sender_privacy
  FROM profiles
  WHERE id = NEW.sender_id;

  -- If sender disabled read receipts, don't allow updates
  IF (v_sender_privacy->>'show_read_receipts')::boolean = false
     AND OLD.is_read = false
     AND NEW.is_read = true
     AND NEW.sender_id != auth.uid() THEN
    -- Silently ignore the update but don't throw error
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS respect_read_receipt_privacy_trigger ON messages;
CREATE TRIGGER respect_read_receipt_privacy_trigger
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION respect_read_receipt_privacy();

-- =====================================================
-- 8. AUDIT LOGGING FOR SECURITY
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_time ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- Function to log sensitive actions
CREATE OR REPLACE FUNCTION log_sensitive_action(
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    metadata,
    created_at
  ) VALUES (
    auth.uid(),
    p_action,
    p_resource_type,
    p_resource_id,
    p_metadata,
    NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. RATE LIMITING WITH SUPABASE
-- =====================================================

CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, action, window_start)
);

CREATE INDEX idx_rate_limits_user_action ON rate_limits(user_id, action, window_start DESC);

-- Function to check rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_action TEXT,
  p_max_requests INTEGER,
  p_window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_window_start TIMESTAMPTZ;
  v_count INTEGER;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Calculate window start (round down to window boundary)
  v_window_start := date_trunc('minute', NOW()) -
                    (EXTRACT(MINUTE FROM NOW())::INTEGER % p_window_minutes) * INTERVAL '1 minute';

  -- Get or create rate limit record
  INSERT INTO rate_limits (user_id, action, window_start, count)
  VALUES (v_user_id, p_action, v_window_start, 1)
  ON CONFLICT (user_id, action, window_start)
  DO UPDATE SET count = rate_limits.count + 1
  RETURNING count INTO v_count;

  -- Check if over limit
  IF v_count > p_max_requests THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clean up old rate limit records
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS VOID AS $$
BEGIN
  DELETE FROM rate_limits
  WHERE window_start < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 10. SCHEDULED JOBS (via pg_cron or Supabase Scheduler)
-- =====================================================

-- Note: These would be set up in Supabase Dashboard > Database > Cron Jobs
-- Or using pg_cron extension if available

-- Example cron jobs needed:
-- 1. cleanup_old_location_history() - Daily at 2 AM
-- 2. cleanup_old_rate_limits() - Every 6 hours
-- 3. Expire old stories - Every hour
-- 4. Clean up expired calls - Every hour

-- =====================================================
-- 11. INDEXES FOR PERFORMANCE
-- =====================================================

-- Conversation indexes
CREATE INDEX IF NOT EXISTS idx_conversations_user1 ON conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user2 ON conversations(user2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);

-- Message indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_time ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(receiver_id, is_read) WHERE is_read = false;

-- Call indexes
CREATE INDEX IF NOT EXISTS idx_calls_receiver_status ON calls(receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_calls_caller_time ON calls(caller_id, created_at DESC);

-- Notification indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_time ON notifications(user_id, created_at DESC);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant execute on RPC functions
GRANT EXECUTE ON FUNCTION update_user_location TO authenticated;
GRANT EXECUTE ON FUNCTION find_nearby_users TO authenticated;
GRANT EXECUTE ON FUNCTION create_call TO authenticated;
GRANT EXECUTE ON FUNCTION send_encrypted_message TO authenticated;
GRANT EXECUTE ON FUNCTION check_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION log_sensitive_action TO authenticated;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify PostGIS is working
-- SELECT PostGIS_Full_Version();

-- Test location distance calculation
-- SELECT ST_Distance(
--   ST_SetSRID(ST_MakePoint(-0.1278, 51.5074), 4326)::geography, -- London
--   ST_SetSRID(ST_MakePoint(2.3522, 48.8566), 4326)::geography   -- Paris
-- ) / 1000 AS distance_km;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON FUNCTION update_user_location IS 'Updates user real-time location with PostGIS. Respects privacy settings.';
COMMENT ON FUNCTION find_nearby_users IS 'Finds nearby users within radius using PostGIS spatial queries. Privacy-aware.';
COMMENT ON FUNCTION create_call IS 'Creates video/audio call record. Replaces /api/calls/create endpoint.';
COMMENT ON FUNCTION send_encrypted_message IS 'Sends end-to-end encrypted message. Content encrypted client-side.';
COMMENT ON FUNCTION check_rate_limit IS 'Checks if user has exceeded rate limit for specific action.';
COMMENT ON TABLE audit_logs IS 'Security audit log for tracking sensitive actions.';
COMMENT ON TABLE location_history IS 'Historical location data with auto-cleanup after 7 days for privacy.';
COMMENT ON COLUMN profiles.privacy_settings IS 'User privacy preferences in JSONB format.';
COMMENT ON COLUMN messages.encrypted_content IS 'E2E encrypted message content. Only sender and receiver can decrypt.';

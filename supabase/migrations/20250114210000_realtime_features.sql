-- ============================================================================
-- REAL-TIME FEATURES - Location, Messaging, Presence
-- Created: 2025-11-14
-- Implements: REALTIME_AI_FEATURES_SPEC.md
-- ============================================================================

-- ============================================================================
-- 1. ENHANCE LOCATION TRACKING
-- ============================================================================

-- Add additional fields to location_history
ALTER TABLE location_history
  ADD COLUMN IF NOT EXISTS accuracy FLOAT,
  ADD COLUMN IF NOT EXISTS speed FLOAT,
  ADD COLUMN IF NOT EXISTS heading FLOAT;

-- Add location visibility settings to profiles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'location_visibility') THEN
    CREATE TYPE location_visibility AS ENUM ('always', 'matches_only', 'never');
  END IF;
END $$;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS location_visibility location_visibility DEFAULT 'matches_only',
  ADD COLUMN IF NOT EXISTS share_distance BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS background_updates BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS update_frequency VARCHAR(20) DEFAULT 'periodic' CHECK (update_frequency IN ('realtime', 'periodic', 'manual'));

-- Create materialized view for active users (last 5 minutes)
CREATE MATERIALIZED VIEW IF NOT EXISTS active_users_locations AS
SELECT DISTINCT ON (user_id)
  user_id,
  location,
  accuracy,
  created_at,
  ST_Y(location::geometry) as latitude,
  ST_X(location::geometry) as longitude
FROM location_history
WHERE created_at > NOW() - INTERVAL '5 minutes'
ORDER BY user_id, created_at DESC;

-- Create unique index for CONCURRENT refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_active_users_locations_user
  ON active_users_locations(user_id);

-- Create spatial index
CREATE INDEX IF NOT EXISTS idx_active_users_locations_location
  ON active_users_locations USING GIST(location);

-- Function to refresh active locations
CREATE OR REPLACE FUNCTION refresh_active_locations()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY active_users_locations;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policy for location privacy
DROP POLICY IF EXISTS "Users can view location based on settings" ON location_history;

CREATE POLICY "Users can view location based on settings"
  ON location_history FOR SELECT
  USING (
    -- User can view their own location
    user_id = auth.uid()
    OR
    -- Check visibility settings
    CASE
      -- Always visible
      WHEN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = location_history.user_id
        AND location_visibility = 'always'
      ) THEN true

      -- Visible to matches only
      WHEN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = location_history.user_id
        AND location_visibility = 'matches_only'
      ) THEN EXISTS (
        SELECT 1 FROM matches
        WHERE (user_id = auth.uid() AND matched_user_id = location_history.user_id)
           OR (matched_user_id = auth.uid() AND user_id = location_history.user_id)
        AND status = 'matched'
      )

      -- Never visible
      ELSE false
    END
  );

-- ============================================================================
-- 2. MESSAGE READ RECEIPTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS message_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_message_reads_message ON message_reads(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reads_user ON message_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_message_reads_created ON message_reads(created_at DESC);

-- RLS Policies
ALTER TABLE message_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view read receipts for their messages"
  ON message_reads FOR SELECT
  USING (
    message_id IN (
      SELECT id FROM messages
      WHERE sender_id = auth.uid()
      OR conversation_id IN (
        SELECT id FROM conversations
        WHERE match_id IN (
          SELECT id FROM matches
          WHERE user_id = auth.uid() OR matched_user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can mark messages as read"
  ON message_reads FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND message_id IN (
      SELECT id FROM messages
      WHERE conversation_id IN (
        SELECT id FROM conversations
        WHERE match_id IN (
          SELECT id FROM matches
          WHERE user_id = auth.uid() OR matched_user_id = auth.uid()
        )
      )
    )
  );

-- Function to automatically mark messages as read
CREATE OR REPLACE FUNCTION mark_conversation_read(p_conversation_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO message_reads (message_id, user_id)
  SELECT id, auth.uid()
  FROM messages
  WHERE conversation_id = p_conversation_id
    AND sender_id != auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM message_reads
      WHERE message_id = messages.id AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. PRESENCE & ACTIVITY TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_presence (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'away', 'offline')),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_presence_status ON user_presence(status);
CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON user_presence(last_seen DESC);

-- RLS Policies
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view presence of their matches"
  ON user_presence FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM matches
      WHERE (user_id = auth.uid() AND matched_user_id = user_presence.user_id)
         OR (matched_user_id = auth.uid() AND user_id = user_presence.user_id)
      AND status = 'matched'
    )
  );

CREATE POLICY "Users can update their own presence"
  ON user_presence FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Function to update user presence
CREATE OR REPLACE FUNCTION update_user_presence(p_status VARCHAR(20))
RETURNS void AS $$
BEGIN
  INSERT INTO user_presence (user_id, status, last_seen, updated_at)
  VALUES (auth.uid(), p_status, NOW(), NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET
    status = EXCLUDED.status,
    last_seen = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-update last_seen trigger
CREATE OR REPLACE FUNCTION update_presence_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  IF NEW.status = 'offline' THEN
    NEW.last_seen = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_presence_timestamp ON user_presence;
CREATE TRIGGER trigger_update_presence_timestamp
  BEFORE UPDATE ON user_presence
  FOR EACH ROW
  EXECUTE FUNCTION update_presence_timestamp();

-- ============================================================================
-- 4. AI MODERATION LOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_moderation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('message', 'bio', 'photo', 'profile')),
  content_id UUID,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flagged BOOLEAN NOT NULL,
  categories TEXT[],
  severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high')),
  action VARCHAR(20) CHECK (action IN ('allow', 'warn', 'block', 'review')),
  confidence FLOAT,
  reviewed BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_moderation_user ON ai_moderation_log(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_moderation_flagged ON ai_moderation_log(flagged) WHERE flagged = true;
CREATE INDEX IF NOT EXISTS idx_ai_moderation_action ON ai_moderation_log(action);
CREATE INDEX IF NOT EXISTS idx_ai_moderation_reviewed ON ai_moderation_log(reviewed) WHERE reviewed = false;
CREATE INDEX IF NOT EXISTS idx_ai_moderation_created ON ai_moderation_log(created_at DESC);

-- RLS Policies
ALTER TABLE ai_moderation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own moderation log"
  ON ai_moderation_log FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can insert moderation logs"
  ON ai_moderation_log FOR INSERT
  WITH CHECK (true);

-- Admins can view and update all logs (to be implemented with role-based access)
-- CREATE POLICY "Admins can manage all moderation logs"
--   ON ai_moderation_log FOR ALL
--   USING (auth.jwt() ->> 'role' = 'admin');

-- ============================================================================
-- 5. ENHANCED RPC FUNCTIONS
-- ============================================================================

-- Find nearby users with real-time data
CREATE OR REPLACE FUNCTION find_nearby_users_realtime(
  radius_km FLOAT DEFAULT 10,
  max_results INT DEFAULT 50
)
RETURNS TABLE (
  user_id UUID,
  distance_km FLOAT,
  last_seen TIMESTAMPTZ,
  is_online BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    aul.user_id,
    ST_Distance(
      aul.location::geography,
      (SELECT location FROM profiles WHERE id = auth.uid())::geography
    ) / 1000 AS distance_km,
    aul.created_at as last_seen,
    COALESCE(up.status = 'online', false) as is_online
  FROM active_users_locations aul
  LEFT JOIN user_presence up ON up.user_id = aul.user_id
  WHERE aul.user_id != auth.uid()
    AND ST_DWithin(
      aul.location::geography,
      (SELECT location FROM profiles WHERE id = auth.uid())::geography,
      radius_km * 1000
    )
  ORDER BY distance_km ASC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get unread message count
CREATE OR REPLACE FUNCTION get_unread_count(p_conversation_id UUID DEFAULT NULL)
RETURNS TABLE (
  conversation_id UUID,
  unread_count BIGINT
) AS $$
BEGIN
  IF p_conversation_id IS NOT NULL THEN
    RETURN QUERY
    SELECT
      m.conversation_id,
      COUNT(m.id) as unread_count
    FROM messages m
    WHERE m.conversation_id = p_conversation_id
      AND m.sender_id != auth.uid()
      AND NOT EXISTS (
        SELECT 1 FROM message_reads mr
        WHERE mr.message_id = m.id AND mr.user_id = auth.uid()
      )
    GROUP BY m.conversation_id;
  ELSE
    RETURN QUERY
    SELECT
      m.conversation_id,
      COUNT(m.id) as unread_count
    FROM messages m
    INNER JOIN conversations c ON c.id = m.conversation_id
    WHERE m.sender_id != auth.uid()
      AND c.match_id IN (
        SELECT id FROM matches
        WHERE user_id = auth.uid() OR matched_user_id = auth.uid()
      )
      AND NOT EXISTS (
        SELECT 1 FROM message_reads mr
        WHERE mr.message_id = m.id AND mr.user_id = auth.uid()
      )
    GROUP BY m.conversation_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. CLEANUP FUNCTIONS
-- ============================================================================

-- Cleanup old location history (keep only 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_locations()
RETURNS void AS $$
BEGIN
  DELETE FROM location_history
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup old AI moderation logs (keep only 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_moderation_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM ai_moderation_log
  WHERE created_at < NOW() - INTERVAL '90 days'
    AND reviewed = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set inactive users to offline
CREATE OR REPLACE FUNCTION set_inactive_users_offline()
RETURNS void AS $$
BEGIN
  UPDATE user_presence
  SET status = 'offline'
  WHERE status != 'offline'
    AND updated_at < NOW() - INTERVAL '10 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  v_message_reads_exists BOOLEAN;
  v_user_presence_exists BOOLEAN;
  v_ai_moderation_exists BOOLEAN;
  v_active_view_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'message_reads'
  ) INTO v_message_reads_exists;

  SELECT EXISTS (
    SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_presence'
  ) INTO v_user_presence_exists;

  SELECT EXISTS (
    SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ai_moderation_log'
  ) INTO v_ai_moderation_exists;

  SELECT EXISTS (
    SELECT FROM pg_matviews WHERE schemaname = 'public' AND matviewname = 'active_users_locations'
  ) INTO v_active_view_exists;

  IF v_message_reads_exists AND v_user_presence_exists AND v_ai_moderation_exists AND v_active_view_exists THEN
    RAISE NOTICE '✅ Real-time features migration successful';
    RAISE NOTICE '  ✓ Enhanced location tracking with privacy controls';
    RAISE NOTICE '  ✓ Message read receipts table created';
    RAISE NOTICE '  ✓ User presence system created';
    RAISE NOTICE '  ✓ AI moderation logging created';
    RAISE NOTICE '  ✓ Active users materialized view created';
    RAISE NOTICE '  ✓ RPC functions updated';
    RAISE NOTICE '  ✓ Cleanup functions created';
  ELSE
    RAISE WARNING '⚠️  Some tables/views may not have been created';
    RAISE WARNING '  message_reads: %', v_message_reads_exists;
    RAISE WARNING '  user_presence: %', v_user_presence_exists;
    RAISE WARNING '  ai_moderation_log: %', v_ai_moderation_exists;
    RAISE WARNING '  active_users_locations: %', v_active_view_exists;
  END IF;
END $$;

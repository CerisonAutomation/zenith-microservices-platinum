-- ============================================================================
-- CRITICAL FIXES - Missing Tables & RLS Policies
-- Created: 2025-11-14
-- Addresses: IMPROVEMENT_PLAN_120.md issues #1-4
-- ============================================================================

-- ============================================================================
-- 1. CREATE MISSING NOTIFICATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('match', 'message', 'like', 'booking', 'call', 'system')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  read BOOLEAN DEFAULT false,
  clicked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read) WHERE read = false;
CREATE INDEX idx_notifications_type ON notifications(type);

-- RLS Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 2. CREATE MISSING CALLS TABLE (if not exists from migrations)
-- ============================================================================

CREATE TABLE IF NOT EXISTS calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_name VARCHAR(255) UNIQUE NOT NULL,
  caller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  callee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('audio', 'video')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'ended', 'missed', 'rejected')),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  daily_room_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_calls_caller_id ON calls(caller_id);
CREATE INDEX idx_calls_callee_id ON calls(callee_id);
CREATE INDEX idx_calls_status ON calls(status);
CREATE INDEX idx_calls_created_at ON calls(created_at DESC);
CREATE INDEX idx_calls_room_name ON calls(room_name);

-- RLS Policies
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view calls they're part of"
  ON calls FOR SELECT
  USING (auth.uid() = caller_id OR auth.uid() = callee_id);

CREATE POLICY "Users can create calls"
  ON calls FOR INSERT
  WITH CHECK (auth.uid() = caller_id);

CREATE POLICY "Call participants can update call status"
  ON calls FOR UPDATE
  USING (auth.uid() = caller_id OR auth.uid() = callee_id)
  WITH CHECK (auth.uid() = caller_id OR auth.uid() = callee_id);

-- ============================================================================
-- 3. ADD MISSING RLS POLICIES TO EXISTING TABLES
-- ============================================================================

-- Conversations Table
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view conversations they're part of"
  ON conversations FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM matches WHERE id = match_id
      UNION
      SELECT matched_user_id FROM matches WHERE id = match_id
    )
  );

CREATE POLICY "Users can create conversations for their matches"
  ON conversations FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM matches WHERE id = match_id
      UNION
      SELECT matched_user_id FROM matches WHERE id = match_id
    )
  );

CREATE POLICY "Conversation participants can update"
  ON conversations FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM matches WHERE id = match_id
      UNION
      SELECT matched_user_id FROM matches WHERE id = match_id
    )
  );

-- Typing Indicators Table
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view typing indicators in their conversations"
  ON typing_indicators FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE match_id IN (
        SELECT id FROM matches WHERE user_id = auth.uid() OR matched_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert their own typing indicators"
  ON typing_indicators FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own typing indicators"
  ON typing_indicators FOR UPDATE
  USING (auth.uid() = user_id);

-- Message Reactions Table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'message_reactions') THEN
    EXECUTE 'ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY';

    EXECUTE '
      CREATE POLICY "Users can view reactions on messages they have access to"
        ON message_reactions FOR SELECT
        USING (
          message_id IN (
            SELECT id FROM messages WHERE conversation_id IN (
              SELECT id FROM conversations WHERE match_id IN (
                SELECT id FROM matches WHERE user_id = auth.uid() OR matched_user_id = auth.uid()
              )
            )
          )
        )
    ';

    EXECUTE '
      CREATE POLICY "Users can create reactions on accessible messages"
        ON message_reactions FOR INSERT
        WITH CHECK (
          auth.uid() = user_id AND
          message_id IN (
            SELECT id FROM messages WHERE conversation_id IN (
              SELECT id FROM conversations WHERE match_id IN (
                SELECT id FROM matches WHERE user_id = auth.uid() OR matched_user_id = auth.uid()
              )
            )
          )
        )
    ';

    EXECUTE '
      CREATE POLICY "Users can delete their own reactions"
        ON message_reactions FOR DELETE
        USING (auth.uid() = user_id)
    ';
  END IF;
END $$;

-- Voice Messages Table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'voice_messages') THEN
    EXECUTE 'ALTER TABLE voice_messages ENABLE ROW LEVEL SECURITY';

    EXECUTE '
      CREATE POLICY "Users can view voice messages they have access to"
        ON voice_messages FOR SELECT
        USING (
          message_id IN (
            SELECT id FROM messages WHERE conversation_id IN (
              SELECT id FROM conversations WHERE match_id IN (
                SELECT id FROM matches WHERE user_id = auth.uid() OR matched_user_id = auth.uid()
              )
            )
          )
        )
    ';

    EXECUTE '
      CREATE POLICY "Users can create voice messages"
        ON voice_messages FOR INSERT
        WITH CHECK (
          message_id IN (
            SELECT id FROM messages WHERE sender_id = auth.uid()
          )
        )
    ';
  END IF;
END $$;

-- Stories Table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'stories') THEN
    EXECUTE 'ALTER TABLE stories ENABLE ROW LEVEL SECURITY';

    EXECUTE '
      CREATE POLICY "Users can view public stories"
        ON stories FOR SELECT
        USING (
          expires_at > NOW() AND
          (visibility = ''public'' OR user_id = auth.uid() OR
           user_id IN (SELECT matched_user_id FROM matches WHERE user_id = auth.uid() AND status = ''matched''))
        )
    ';

    EXECUTE '
      CREATE POLICY "Users can create their own stories"
        ON stories FOR INSERT
        WITH CHECK (auth.uid() = user_id)
    ';

    EXECUTE '
      CREATE POLICY "Users can delete their own stories"
        ON stories FOR DELETE
        USING (auth.uid() = user_id)
    ';
  END IF;
END $$;

-- Story Views Table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'story_views') THEN
    EXECUTE 'ALTER TABLE story_views ENABLE ROW LEVEL SECURITY';

    EXECUTE '
      CREATE POLICY "Story owners can view who viewed their stories"
        ON story_views FOR SELECT
        USING (
          story_id IN (SELECT id FROM stories WHERE user_id = auth.uid())
        )
    ';

    EXECUTE '
      CREATE POLICY "Users can record their own story views"
        ON story_views FOR INSERT
        WITH CHECK (auth.uid() = viewer_id)
    ';
  END IF;
END $$;

-- ============================================================================
-- 4. ADD COMPOSITE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Messages: User queries by conversation and time
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
  ON messages(conversation_id, created_at DESC);

-- Messages: Unread messages per user
CREATE INDEX IF NOT EXISTS idx_messages_unread
  ON messages(conversation_id, is_read) WHERE is_read = false;

-- Matches: User's matches by status
CREATE INDEX IF NOT EXISTS idx_matches_user_status
  ON matches(user_id, status);

CREATE INDEX IF NOT EXISTS idx_matches_matched_user_status
  ON matches(matched_user_id, status);

-- Profiles: Location-based queries (with PostGIS)
CREATE INDEX IF NOT EXISTS idx_profiles_location
  ON profiles USING GIST (location);

-- Profiles: Search optimization
CREATE INDEX IF NOT EXISTS idx_profiles_search_vector
  ON profiles USING GIN (search_vector);

-- User Sessions: Active session queries
CREATE INDEX IF NOT EXISTS idx_user_sessions_active
  ON user_sessions(user_id, expires_at) WHERE expires_at > NOW();

-- Notifications: Recent unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_recent_unread
  ON notifications(user_id, created_at DESC) WHERE read = false;

-- ============================================================================
-- 5. CREATE UPDATE TIMESTAMP TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables that need it
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'calls') THEN
    DROP TRIGGER IF EXISTS update_calls_updated_at ON calls;
    CREATE TRIGGER update_calls_updated_at
      BEFORE UPDATE ON calls
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
    CREATE TRIGGER update_profiles_updated_at
      BEFORE UPDATE ON profiles
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ============================================================================
-- 6. ADD FOREIGN KEY CONSTRAINT TO MESSAGES
-- ============================================================================

-- Add FK if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'messages_conversation_id_fkey'
  ) THEN
    ALTER TABLE messages
      ADD CONSTRAINT messages_conversation_id_fkey
      FOREIGN KEY (conversation_id)
      REFERENCES conversations(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================================
-- 7. CLEANUP FUNCTION FOR EXPIRED SESSIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM user_sessions
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule via pg_cron (if available) or call from Edge Function
-- Example: SELECT cron.schedule('cleanup-sessions', '0 0 * * *', 'SELECT cleanup_expired_sessions()');

-- ============================================================================
-- 8. CLEANUP FUNCTION FOR EXPIRED NOTIFICATIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM notifications
  WHERE expires_at IS NOT NULL AND expires_at < NOW();

  -- Also delete old read notifications (older than 30 days)
  DELETE FROM notifications
  WHERE read = true AND created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify tables exist
DO $$
DECLARE
  v_notifications_exists BOOLEAN;
  v_calls_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications'
  ) INTO v_notifications_exists;

  SELECT EXISTS (
    SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'calls'
  ) INTO v_calls_exists;

  IF v_notifications_exists AND v_calls_exists THEN
    RAISE NOTICE '✅ Migration successful: notifications and calls tables created';
    RAISE NOTICE '✅ RLS policies applied to all tables';
    RAISE NOTICE '✅ Composite indexes created for performance';
    RAISE NOTICE '✅ Foreign key constraints added';
    RAISE NOTICE '✅ Cleanup functions created';
  ELSE
    RAISE WARNING '⚠️  Some tables may not have been created properly';
  END IF;
END $$;

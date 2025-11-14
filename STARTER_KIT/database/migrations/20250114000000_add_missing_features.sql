-- Migration: Add missing features (emoji reactions, voice messages, calls, stories)
-- Created: 2025-01-14

-- ============================================
-- 1. MESSAGE REACTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL CHECK (LENGTH(emoji) <= 10),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate reactions (same user, same emoji, same message)
  UNIQUE(message_id, user_id, emoji)
);

-- Indexes for performance
CREATE INDEX idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX idx_message_reactions_user_id ON message_reactions(user_id);
CREATE INDEX idx_message_reactions_created_at ON message_reactions(created_at DESC);

-- RLS Policies
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reactions on their conversations"
  ON message_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE m.id = message_reactions.message_id
        AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can add reactions to messages in their conversations"
  ON message_reactions FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE m.id = message_reactions.message_id
        AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can delete their own reactions"
  ON message_reactions FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- 2. VOICE MESSAGES
-- ============================================

CREATE TABLE IF NOT EXISTS voice_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE UNIQUE,
  audio_url TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL CHECK (duration_seconds > 0 AND duration_seconds <= 300), -- Max 5 minutes
  waveform_data JSONB, -- Store waveform for visualization
  transcription TEXT, -- Optional AI transcription
  file_size_bytes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_voice_messages_message_id ON voice_messages(message_id);
CREATE INDEX idx_voice_messages_created_at ON voice_messages(created_at DESC);

-- RLS Policies
ALTER TABLE voice_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view voice messages in their conversations"
  ON voice_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE m.id = voice_messages.message_id
        AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can create voice messages in their conversations"
  ON voice_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE m.id = voice_messages.message_id
        AND m.sender_id = auth.uid()
        AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  );

-- ============================================
-- 3. CALLS (Video/Voice)
-- ============================================

CREATE TABLE IF NOT EXISTS calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  room_url TEXT NOT NULL,
  room_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('video', 'audio')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ringing', 'ongoing', 'ended', 'missed', 'declined', 'failed')),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure caller and receiver are different
  CHECK (caller_id != receiver_id)
);

-- Indexes
CREATE INDEX idx_calls_caller_id ON calls(caller_id);
CREATE INDEX idx_calls_receiver_id ON calls(receiver_id);
CREATE INDEX idx_calls_conversation_id ON calls(conversation_id);
CREATE INDEX idx_calls_status ON calls(status);
CREATE INDEX idx_calls_created_at ON calls(created_at DESC);

-- RLS Policies
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own calls"
  ON calls FOR SELECT
  USING (caller_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can initiate calls"
  ON calls FOR INSERT
  WITH CHECK (caller_id = auth.uid());

CREATE POLICY "Users can update calls they're part of"
  ON calls FOR UPDATE
  USING (caller_id = auth.uid() OR receiver_id = auth.uid());

-- ============================================
-- 4. STORIES (24-hour posts)
-- ============================================

CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  thumbnail_url TEXT,
  caption TEXT,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',

  -- Ensure expires_at is in the future
  CHECK (expires_at > created_at)
);

-- Indexes
CREATE INDEX idx_stories_user_id ON stories(user_id);
CREATE INDEX idx_stories_expires_at ON stories(expires_at);
CREATE INDEX idx_stories_created_at ON stories(created_at DESC);

-- RLS Policies
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active stories from their matches"
  ON stories FOR SELECT
  USING (
    expires_at > NOW()
    AND (
      user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM matches m
        WHERE ((m.user_id = auth.uid() AND m.matched_user_id = stories.user_id)
           OR (m.matched_user_id = auth.uid() AND m.user_id = stories.user_id))
          AND m.status = 'matched'
      )
    )
  );

CREATE POLICY "Users can create their own stories"
  ON stories FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own stories"
  ON stories FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own stories"
  ON stories FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================
-- 5. STORY VIEWS
-- ============================================

CREATE TABLE IF NOT EXISTS story_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate views
  UNIQUE(story_id, viewer_id)
);

-- Indexes
CREATE INDEX idx_story_views_story_id ON story_views(story_id);
CREATE INDEX idx_story_views_viewer_id ON story_views(viewer_id);
CREATE INDEX idx_story_views_viewed_at ON story_views(viewed_at DESC);

-- RLS Policies
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Story owners can view who viewed their stories"
  ON story_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stories s
      WHERE s.id = story_views.story_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can record their own story views"
  ON story_views FOR INSERT
  WITH CHECK (viewer_id = auth.uid());

-- ============================================
-- 6. GIF MESSAGES (using Giphy)
-- ============================================

CREATE TABLE IF NOT EXISTS gif_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE UNIQUE,
  giphy_id TEXT NOT NULL,
  gif_url TEXT NOT NULL,
  preview_url TEXT,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_gif_messages_message_id ON gif_messages(message_id);

-- RLS Policies
ALTER TABLE gif_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view GIFs in their conversations"
  ON gif_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE m.id = gif_messages.message_id
        AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can send GIFs in their conversations"
  ON gif_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE m.id = gif_messages.message_id
        AND m.sender_id = auth.uid()
        AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  );

-- ============================================
-- 7. FUNCTIONS
-- ============================================

-- Function to automatically delete expired stories
CREATE OR REPLACE FUNCTION delete_expired_stories()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM stories WHERE expires_at <= NOW();
END;
$$;

-- Function to increment story view count
CREATE OR REPLACE FUNCTION increment_story_view_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE stories
  SET view_count = view_count + 1
  WHERE id = NEW.story_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER increment_story_views_trigger
AFTER INSERT ON story_views
FOR EACH ROW
EXECUTE FUNCTION increment_story_view_count();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_calls_updated_at
BEFORE UPDATE ON calls
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_voice_messages_updated_at
BEFORE UPDATE ON voice_messages
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 8. STORAGE BUCKETS
-- ============================================

-- Create storage buckets for new media types
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('voice-messages', 'voice-messages', true),
  ('stories', 'stories', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for voice messages
CREATE POLICY "Users can upload their own voice messages"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'voice-messages'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view voice messages in their conversations"
ON storage.objects FOR SELECT
USING (bucket_id = 'voice-messages');

-- Storage policies for stories
CREATE POLICY "Users can upload their own stories"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'stories'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view stories from their matches"
ON storage.objects FOR SELECT
USING (bucket_id = 'stories');

CREATE POLICY "Users can delete their own stories"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'stories'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE message_reactions IS 'Emoji reactions on messages (❤️, 😂, 👍, etc)';
COMMENT ON TABLE voice_messages IS 'Voice message recordings with optional transcription';
COMMENT ON TABLE calls IS 'Video and audio call sessions using Daily.co';
COMMENT ON TABLE stories IS '24-hour ephemeral posts (Instagram-style stories)';
COMMENT ON TABLE story_views IS 'Track who viewed each story';
COMMENT ON TABLE gif_messages IS 'GIF messages using Giphy API';

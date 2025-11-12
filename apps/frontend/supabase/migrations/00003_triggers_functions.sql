-- ============================================
-- ZENITH DATING PLATFORM - TRIGGERS & FUNCTIONS
-- Migration: 00003_triggers_functions
-- Created: 2025-11-12
-- Purpose: Automated business logic and data integrity
-- ============================================

-- ============================================
-- TIMESTAMP TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_photos_updated_at BEFORE UPDATE ON public.photos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_preferences_updated_at BEFORE UPDATE ON public.preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wallet_updated_at BEFORE UPDATE ON public.wallet
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- MATCHING LOGIC
-- ============================================

-- Function to create match when mutual like occurs
CREATE OR REPLACE FUNCTION public.check_and_create_match()
RETURNS TRIGGER AS $$
DECLARE
  mutual_like_exists BOOLEAN;
  match_id UUID;
BEGIN
  -- Only process 'like' actions
  IF NEW.action != 'like' THEN
    RETURN NEW;
  END IF;

  -- Check if the other user also liked this user
  SELECT EXISTS (
    SELECT 1 FROM public.swipes
    WHERE user_id = NEW.target_user_id
    AND target_user_id = NEW.user_id
    AND action = 'like'
  ) INTO mutual_like_exists;

  -- If mutual like, create a match
  IF mutual_like_exists THEN
    -- Ensure user1_id < user2_id for consistency
    INSERT INTO public.matches (user1_id, user2_id, matched_at)
    VALUES (
      LEAST(NEW.user_id, NEW.target_user_id),
      GREATEST(NEW.user_id, NEW.target_user_id),
      NOW()
    )
    ON CONFLICT (user1_id, user2_id) DO UPDATE
    SET is_active = true, matched_at = NOW()
    RETURNING id INTO match_id;

    -- Create conversation for the match
    INSERT INTO public.conversations (match_id, user1_id, user2_id)
    VALUES (
      match_id,
      LEAST(NEW.user_id, NEW.target_user_id),
      GREATEST(NEW.user_id, NEW.target_user_id)
    )
    ON CONFLICT (user1_id, user2_id) DO NOTHING;

    -- Create notifications for both users
    INSERT INTO public.notifications (user_id, type, title, message, related_user_id)
    VALUES
      (NEW.user_id, 'match', 'New Match!', 'You have a new match', NEW.target_user_id),
      (NEW.target_user_id, 'match', 'New Match!', 'You have a new match', NEW.user_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER create_match_on_mutual_like
  AFTER INSERT ON public.swipes
  FOR EACH ROW
  EXECUTE FUNCTION public.check_and_create_match();

-- ============================================
-- MESSAGE TRIGGERS
-- ============================================

-- Update conversation on new message
CREATE OR REPLACE FUNCTION public.update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(NEW.content, 100),
    updated_at = NOW()
  WHERE id = NEW.conversation_id;

  -- Create notification for receiver
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    related_user_id,
    related_entity_type,
    related_entity_id
  )
  VALUES (
    NEW.receiver_id,
    'message',
    'New Message',
    LEFT(NEW.content, 50),
    NEW.sender_id,
    'message',
    NEW.id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_conversation_on_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_on_message();

-- Mark message as read and update read timestamp
CREATE OR REPLACE FUNCTION public.update_message_read_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_read = true AND OLD.is_read = false THEN
    NEW.read_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_message_read_timestamp
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_message_read_status();

-- ============================================
-- USER MANAGEMENT
-- ============================================

-- Sync auth.users with public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
  );

  -- Create default profile
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id);

  -- Create default preferences
  INSERT INTO public.preferences (user_id)
  VALUES (NEW.id);

  -- Create wallet
  INSERT INTO public.wallet (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Update last seen on any user activity
CREATE OR REPLACE FUNCTION public.update_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET last_seen_at = NOW()
  WHERE id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PHOTO MANAGEMENT
-- ============================================

-- Ensure only one primary photo per user
CREATE OR REPLACE FUNCTION public.ensure_single_primary_photo()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = true THEN
    -- Unset other primary photos for this user
    UPDATE public.photos
    SET is_primary = false
    WHERE user_id = NEW.user_id AND id != NEW.id AND is_primary = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER maintain_single_primary_photo
  BEFORE INSERT OR UPDATE ON public.photos
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_primary_photo();

-- ============================================
-- SUBSCRIPTION MANAGEMENT
-- ============================================

-- Update user premium status based on subscription
CREATE OR REPLACE FUNCTION public.sync_premium_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user premium status
  IF NEW.status = 'active' AND NEW.current_period_end > NOW() THEN
    UPDATE public.users
    SET
      is_premium = true,
      premium_expires_at = NEW.current_period_end,
      subscription_tier = NEW.tier
    WHERE id = NEW.user_id;
  ELSE
    UPDATE public.users
    SET
      is_premium = false,
      premium_expires_at = NULL,
      subscription_tier = 'free'
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_user_premium_status
  AFTER INSERT OR UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_premium_status();

-- Check and expire subscriptions
CREATE OR REPLACE FUNCTION public.expire_subscriptions()
RETURNS void AS $$
BEGIN
  -- Mark subscriptions as expired
  UPDATE public.subscriptions
  SET status = 'expired'
  WHERE status = 'active'
  AND current_period_end < NOW();

  -- Update user premium status for expired subscriptions
  UPDATE public.users u
  SET
    is_premium = false,
    premium_expires_at = NULL,
    subscription_tier = 'free'
  FROM public.subscriptions s
  WHERE u.id = s.user_id
  AND s.status = 'expired';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- WALLET TRANSACTIONS
-- ============================================

-- Update wallet on transaction completion
CREATE OR REPLACE FUNCTION public.update_wallet_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Add coins to wallet if transaction is for coins
    IF NEW.type = 'coins' THEN
      UPDATE public.wallet
      SET balance_coins = balance_coins + (NEW.metadata->>'coins')::INTEGER
      WHERE user_id = NEW.user_id;
    END IF;

    -- Update total spent
    UPDATE public.wallet
    SET total_spent = total_spent + NEW.amount
    WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER process_wallet_transaction
  AFTER INSERT OR UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_wallet_on_transaction();

-- ============================================
-- AUDIT LOGGING
-- ============================================

-- Log important user actions
CREATE OR REPLACE FUNCTION public.log_user_action()
RETURNS TRIGGER AS $$
DECLARE
  action_name TEXT;
BEGIN
  -- Determine action name based on operation
  CASE TG_OP
    WHEN 'INSERT' THEN action_name := TG_TABLE_NAME || '_created';
    WHEN 'UPDATE' THEN action_name := TG_TABLE_NAME || '_updated';
    WHEN 'DELETE' THEN action_name := TG_TABLE_NAME || '_deleted';
  END CASE;

  -- Log to audit table
  INSERT INTO public.audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values
  )
  VALUES (
    auth.uid(),
    action_name,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN row_to_json(NEW) ELSE NULL END
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit logging to sensitive tables
CREATE TRIGGER audit_users_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.log_user_action();

CREATE TRIGGER audit_subscriptions_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.log_user_action();

CREATE TRIGGER audit_transactions_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.log_user_action();

-- ============================================
-- PROFILE VIEWS TRACKING
-- ============================================

-- Log profile view
CREATE OR REPLACE FUNCTION public.log_profile_view(viewed_user UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO public.profile_views (viewer_id, viewed_user_id)
  VALUES (auth.uid(), viewed_user)
  ON CONFLICT (viewer_id, viewed_user_id, DATE(viewed_at)) DO NOTHING;

  -- Create notification for premium users
  IF (SELECT is_premium FROM public.users WHERE id = viewed_user) THEN
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      related_user_id
    )
    VALUES (
      viewed_user,
      'visit',
      'Profile View',
      'Someone viewed your profile',
      auth.uid()
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- MATCHING ALGORITHM HELPERS
-- ============================================

-- Get potential matches based on preferences
CREATE OR REPLACE FUNCTION public.get_potential_matches(
  for_user_id UUID,
  limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
  user_id UUID,
  match_score DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH user_prefs AS (
    SELECT * FROM public.preferences WHERE preferences.user_id = for_user_id
  ),
  target_prefs AS (
    SELECT * FROM public.preferences WHERE preferences.user_id != for_user_id
  )
  SELECT
    u.id as user_id,
    (
      -- Age compatibility (40%)
      CASE
        WHEN u.date_of_birth IS NOT NULL AND
             EXTRACT(YEAR FROM AGE(u.date_of_birth)) BETWEEN user_prefs.min_age AND user_prefs.max_age
        THEN 40
        ELSE 0
      END +
      -- Location proximity (30%)
      CASE
        WHEN u.location_lat IS NOT NULL AND u.location_lng IS NOT NULL AND
             ST_Distance(
               ST_MakePoint(u.location_lng, u.location_lat)::geography,
               ST_MakePoint(
                 (SELECT location_lng FROM public.users WHERE id = for_user_id),
                 (SELECT location_lat FROM public.users WHERE id = for_user_id)
               )::geography
             ) / 1000 <= user_prefs.max_distance_km
        THEN 30
        ELSE 0
      END +
      -- Has photo (20%)
      CASE
        WHEN EXISTS (SELECT 1 FROM public.photos WHERE photos.user_id = u.id AND is_approved = true)
        THEN 20
        ELSE 0
      END +
      -- Is verified (10%)
      CASE WHEN u.is_verified THEN 10 ELSE 0 END
    )::DECIMAL as match_score
  FROM public.users u
  CROSS JOIN user_prefs
  WHERE
    u.id != for_user_id
    AND u.is_active = true
    AND u.is_banned = false
    AND u.gender = ANY(user_prefs.gender_preference)
    -- Not already swiped
    AND NOT EXISTS (
      SELECT 1 FROM public.swipes
      WHERE swipes.user_id = for_user_id AND swipes.target_user_id = u.id
    )
    -- Not blocked
    AND NOT EXISTS (
      SELECT 1 FROM public.blocks
      WHERE (blocks.user_id = for_user_id AND blocks.blocked_user_id = u.id)
         OR (blocks.user_id = u.id AND blocks.blocked_user_id = for_user_id)
    )
  ORDER BY match_score DESC, u.last_seen_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================
-- STATISTICS FUNCTIONS
-- ============================================

-- Get user statistics
CREATE OR REPLACE FUNCTION public.get_user_stats(for_user_id UUID)
RETURNS JSON AS $$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'total_matches', (SELECT COUNT(*) FROM public.matches WHERE user1_id = for_user_id OR user2_id = for_user_id),
    'active_matches', (SELECT COUNT(*) FROM public.matches WHERE (user1_id = for_user_id OR user2_id = for_user_id) AND is_active = true),
    'total_likes_sent', (SELECT COUNT(*) FROM public.swipes WHERE user_id = for_user_id AND action = 'like'),
    'total_likes_received', (SELECT COUNT(*) FROM public.swipes WHERE target_user_id = for_user_id AND action = 'like'),
    'profile_views', (SELECT COUNT(*) FROM public.profile_views WHERE viewed_user_id = for_user_id),
    'messages_sent', (SELECT COUNT(*) FROM public.messages WHERE sender_id = for_user_id),
    'unread_messages', (SELECT COUNT(*) FROM public.messages WHERE receiver_id = for_user_id AND is_read = false)
  ) INTO stats;

  RETURN stats;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================
-- CLEANUP FUNCTIONS
-- ============================================

-- Clean up old notifications
CREATE OR REPLACE FUNCTION public.cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM public.notifications
  WHERE created_at < NOW() - INTERVAL '30 days'
  AND is_read = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clean up old audit logs
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM public.audit_logs
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.check_and_create_match() IS 'Automatically create matches when mutual likes occur';
COMMENT ON FUNCTION public.get_potential_matches(UUID, INTEGER) IS 'Get compatible matches based on user preferences';
COMMENT ON FUNCTION public.get_user_stats(UUID) IS 'Get comprehensive user statistics';

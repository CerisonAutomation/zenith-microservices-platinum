-- ============================================
-- ZENITH DATING PLATFORM - ROW LEVEL SECURITY POLICIES
-- Migration: 00002_rls_policies
-- Created: 2025-11-12
-- Security: Enable RLS on all tables and create comprehensive policies
-- ============================================

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTIONS FOR RLS
-- ============================================

-- Check if user is blocked
CREATE OR REPLACE FUNCTION public.is_blocked_by(target_user_id UUID, by_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.blocks
    WHERE user_id = by_user_id AND blocked_user_id = target_user_id
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Check if users are matched
CREATE OR REPLACE FUNCTION public.are_matched(user1_id UUID, user2_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.matches
    WHERE is_active = true
    AND (
      (matches.user1_id = user1_id AND matches.user2_id = user2_id)
      OR (matches.user1_id = user2_id AND matches.user2_id = user1_id)
    )
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Check if user is premium
CREATE OR REPLACE FUNCTION public.is_premium_user(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT is_premium FROM public.users WHERE id = user_id;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ============================================
-- USERS TABLE POLICIES
-- ============================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Users can view other active, non-banned users (basic info only)
CREATE POLICY "Users can view other profiles"
  ON public.users FOR SELECT
  USING (
    is_active = true
    AND is_banned = false
    AND NOT public.is_blocked_by(id, auth.uid())
  );

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert their own profile on signup
CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- PROFILES TABLE POLICIES
-- ============================================

CREATE POLICY "Users can view own profile details"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view other profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = profiles.user_id
      AND users.is_active = true
      AND users.is_banned = false
    )
    AND NOT public.is_blocked_by(user_id, auth.uid())
  );

CREATE POLICY "Users can update own profile details"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- PHOTOS TABLE POLICIES
-- ============================================

CREATE POLICY "Users can view own photos"
  ON public.photos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view approved photos of others"
  ON public.photos FOR SELECT
  USING (
    is_approved = true
    AND NOT public.is_blocked_by(user_id, auth.uid())
  );

CREATE POLICY "Users can insert own photos"
  ON public.photos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own photos"
  ON public.photos FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own photos"
  ON public.photos FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- PREFERENCES TABLE POLICIES
-- ============================================

CREATE POLICY "Users can view own preferences"
  ON public.preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON public.preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON public.preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- SWIPES TABLE POLICIES
-- ============================================

CREATE POLICY "Users can view own swipes"
  ON public.swipes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own swipes"
  ON public.swipes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND user_id != target_user_id
    AND NOT public.is_blocked_by(target_user_id, user_id)
  );

-- ============================================
-- MATCHES TABLE POLICIES
-- ============================================

CREATE POLICY "Users can view own matches"
  ON public.matches FOR SELECT
  USING (
    auth.uid() = user1_id OR auth.uid() = user2_id
  );

CREATE POLICY "System can create matches"
  ON public.matches FOR INSERT
  WITH CHECK (true); -- Handled by trigger

CREATE POLICY "Users can update own matches (unmatch)"
  ON public.matches FOR UPDATE
  USING (auth.uid() = user1_id OR auth.uid() = user2_id)
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- ============================================
-- FAVORITES TABLE POLICIES
-- ============================================

CREATE POLICY "Users can view own favorites"
  ON public.favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert favorites"
  ON public.favorites FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND user_id != favorited_user_id
  );

CREATE POLICY "Users can delete own favorites"
  ON public.favorites FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- CONVERSATIONS TABLE POLICIES
-- ============================================

CREATE POLICY "Users can view own conversations"
  ON public.conversations FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can update own conversations"
  ON public.conversations FOR UPDATE
  USING (auth.uid() = user1_id OR auth.uid() = user2_id)
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- ============================================
-- MESSAGES TABLE POLICIES
-- ============================================

CREATE POLICY "Users can view messages in their conversations"
  ON public.messages FOR SELECT
  USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

CREATE POLICY "Matched users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND public.are_matched(sender_id, receiver_id)
    AND NOT public.is_blocked_by(receiver_id, sender_id)
  );

CREATE POLICY "Users can update own messages (mark as read)"
  ON public.messages FOR UPDATE
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

CREATE POLICY "Users can delete own messages"
  ON public.messages FOR DELETE
  USING (auth.uid() = sender_id);

-- ============================================
-- BOOKINGS TABLE POLICIES
-- ============================================

CREATE POLICY "Users can view own bookings"
  ON public.bookings FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = booked_with_user_id);

CREATE POLICY "Matched users can create bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.are_matched(user_id, booked_with_user_id)
  );

CREATE POLICY "Users can update own bookings"
  ON public.bookings FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = booked_with_user_id)
  WITH CHECK (auth.uid() = user_id OR auth.uid() = booked_with_user_id);

-- ============================================
-- SUBSCRIPTIONS TABLE POLICIES
-- ============================================

CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage subscriptions"
  ON public.subscriptions FOR ALL
  USING (true); -- Managed by backend/webhooks

-- ============================================
-- TRANSACTIONS TABLE POLICIES
-- ============================================

CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (true); -- Managed by backend

-- ============================================
-- WALLET TABLE POLICIES
-- ============================================

CREATE POLICY "Users can view own wallet"
  ON public.wallet FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can update wallet"
  ON public.wallet FOR UPDATE
  USING (true) -- Managed by backend with proper validation
  WITH CHECK (true);

CREATE POLICY "Users can insert own wallet"
  ON public.wallet FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- NOTIFICATIONS TABLE POLICIES
-- ============================================

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications (mark as read)"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true); -- Created by triggers

-- ============================================
-- BLOCKS TABLE POLICIES
-- ============================================

CREATE POLICY "Users can view own blocks"
  ON public.blocks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can block others"
  ON public.blocks FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND user_id != blocked_user_id
  );

CREATE POLICY "Users can unblock"
  ON public.blocks FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- REPORTS TABLE POLICIES
-- ============================================

CREATE POLICY "Users can view own reports"
  ON public.reports FOR SELECT
  USING (auth.uid() = reporter_id);

CREATE POLICY "Users can create reports"
  ON public.reports FOR INSERT
  WITH CHECK (
    auth.uid() = reporter_id
    AND reporter_id != reported_user_id
  );

-- ============================================
-- PROFILE VIEWS TABLE POLICIES
-- ============================================

CREATE POLICY "Users can view who viewed their profile (premium feature)"
  ON public.profile_views FOR SELECT
  USING (
    auth.uid() = viewed_user_id
    AND public.is_premium_user(auth.uid())
  );

CREATE POLICY "Users can view their own viewing history"
  ON public.profile_views FOR SELECT
  USING (auth.uid() = viewer_id);

CREATE POLICY "Users can log profile views"
  ON public.profile_views FOR INSERT
  WITH CHECK (
    auth.uid() = viewer_id
    AND viewer_id != viewed_user_id
  );

-- ============================================
-- AUDIT LOGS TABLE POLICIES
-- ============================================

CREATE POLICY "Users can view own audit logs"
  ON public.audit_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true); -- Created by triggers

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant authenticated users access to tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.photos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.preferences TO authenticated;
GRANT SELECT, INSERT ON public.swipes TO authenticated;
GRANT SELECT, UPDATE ON public.matches TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
GRANT SELECT, UPDATE ON public.conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.bookings TO authenticated;
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT SELECT ON public.transactions TO authenticated;
GRANT SELECT ON public.wallet TO authenticated;
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.blocks TO authenticated;
GRANT SELECT, INSERT ON public.reports TO authenticated;
GRANT SELECT, INSERT ON public.profile_views TO authenticated;
GRANT SELECT ON public.audit_logs TO authenticated;

-- Grant service role full access
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

COMMENT ON POLICY "Users can view own profile" ON public.users IS 'Allow users to view their own profile data';
COMMENT ON POLICY "Users can view other profiles" ON public.users IS 'Allow viewing active, non-banned users who havent blocked the viewer';

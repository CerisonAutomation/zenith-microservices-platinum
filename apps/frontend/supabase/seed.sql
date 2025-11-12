-- ============================================
-- ZENITH DATING PLATFORM - SEED DATA
-- Purpose: Demo/Development data for testing
-- ============================================

-- Note: This seed data is for development only
-- DO NOT run in production

-- ============================================
-- DEMO USERS (requires auth.users to exist)
-- ============================================

-- Insert demo users (These would normally be created via Supabase Auth)
-- For actual seeding, you'd use Supabase CLI or create via the application

-- Sample interests and languages
INSERT INTO public.profiles (user_id, tagline, occupation, interests, languages, looking_for)
SELECT
  id,
  'Looking for meaningful connections',
  'Software Engineer',
  '["travel", "photography", "hiking", "cooking"]'::jsonb,
  '["English", "Spanish"]'::jsonb,
  'relationship'
FROM auth.users
WHERE email LIKE '%@example.com'
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- DEMO PREFERENCES
-- ============================================

INSERT INTO public.preferences (user_id, min_age, max_age, max_distance_km, gender_preference)
SELECT
  id,
  25,
  40,
  50,
  ARRAY['male', 'female']
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- DEMO WALLETS
-- ============================================

INSERT INTO public.wallet (user_id, balance_coins)
SELECT
  id,
  100
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

COMMENT ON TABLE public.users IS 'Seeded with demo data for development';

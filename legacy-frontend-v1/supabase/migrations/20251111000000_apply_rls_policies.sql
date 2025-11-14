-- ZENITH DATABASE SECURITY DEPLOYMENT
-- RLS POLICY DEFINITION FOR EMERGENT DATING APP
-- PRINCIPLE: SENTINEL SECURITY ABSOLUTISM
-- MANDATE: RLS ON EVERY TABLE. ZERO DATA LEAKS.

-- ============================================================================
-- TABLE: profiles
-- ============================================================================

-- 1. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Policy: Allow authenticated users to read all profiles
-- This is required for the core "browsing" functionality of a dating app.
-- Ensure no overly sensitive data is stored on the profile table itself.
DROP POLICY IF EXISTS "Allow authenticated users to read all profiles" ON public.profiles;
CREATE POLICY "Allow authenticated users to read all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- 3. Policy: Allow users to create their own profile
-- The user_id in the new profile must match the UID of the person creating it.
DROP POLICY IF EXISTS "Allow users to create their own profile" ON public.profiles;
CREATE POLICY "Allow users to create their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 4. Policy: Allow users to update their own profile
-- A user can only update a profile where their UID matches the user_id.
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;
CREATE POLICY "Allow users to update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. Policy: Disallow deleting profiles (for now)
-- Deleting profiles can have cascading issues. We will handle this via a soft-delete
-- mechanism or a secure function in the future. For now, DELETE is denied.
-- An empty `USING (false)` clause denies the action.
DROP POLICY IF EXISTS "Disallow deleting profiles" ON public.profiles;
CREATE POLICY "Disallow deleting profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (false);


-- ============================================================================
-- TABLE: messages
-- ============================================================================

-- 1. Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 2. Policy: Allow users to read messages they sent or received
DROP POLICY IF EXISTS "Allow users to read their own messages" ON public.messages;
CREATE POLICY "Allow users to read their own messages"
ON public.messages
FOR SELECT
TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- 3. Policy: Allow users to send messages
-- A user can only create a message where they are the sender.
DROP POLICY IF EXISTS "Allow users to send messages" ON public.messages;
CREATE POLICY "Allow users to send messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

-- 4. Policy: Allow users to update their own sent messages (e.g., mark as read)
-- Note: This policy allows a user to update ANY field on a message they sent.
-- A more granular approach might be needed later.
DROP POLICY IF EXISTS "Allow users to update their own sent messages" ON public.messages;
CREATE POLICY "Allow users to update their own sent messages"
ON public.messages
FOR UPDATE
TO authenticated
USING (auth.uid() = sender_id)
WITH CHECK (auth.uid() = sender_id);

-- 5. Policy: Allow users to delete their own sent messages
DROP POLICY IF EXISTS "Allow users to delete their own sent messages" ON public.messages;
CREATE POLICY "Allow users to delete their own sent messages"
ON public.messages
FOR DELETE
TO authenticated
USING (auth.uid() = sender_id);


-- ============================================================================
-- TABLE: bookings
-- ============================================================================

-- 1. Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- 2. Policy: Allow involved parties to read a booking
-- A user can see a booking if they created it OR if it's a booking for their profile.
DROP POLICY IF EXISTS "Allow involved parties to read bookings" ON public.bookings;
CREATE POLICY "Allow involved parties to read bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR auth.uid() = (SELECT user_id FROM public.profiles WHERE id = profile_id));

-- 3. Policy: Allow users to create bookings
-- The creator of the booking must be the authenticated user.
DROP POLICY IF EXISTS "Allow users to create bookings" ON public.bookings;
CREATE POLICY "Allow users to create bookings"
ON public.bookings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 4. Policy: Allow involved parties to update a booking
-- A user can update a booking if they created it OR if it's for their profile.
DROP POLICY IF EXISTS "Allow involved parties to update bookings" ON public.bookings;
CREATE POLICY "Allow involved parties to update bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR auth.uid() = (SELECT user_id FROM public.profiles WHERE id = profile_id))
WITH CHECK (auth.uid() = user_id OR auth.uid() = (SELECT user_id FROM public.profiles WHERE id = profile_id));

-- 5. Policy: Allow involved parties to delete/cancel a booking
DROP POLICY IF EXISTS "Allow involved parties to delete bookings" ON public.bookings;
CREATE POLICY "Allow involved parties to delete bookings"
ON public.bookings
FOR DELETE
TO authenticated
USING (auth.uid() = user_id OR auth.uid() = (SELECT user_id FROM public.profiles WHERE id = profile_id));

-- ============================================================================
-- END OF RLS POLICY DEFINITION
-- ============================================================================

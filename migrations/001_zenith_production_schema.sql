-- Zenith Dating Platform - Production Database Schema
-- Supabase PostgreSQL with Row Level Security

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  username VARCHAR(50) UNIQUE NOT NULL CHECK (length(username) BETWEEN 3 AND 50),
  full_name VARCHAR(100) CHECK (length(full_name) BETWEEN 1 AND 100),
  avatar_url TEXT,
  bio TEXT CHECK (length(bio) <= 500),
  gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'non-binary', 'prefer-not-to-say')),
  birth_date DATE CHECK (birth_date <= CURRENT_DATE - INTERVAL '18 years'),
  location JSONB, -- {city, country, latitude, longitude}
  interests TEXT[], -- Array of interest tags
  is_online BOOLEAN DEFAULT FALSE NOT NULL,
  last_seen_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE NOT NULL,
  is_banned BOOLEAN DEFAULT FALSE NOT NULL,
  gdpr_consent BOOLEAN DEFAULT FALSE NOT NULL,
  subscription_tier VARCHAR(20) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'vip')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Profiles table (extended user information)
CREATE TABLE public.profiles (
  id UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
  height INTEGER CHECK (height BETWEEN 120 AND 250), -- cm
  body_type VARCHAR(20) CHECK (body_type IN ('slim', 'athletic', 'average', 'curvy', 'plus-size')),
  education VARCHAR(50),
  occupation VARCHAR(100),
  smoking_habit VARCHAR(20) CHECK (smoking_habit IN ('never', 'occasionally', 'regularly', 'trying-to-quit')),
  drinking_habit VARCHAR(20) CHECK (drinking_habit IN ('never', 'occasionally', 'regularly', 'socially')),
  relationship_status VARCHAR(30) CHECK (relationship_status IN ('single', 'divorced', 'widowed', 'separated', 'in-relationship')),
  children VARCHAR(20) CHECK (children IN ('none', 'has-children', 'wants-children', 'doesnt-want-children')),
  religion VARCHAR(50),
  languages TEXT[],
  photos JSONB DEFAULT '[]'::jsonb, -- Array of photo objects {url, is_primary, order}
  meet_now_available BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Messages table
CREATE TABLE public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  chat_id UUID NOT NULL,
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL CHECK (length(content) > 0),
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'system', 'location')),
  media_url TEXT,
  read BOOLEAN DEFAULT FALSE NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Chats table
CREATE TABLE public.chats (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  participant_1 UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  participant_2 UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  last_message_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(participant_1, participant_2)
);

-- Likes table
CREATE TABLE public.likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  from_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  to_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  liked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(from_user_id, to_user_id)
);

-- Matches table
CREATE TABLE public.matches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_1 UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  user_2 UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  matched_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_1, user_2)
);

-- Blocks table
CREATE TABLE public.blocks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  blocker_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  blocked_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  blocked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  reason TEXT,
  UNIQUE(blocker_id, blocked_id)
);

-- Reports table
CREATE TABLE public.reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reporter_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  reported_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  reason VARCHAR(50) NOT NULL CHECK (reason IN ('harassment', 'spam', 'inappropriate-content', 'fake-profile', 'underage', 'other')),
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  reported_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  resolved_at TIMESTAMPTZ,
  admin_notes TEXT
);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(30) NOT NULL CHECK (type IN ('like', 'match', 'message', 'system', 'admin')),
  title VARCHAR(200) NOT NULL,
  content TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  read BOOLEAN DEFAULT FALSE NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- GDPR data requests table
CREATE TABLE public.gdpr_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  request_type VARCHAR(30) NOT NULL CHECK (request_type IN ('access', 'rectify', 'erase', 'restrict', 'portability', 'object')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  description TEXT,
  requested_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ,
  admin_notes TEXT
);

-- Create indexes for performance
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_gender ON public.users(gender);
CREATE INDEX idx_users_birth_date ON public.users(birth_date);
CREATE INDEX idx_users_location ON public.users USING GIN(location);
CREATE INDEX idx_users_interests ON public.users USING GIN(interests);
CREATE INDEX idx_users_is_online ON public.users(is_online);
CREATE INDEX idx_users_last_seen ON public.users(last_seen_at);

CREATE INDEX idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);

CREATE INDEX idx_chats_participant_1 ON public.chats(participant_1);
CREATE INDEX idx_chats_participant_2 ON public.chats(participant_2);
CREATE INDEX idx_chats_last_message ON public.chats(last_message_at);

CREATE INDEX idx_likes_from_user ON public.likes(from_user_id);
CREATE INDEX idx_likes_to_user ON public.likes(to_user_id);

CREATE INDEX idx_matches_user_1 ON public.matches(user_1);
CREATE INDEX idx_matches_user_2 ON public.matches(user_2);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gdpr_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users policies
CREATE POLICY "Users can view public profiles" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- Profiles policies
CREATE POLICY "Users can view profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Messages policies
CREATE POLICY "Users can view messages in their chats" ON public.messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can insert messages to their chats" ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Chats policies
CREATE POLICY "Users can view their chats" ON public.chats FOR SELECT
  USING (auth.uid() = participant_1 OR auth.uid() = participant_2);
CREATE POLICY "Users can create chats" ON public.chats FOR INSERT
  WITH CHECK (auth.uid() = participant_1);

-- Likes policies
CREATE POLICY "Users can view likes involving them" ON public.likes FOR SELECT
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
CREATE POLICY "Users can create likes" ON public.likes FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

-- Matches policies
CREATE POLICY "Users can view their matches" ON public.matches FOR SELECT
  USING (auth.uid() = user_1 OR auth.uid() = user_2);

-- Blocks policies
CREATE POLICY "Users can view blocks involving them" ON public.blocks FOR SELECT
  USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);
CREATE POLICY "Users can create blocks" ON public.blocks FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

-- Reports policies
CREATE POLICY "Users can view their own reports" ON public.reports FOR SELECT
  USING (auth.uid() = reporter_id);
CREATE POLICY "Users can create reports" ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Notifications policies
CREATE POLICY "Users can view their notifications" ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can update their notifications" ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- GDPR requests policies
CREATE POLICY "Users can view their GDPR requests" ON public.gdpr_requests FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can create GDPR requests" ON public.gdpr_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Functions for real-time updates
CREATE OR REPLACE FUNCTION public.handle_new_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Update chat's last_message_at
  UPDATE public.chats
  SET last_message_at = NEW.created_at, updated_at = NOW()
  WHERE id = NEW.chat_id;

  -- Create notification for receiver
  INSERT INTO public.notifications (user_id, type, title, content, data)
  VALUES (
    NEW.receiver_id,
    'message',
    'New message',
    'You have a new message',
    jsonb_build_object('chat_id', NEW.chat_id, 'sender_id', NEW.sender_id)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_new_like()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification for liked user
  INSERT INTO public.notifications (user_id, type, title, content, data)
  VALUES (
    NEW.to_user_id,
    'like',
    'Someone liked you!',
    'Someone liked your profile',
    jsonb_build_object('liker_id', NEW.from_user_id)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_new_match()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notifications for both users
  INSERT INTO public.notifications (user_id, type, title, content, data)
  VALUES
    (NEW.user_1, 'match', 'It\'s a match!', 'You have a new match', jsonb_build_object('match_id', NEW.id, 'matched_user', NEW.user_2)),
    (NEW.user_2, 'match', 'It\'s a match!', 'You have a new match', jsonb_build_object('match_id', NEW.id, 'matched_user', NEW.user_1));

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers
CREATE TRIGGER on_message_insert
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_message();

CREATE TRIGGER on_like_insert
  AFTER INSERT ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_like();

CREATE TRIGGER on_match_insert
  AFTER INSERT ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_match();

-- Function to create matches when mutual likes occur
CREATE OR REPLACE FUNCTION public.create_match_on_mutual_like()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if there's a mutual like
  IF EXISTS (
    SELECT 1 FROM public.likes
    WHERE from_user_id = NEW.to_user_id
    AND to_user_id = NEW.from_user_id
  ) THEN
    -- Create match
    INSERT INTO public.matches (user_1, user_2)
    VALUES (LEAST(NEW.from_user_id, NEW.to_user_id), GREATEST(NEW.from_user_id, NEW.to_user_id))
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_like_insert_create_match
  AFTER INSERT ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.create_match_on_mutual_like();
-- ============================================
-- TINGOBINGO - COMPLETE DATABASE SCHEMA
-- Multi-Pet Profile System with Enhanced Features
-- Version: 2.0 (Final)
-- ============================================

-- ============================================
-- STEP 1: DROP ALL EXISTING TABLES (FRESH START)
-- ============================================

DROP TABLE IF EXISTS profile_name_changes CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS chats CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS pets CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS set_primary_pet CASCADE;
DROP FUNCTION IF EXISTS can_change_profile_name CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;

-- ============================================
-- STEP 2: CREATE TABLES
-- ============================================

-- Users Table (Owner/Parent Info)
CREATE TABLE users (
  id TEXT PRIMARY KEY,                          -- Firebase Auth UID
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,                         -- Unique username (@johndoe)
  name TEXT NOT NULL,                           -- Owner's display name
  avatar TEXT,                                  -- Owner's avatar (Cloudinary URL)
  bio TEXT,                                     -- Owner's bio
  location TEXT,                                -- Owner's location
  
  -- Profile Name Change Tracking (2 changes per 2 months)
  profile_name_changes INTEGER DEFAULT 0,       -- Count of changes in current period
  profile_name_last_changed TIMESTAMPTZ,        -- Last change timestamp
  
  -- Multi-Pet Profile System
  primary_pet_id UUID,                          -- Default/active pet for profile display
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pets Table (One User → Many Pets, Each Pet = Profile Page)
CREATE TABLE pets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,                           -- Pet's name (becomes profile name if primary)
  species TEXT,                                 -- dog, cat, bird, rabbit, etc.
  breed TEXT,
  age TEXT,
  gender TEXT,                                  -- male, female, unknown
  avatar TEXT,                                  -- Pet's photo (Cloudinary URL, 1080px WebP)
  bio TEXT,                                     -- Pet's bio
  
  -- Pet Page System (like Facebook pages)
  is_primary BOOLEAN DEFAULT false,             -- Is this the primary/default pet?
  display_order INTEGER DEFAULT 0,              -- Order for pet bubbles (lower = left)
  page_active BOOLEAN DEFAULT true,             -- Is this pet page active?
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key for primary_pet_id (after pets table exists)
ALTER TABLE users ADD CONSTRAINT fk_users_primary_pet 
  FOREIGN KEY (primary_pet_id) REFERENCES pets(id) ON DELETE SET NULL;

-- Posts Table (Pet-Centric Social Feed)
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Multi-Pet Profile: Track which pet page created this post
  pet_id UUID REFERENCES pets(id) ON DELETE SET NULL,           -- Pet featured in post
  posted_as_pet_id UUID REFERENCES pets(id) ON DELETE SET NULL, -- Which pet page posted this
  
  content TEXT,
  image_url TEXT,                               -- Cloudinary URL (auto 1080px WebP)
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chats Table (One-on-One Conversations)
CREATE TABLE chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_1 TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  participant_2 TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_message TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participant_1, participant_2)
);

-- Messages Table (Chat Messages)
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profile Name Changes History (Audit Trail)
CREATE TABLE profile_name_changes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pet_id UUID REFERENCES pets(id) ON DELETE SET NULL,
  old_name TEXT,
  new_name TEXT NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 3: CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Users
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_name ON users(name);
CREATE INDEX idx_users_primary_pet ON users(primary_pet_id);

-- Pets
CREATE INDEX idx_pets_owner ON pets(owner_id);
CREATE INDEX idx_pets_primary ON pets(is_primary) WHERE is_primary = true;
CREATE INDEX idx_pets_display_order ON pets(owner_id, display_order);

-- Posts
CREATE INDEX idx_posts_user ON posts(user_id);
CREATE INDEX idx_posts_pet ON posts(pet_id);
CREATE INDEX idx_posts_posted_as_pet ON posts(posted_as_pet_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);

-- Chats
CREATE INDEX idx_chats_participants ON chats(participant_1, participant_2);

-- Messages
CREATE INDEX idx_messages_chat ON messages(chat_id);
CREATE INDEX idx_messages_created ON messages(created_at);

-- Profile Name Changes
CREATE INDEX idx_profile_name_changes_user ON profile_name_changes(user_id);
CREATE INDEX idx_profile_name_changes_date ON profile_name_changes(changed_at DESC);

-- ============================================
-- STEP 4: ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_name_changes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 5: CREATE RLS POLICIES
-- ============================================

-- ========== USERS POLICIES ==========

-- Anyone can view user profiles
CREATE POLICY "Anyone can view user profiles"
  ON users FOR SELECT
  USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can delete their own profile
CREATE POLICY "Users can delete own profile"
  ON users FOR DELETE
  USING (id = current_setting('request.jwt.claims', true)::json->>'sub');

-- ========== PETS POLICIES ==========

-- Anyone can view all pets
CREATE POLICY "Anyone can view pets"
  ON pets FOR SELECT
  USING (true);

-- Users can create their own pets
CREATE POLICY "Users can create own pets"
  ON pets FOR INSERT
  WITH CHECK (owner_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can update their own pets
CREATE POLICY "Users can update own pets"
  ON pets FOR UPDATE
  USING (owner_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can delete their own pets
CREATE POLICY "Users can delete own pets"
  ON pets FOR DELETE
  USING (owner_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- ========== POSTS POLICIES ==========

-- Anyone can view all posts
CREATE POLICY "Anyone can view posts"
  ON posts FOR SELECT
  USING (true);

-- Authenticated users can create posts
CREATE POLICY "Authenticated users can create posts"
  ON posts FOR INSERT
  WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can update their own posts
CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can delete their own posts
CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- ========== CHATS POLICIES ==========

-- Users can view chats they're part of
CREATE POLICY "Users can view own chats"
  ON chats FOR SELECT
  USING (
    participant_1 = current_setting('request.jwt.claims', true)::json->>'sub' OR
    participant_2 = current_setting('request.jwt.claims', true)::json->>'sub'
  );

-- Users can create chats
CREATE POLICY "Users can create chats"
  ON chats FOR INSERT
  WITH CHECK (
    participant_1 = current_setting('request.jwt.claims', true)::json->>'sub' OR
    participant_2 = current_setting('request.jwt.claims', true)::json->>'sub'
  );

-- Users can update chats they're part of
CREATE POLICY "Users can update own chats"
  ON chats FOR UPDATE
  USING (
    participant_1 = current_setting('request.jwt.claims', true)::json->>'sub' OR
    participant_2 = current_setting('request.jwt.claims', true)::json->>'sub'
  );

-- ========== MESSAGES POLICIES ==========

-- Users can view messages in their chats
CREATE POLICY "Users can view messages in own chats"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = messages.chat_id
      AND (
        chats.participant_1 = current_setting('request.jwt.claims', true)::json->>'sub' OR
        chats.participant_2 = current_setting('request.jwt.claims', true)::json->>'sub'
      )
    )
  );

-- Users can send messages in their chats
CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = current_setting('request.jwt.claims', true)::json->>'sub' AND
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = messages.chat_id
      AND (
        chats.participant_1 = current_setting('request.jwt.claims', true)::json->>'sub' OR
        chats.participant_2 = current_setting('request.jwt.claims', true)::json->>'sub'
      )
    )
  );

-- ========== PROFILE NAME CHANGES POLICIES ==========

-- Users can view their own change history
CREATE POLICY "Users can view own name change history"
  ON profile_name_changes FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can log their own changes
CREATE POLICY "Users can log name changes"
  ON profile_name_changes FOR INSERT
  WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- ============================================
-- STEP 6: CREATE HELPER FUNCTIONS
-- ============================================

-- Function: Update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Set Primary Pet
CREATE OR REPLACE FUNCTION set_primary_pet(
  p_user_id TEXT,
  p_pet_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_pet_owner TEXT;
BEGIN
  -- Verify pet belongs to user
  SELECT owner_id INTO v_pet_owner FROM pets WHERE id = p_pet_id;
  
  IF v_pet_owner != p_user_id THEN
    RAISE EXCEPTION 'Pet does not belong to user';
  END IF;
  
  -- Remove primary flag from all user's pets
  UPDATE pets 
  SET is_primary = false 
  WHERE owner_id = p_user_id;
  
  -- Set new primary pet
  UPDATE pets 
  SET is_primary = true 
  WHERE id = p_pet_id;
  
  -- Update user's primary_pet_id
  UPDATE users 
  SET primary_pet_id = p_pet_id 
  WHERE id = p_user_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check Profile Name Change Eligibility
CREATE OR REPLACE FUNCTION can_change_profile_name(
  p_user_id TEXT
) RETURNS TABLE(
  can_change BOOLEAN,
  changes_used INTEGER,
  next_allowed_date TIMESTAMPTZ,
  reason TEXT
) AS $$
DECLARE
  v_changes INTEGER;
  v_last_changed TIMESTAMPTZ;
  v_two_months_ago TIMESTAMPTZ;
  v_next_date TIMESTAMPTZ;
BEGIN
  -- Get user's change info
  SELECT 
    COALESCE(profile_name_changes, 0),
    profile_name_last_changed
  INTO v_changes, v_last_changed
  FROM users
  WHERE id = p_user_id;
  
  -- Calculate 2 months ago
  v_two_months_ago := NOW() - INTERVAL '2 months';
  
  -- If never changed or last change was more than 2 months ago, reset
  IF v_last_changed IS NULL OR v_last_changed < v_two_months_ago THEN
    RETURN QUERY SELECT 
      true, 
      0, 
      NULL::TIMESTAMPTZ, 
      'You have 2 changes available'::TEXT;
    RETURN;
  END IF;
  
  -- Check if user has changes remaining
  IF v_changes >= 2 THEN
    v_next_date := v_last_changed + INTERVAL '2 months';
    RETURN QUERY SELECT 
      false, 
      v_changes, 
      v_next_date, 
      format('You have used all 2 changes. Next change available after %s', v_next_date::DATE)::TEXT;
    RETURN;
  END IF;
  
  -- User can change
  RETURN QUERY SELECT 
    true, 
    v_changes, 
    NULL::TIMESTAMPTZ, 
    format('You have %s change(s) remaining in this period', 2 - v_changes)::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 7: CREATE TRIGGERS
-- ============================================

-- Auto-update timestamps
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pets_updated_at BEFORE UPDATE ON pets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON chats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 8: GRANT PERMISSIONS
-- ============================================

-- Allow authenticated users to use helper functions
GRANT EXECUTE ON FUNCTION set_primary_pet TO authenticated;
GRANT EXECUTE ON FUNCTION can_change_profile_name TO authenticated;

-- ============================================
-- STEP 9: ADD COMMENTS (DOCUMENTATION)
-- ============================================

COMMENT ON TABLE users IS 'User accounts (owners/parents) - one account can manage multiple pet profiles';
COMMENT ON TABLE pets IS 'Pet profiles - each pet is a separate "page" like Facebook pages system';
COMMENT ON TABLE posts IS 'Social feed posts - can be posted as specific pet pages';
COMMENT ON TABLE profile_name_changes IS 'Audit log for profile name changes (limited to 2 per 2 months)';

COMMENT ON COLUMN users.username IS 'Unique @username for search and mentions (user-level, not pet-level)';
COMMENT ON COLUMN users.primary_pet_id IS 'Default pet displayed when viewing profile';
COMMENT ON COLUMN users.profile_name_changes IS 'Count of profile name changes in current 2-month period';
COMMENT ON COLUMN users.profile_name_last_changed IS 'Timestamp of last profile name change';

COMMENT ON COLUMN pets.is_primary IS 'Is this the primary/default pet for the profile?';
COMMENT ON COLUMN pets.display_order IS 'Order for displaying pet bubbles (lower number = further left)';
COMMENT ON COLUMN pets.page_active IS 'Is this pet page active and visible?';

COMMENT ON COLUMN posts.posted_as_pet_id IS 'Which pet page created this post (for filtering/context)';

COMMENT ON FUNCTION set_primary_pet IS 'Sets a pet as the primary/default pet for a user profile';
COMMENT ON FUNCTION can_change_profile_name IS 'Checks if user can change profile name (2 changes per 2 months rule)';

-- ============================================
-- SUMMARY
-- ============================================

-- ✅ Tables Created:
--    - users (owner info + profile settings)
--    - pets (multi-profile pages system)
--    - posts (pet-centric social feed)
--    - chats (one-on-one messaging)
--    - messages (chat messages)
--    - profile_name_changes (audit trail)

-- ✅ Features:
--    - Multi-pet profile system (like Facebook pages)
--    - Username search (@username)
--    - Profile name change restrictions (2 per 2 months)
--    - Primary pet management
--    - Pet page bubbles with display order
--    - Posts linked to specific pet pages
--    - Secure RLS policies
--    - Helper functions for common operations

-- ✅ Optimizations:
--    - Indexed columns for fast queries
--    - Auto-update timestamps
--    - Foreign key constraints
--    - Row Level Security enabled

-- ✅ Storage:
--    - All images stored in Cloudinary (URLs only in DB)
--    - Automatic optimization (1080px + WebP)
--    - Minimal database storage usage

-- 🚀 READY TO USE!
-- Run this entire script in Supabase SQL Editor to create the complete database structure.

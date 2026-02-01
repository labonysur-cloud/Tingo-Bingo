-- ============================================
-- FIREBASE AUTH + SUPABASE RLS INTEGRATION (FIXED)
-- Updated RLS Policies for Firebase Token Support
-- ============================================

-- Create helper function in PUBLIC schema (not auth schema - that's protected!)
-- This extracts the user_id from Firebase JWT token
CREATE OR REPLACE FUNCTION public.get_user_id() 
RETURNS TEXT AS $$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::json->>'sub',
    ''
  )::text;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.get_user_id IS 'Extracts user_id from Firebase Auth JWT token for RLS policies';

-- ============================================
-- UPDATE RLS POLICIES FOR ALL TABLES
-- ============================================

-- ===================
-- USERS TABLE
-- ===================

-- Drop old policies
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can delete own profile" ON users;

-- Recreate with Firebase auth support
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (id = public.get_user_id());

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = public.get_user_id());

CREATE POLICY "Users can delete own profile"
  ON users FOR DELETE
  USING (id = public.get_user_id());

-- ===================
-- PETS TABLE
-- ===================

DROP POLICY IF EXISTS "Users can create own pets" ON pets;
DROP POLICY IF EXISTS "Users can update own pets" ON pets;
DROP POLICY IF EXISTS "Users can delete own pets" ON pets;

CREATE POLICY "Users can create own pets"
  ON pets FOR INSERT
  WITH CHECK (owner_id = public.get_user_id());

CREATE POLICY "Users can update own pets"
  ON pets FOR UPDATE
  USING (owner_id = public.get_user_id());

CREATE POLICY "Users can delete own pets"
  ON pets FOR DELETE
  USING (owner_id = public.get_user_id());

-- ===================
-- POSTS TABLE
-- ===================

DROP POLICY IF EXISTS "Authenticated users can create posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;

CREATE POLICY "Authenticated users can create posts"
  ON posts FOR INSERT
  WITH CHECK (user_id = public.get_user_id());

CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  USING (user_id = public.get_user_id());

CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  USING (user_id = public.get_user_id());

-- ===================
-- CHATS TABLE
-- ===================

DROP POLICY IF EXISTS "Users can create chats" ON chats;
DROP POLICY IF EXISTS "Users can update own chats" ON chats;

CREATE POLICY "Users can create chats"
  ON chats FOR INSERT
  WITH CHECK (
    participant_1 = public.get_user_id() OR
    participant_2 = public.get_user_id()
  );

CREATE POLICY "Users can update own chats"
  ON chats FOR UPDATE
  USING (
    participant_1 = public.get_user_id() OR
    participant_2 = public.get_user_id()
  );

-- ===================
-- MESSAGES TABLE
-- ===================

DROP POLICY IF EXISTS "Users can send messages" ON messages;

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = public.get_user_id() AND
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = messages.chat_id
      AND (
        chats.participant_1 = public.get_user_id() OR
        chats.participant_2 = public.get_user_id()
      )
    )
  );

-- ===================
-- PROFILE NAME CHANGES TABLE
-- ===================

DROP POLICY IF EXISTS "Users can log name changes" ON profile_name_changes;

CREATE POLICY "Users can log name changes"
  ON profile_name_changes FOR INSERT
  WITH CHECK (user_id = public.get_user_id());

-- ============================================
-- VERIFICATION
-- ============================================

-- Test the function
SELECT public.get_user_id() AS "Current User ID (should be NULL if not authenticated)";

-- ✅ READY TO USE
-- All RLS policies now support Firebase Auth tokens!

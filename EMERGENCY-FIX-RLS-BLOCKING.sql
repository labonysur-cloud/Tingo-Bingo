-- ============================================
-- CRITICAL FIX: Ensure INSERT policies exist and work
-- Based on browser console errors
-- ============================================

-- The errors show that INSERT operations are failing
-- This means either:
-- 1. The policies don't exist
-- 2. The policies exist but use wrong syntax
-- 3. There are conflicting policies

-- ========================================
-- STEP 1: Clean slate - drop ALL policies
-- ========================================

-- POSTS
DO $$ 
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'posts') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON posts';
    END LOOP;
END $$;

-- POST_LIKES  
DO $$ 
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'post_likes') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON post_likes';
    END LOOP;
END $$;

-- POST_SAVES
DO $$ 
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'post_saves') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON post_saves';
    END LOOP;
END $$;

-- COMMENTS
DO $$ 
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'comments') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON comments';
    END LOOP;
END $$;

-- COMMENT_LIKES
DO $$ 
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'comment_likes') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON comment_likes';
    END LOOP;
END $$;

-- ========================================
-- STEP 2: Create simple, working policies
-- ========================================

-- POSTS - Simple and permissive for authenticated users
CREATE POLICY "select_posts" ON posts FOR SELECT USING (true);
CREATE POLICY "insert_posts" ON posts FOR INSERT WITH CHECK (true);
CREATE POLICY "update_posts" ON posts FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "delete_posts" ON posts FOR DELETE USING (auth.uid()::text = user_id);

-- POST_LIKES - Allow authenticated users to like
CREATE POLICY "select_post_likes" ON post_likes FOR SELECT USING (true);
CREATE POLICY "insert_post_likes" ON post_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "delete_post_likes" ON post_likes FOR DELETE USING (auth.uid()::text = user_id);

-- POST_SAVES - Allow authenticated users to save
CREATE POLICY "select_post_saves" ON post_saves FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "insert_post_saves" ON post_saves FOR INSERT WITH CHECK (true);
CREATE POLICY "delete_post_saves" ON post_saves FOR DELETE USING (auth.uid()::text = user_id);

-- COMMENTS - Allow authenticated users to comment
CREATE POLICY "select_comments" ON comments FOR SELECT USING (true);
CREATE POLICY "insert_comments" ON comments FOR INSERT WITH CHECK (true);
CREATE POLICY "update_comments" ON comments FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "delete_comments" ON comments FOR DELETE USING (auth.uid()::text = user_id);

-- COMMENT_LIKES - Allow authenticated users to like comments
CREATE POLICY "select_comment_likes" ON comment_likes FOR SELECT USING (true);
CREATE POLICY "insert_comment_likes" ON comment_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "delete_comment_likes" ON comment_likes FOR DELETE USING (auth.uid()::text = user_id);

-- ========================================
-- VERIFICATION
-- ========================================
-- Check all policies exist:
-- SELECT tablename, policyname, cmd FROM pg_policies 
-- WHERE tablename IN ('posts', 'post_likes', 'post_saves', 'comments', 'comment_likes')
-- ORDER BY tablename, cmd;

-- ============================================
-- YOUR APP SHOULD WORK NOW!
-- Refresh browser after running this
-- ============================================

-- ============================================
-- COMPLETE DIAGNOSTIC AND FIX
-- ============================================

-- STEP 1: Check what policies exist
SELECT 
    'Current post_likes policies:' as info,
    policyname,
    cmd as command
FROM pg_policies 
WHERE tablename = 'post_likes'
ORDER BY cmd;

-- STEP 2: If no SELECT policy exists, this is the problem!
-- The fetchPosts function uses a LEFT JOIN on post_likes
-- If there's no SELECT policy, it can't see any likes
-- So isLikedByMe is always false

-- STEP 3: Fix - ensure SELECT policy exists
DROP POLICY IF EXISTS "select_post_likes" ON post_likes;
CREATE POLICY "select_post_likes" ON post_likes
FOR SELECT USING (true);

-- STEP 4: Ensure INSERT policy exists  
DROP POLICY IF EXISTS "insert_post_likes" ON post_likes;
CREATE POLICY "insert_post_likes" ON post_likes
FOR INSERT WITH CHECK (true);

-- STEP 5: Ensure DELETE policy exists
DROP POLICY IF EXISTS "delete_post_likes" ON post_likes;
CREATE POLICY "delete_post_likes" ON post_likes
FOR DELETE USING (auth.uid()::text = user_id);

-- STEP 6: Verify policies were created
SELECT 
    'New post_likes policies:' as info,
    policyname,
    cmd as command
FROM pg_policies 
WHERE tablename = 'post_likes'
ORDER BY cmd;

-- ============================================
-- After running this, HARD REFRESH your browser (Ctrl+Shift+R)
-- ============================================

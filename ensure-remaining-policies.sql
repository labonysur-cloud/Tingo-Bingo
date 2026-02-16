-- ============================================
-- FINAL POLICY FIX FOR SAVES AND COMMENT LIKES
-- ============================================

-- Fix post_saves
DROP POLICY IF EXISTS "select_post_saves" ON post_saves;
CREATE POLICY "select_post_saves" ON post_saves FOR SELECT USING (true);

DROP POLICY IF EXISTS "insert_post_saves" ON post_saves;
CREATE POLICY "insert_post_saves" ON post_saves FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "delete_post_saves" ON post_saves;
CREATE POLICY "delete_post_saves" ON post_saves FOR DELETE USING (auth.uid()::text = user_id);

-- Fix comment_likes
DROP POLICY IF EXISTS "select_comment_likes" ON comment_likes;
CREATE POLICY "select_comment_likes" ON comment_likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "insert_comment_likes" ON comment_likes;
CREATE POLICY "insert_comment_likes" ON comment_likes FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "delete_comment_likes" ON comment_likes;
CREATE POLICY "delete_comment_likes" ON comment_likes FOR DELETE USING (auth.uid()::text = user_id);

-- Enable RLS (just in case)
ALTER TABLE post_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- Verify
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename IN ('post_saves', 'comment_likes')
ORDER BY tablename, cmd;

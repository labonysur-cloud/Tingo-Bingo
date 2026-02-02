-- ============================================
-- ENABLE REALTIME FOR SOCIAL FEATURES
-- ============================================

-- 1. Enable realtime for post_likes (for live like counts)
ALTER PUBLICATION supabase_realtime ADD TABLE post_likes;

-- 2. Enable realtime for comments (for live comment updates)
ALTER PUBLICATION supabase_realtime ADD TABLE comments;

-- 3. Add parent_comment_id for nested replies (if not exists)
ALTER TABLE comments
ADD COLUMN IF NOT EXISTS parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE;

-- 4. Add index for better performance on nested comments
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_comment_id);

-- 5. Verify realtime is enabled
SELECT tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
AND tablename IN ('post_likes', 'comments', 'messages', 'chats');

-- You should see all 4 tables listed! ✅

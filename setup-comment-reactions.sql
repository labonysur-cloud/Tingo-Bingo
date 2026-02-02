-- ============================================
-- ADD COMMENT REACTIONS (LIKES) SYSTEM
-- ============================================

-- ============================================
-- 1. CREATE COMMENT_LIKES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS comment_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id) -- One like per user per comment
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user ON comment_likes(user_id);

-- ============================================
-- 2. ADD LIKES_COUNT TO COMMENTS TABLE
-- ============================================
ALTER TABLE comments
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- ============================================
-- 3. CREATE TRIGGER TO UPDATE COMMENT LIKES COUNT
-- ============================================
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the likes_count in comments table
    UPDATE comments
    SET likes_count = (
        SELECT COUNT(*)
        FROM comment_likes
        WHERE comment_id = COALESCE(NEW.comment_id, OLD.comment_id)
    )
    WHERE id = COALESCE(NEW.comment_id, OLD.comment_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- Drop old trigger if exists
DROP TRIGGER IF EXISTS trigger_update_comment_likes_count ON comment_likes;

-- Create trigger
CREATE TRIGGER trigger_update_comment_likes_count
AFTER INSERT OR DELETE ON comment_likes
FOR EACH ROW
EXECUTE FUNCTION update_comment_likes_count();

-- ============================================
-- 4. ENABLE REALTIME FOR COMMENT_LIKES
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE comment_likes;

-- ============================================
-- 5. RLS POLICIES FOR COMMENT_LIKES
-- ============================================
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- Anyone can view comment likes
DROP POLICY IF EXISTS "Anyone can view comment likes" ON comment_likes;
CREATE POLICY "Anyone can view comment likes"
ON comment_likes FOR SELECT
USING (auth.role() IS NOT NULL);

-- Anyone can like comments
DROP POLICY IF EXISTS "Anyone can like comments" ON comment_likes;
CREATE POLICY "Anyone can like comments"
ON comment_likes FOR INSERT
WITH CHECK (auth.role() IS NOT NULL);

-- Anyone can unlike their own likes
DROP POLICY IF EXISTS "Anyone can unlike comments" ON comment_likes;
CREATE POLICY "Anyone can unlike comments"
ON comment_likes FOR DELETE
USING (auth.role() IS NOT NULL);

-- ============================================
-- 6. BACKFILL EXISTING COMMENT LIKES COUNT
-- ============================================
UPDATE comments
SET likes_count = (
    SELECT COUNT(*)
    FROM comment_likes
    WHERE comment_id = comments.id
);

-- ============================================
-- 7. VERIFY
-- ============================================
SELECT 'Comment reactions system created! ✅' as status;

-- Check structure
SELECT 
    'comment_likes table created' as step,
    COUNT(*) as record_count
FROM comment_likes;

SELECT 
    'comments.likes_count added' as step,
    COUNT(*) as comments_with_count_field
FROM comments
WHERE likes_count IS NOT NULL;

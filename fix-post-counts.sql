-- ============================================
-- FIX LIKE AND COMMENT COUNTS
-- ============================================
-- The posts table has likes_count and comments_count columns
-- but they aren't updating automatically!
-- We need triggers to keep them in sync.

-- ============================================
-- 1. CREATE FUNCTION TO UPDATE LIKES COUNT
-- ============================================
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the likes_count in posts table
    UPDATE posts
    SET likes_count = (
        SELECT COUNT(*)
        FROM post_likes
        WHERE post_id = COALESCE(NEW.post_id, OLD.post_id)
    )
    WHERE id = COALESCE(NEW.post_id, OLD.post_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- ============================================
-- 2. CREATE TRIGGER FOR LIKES
-- ============================================
DROP TRIGGER IF EXISTS trigger_update_likes_count ON post_likes;

CREATE TRIGGER trigger_update_likes_count
AFTER INSERT OR DELETE ON post_likes
FOR EACH ROW
EXECUTE FUNCTION update_post_likes_count();

-- ============================================
-- 3. CREATE FUNCTION TO UPDATE COMMENTS COUNT
-- ============================================
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the comments_count in posts table
    -- Only count top-level comments (no parent_comment_id)
    UPDATE posts
    SET comments_count = (
        SELECT COUNT(*)
        FROM comments
        WHERE post_id = COALESCE(NEW.post_id, OLD.post_id)
        AND parent_comment_id IS NULL
    )
    WHERE id = COALESCE(NEW.post_id, OLD.post_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- ============================================
-- 4. CREATE TRIGGER FOR COMMENTS
-- ============================================
DROP TRIGGER IF EXISTS trigger_update_comments_count ON comments;

CREATE TRIGGER trigger_update_comments_count
AFTER INSERT OR DELETE ON comments
FOR EACH ROW
EXECUTE FUNCTION update_post_comments_count();

-- ============================================
-- 5. FIX EXISTING COUNTS (BACKFILL)
-- ============================================
-- Update all existing posts with correct counts
UPDATE posts
SET likes_count = (
    SELECT COUNT(*)
    FROM post_likes
    WHERE post_id = posts.id
),
comments_count = (
    SELECT COUNT(*)
    FROM comments
    WHERE post_id = posts.id
    AND parent_comment_id IS NULL
);

-- ============================================
-- 6. VERIFY
-- ============================================
SELECT 
    'Triggers created! ✅' as status,
    'Like and comment counts will now update automatically' as message;

-- Check a sample post
SELECT 
    id,
    likes_count,
    comments_count,
    (SELECT COUNT(*) FROM post_likes WHERE post_id = posts.id) as actual_likes,
    (SELECT COUNT(*) FROM comments WHERE post_id = posts.id AND parent_comment_id IS NULL) as actual_comments
FROM posts
LIMIT 5;

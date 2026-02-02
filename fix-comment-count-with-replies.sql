-- ============================================
-- FIX COMMENT COUNT TO INCLUDE REPLIES
-- ============================================
-- The current trigger only counts top-level comments
-- User wants ALL comments including replies to be counted

-- ============================================
-- UPDATE FUNCTION TO COUNT ALL COMMENTS
-- ============================================
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the comments_count in posts table
    -- COUNT ALL COMMENTS (including replies)
    UPDATE posts
    SET comments_count = (
        SELECT COUNT(*)
        FROM comments
        WHERE post_id = COALESCE(NEW.post_id, OLD.post_id)
        -- Removed: AND parent_comment_id IS NULL
        -- Now counts all comments including nested replies
    )
    WHERE id = COALESCE(NEW.post_id, OLD.post_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- ============================================
-- REFRESH EXISTING COUNTS
-- ============================================
-- Update all existing posts with correct counts including replies
UPDATE posts
SET comments_count = (
    SELECT COUNT(*)
    FROM comments
    WHERE post_id = posts.id
    -- Counts ALL comments including replies
);

SELECT 'Comment counts updated to include replies! ✅' as status;

-- Verify
SELECT 
    p.id,
    p.comments_count as "Total Comments (with replies)",
    (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND parent_comment_id IS NULL) as "Top-level only",
    (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as "Actual total"
FROM posts p
LIMIT 5;

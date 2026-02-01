-- ============================================
-- FIX: Verify and Recreate Triggers for Like Counts
-- ============================================

-- Check if triggers exist
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers
WHERE trigger_name LIKE '%like%'
ORDER BY trigger_name;

-- Drop existing triggers if they exist (to recreate fresh)
DROP TRIGGER IF EXISTS update_post_likes_count_on_insert ON post_likes;
DROP TRIGGER IF EXISTS update_post_likes_count_on_delete ON post_likes;
DROP FUNCTION IF EXISTS update_post_likes_count();

-- Create function to update likes_count
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    -- For INSERT
    IF (TG_OP = 'INSERT') THEN
        UPDATE posts 
        SET likes_count = likes_count + 1
        WHERE id = NEW.post_id;
        RETURN NEW;
    END IF;
    
    -- For DELETE
    IF (TG_OP = 'DELETE') THEN
        UPDATE posts 
        SET likes_count = GREATEST(likes_count - 1, 0)
        WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT (when user likes a post)
CREATE TRIGGER update_post_likes_count_on_insert
    AFTER INSERT ON post_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_post_likes_count();

-- Create trigger for DELETE (when user unlikes a post)
CREATE TRIGGER update_post_likes_count_on_delete
    AFTER DELETE ON post_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_post_likes_count();

-- Test: Check current state
SELECT 
    p.id,
    p.content,
    p.likes_count AS "Current likes_count",
    (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) AS "Actual likes in post_likes"
FROM posts p
ORDER BY p.created_at DESC
LIMIT 5;

-- Fix: Sync likes_count with actual data
UPDATE posts
SET likes_count = (
    SELECT COUNT(*)
    FROM post_likes
    WHERE post_likes.post_id = posts.id
);

-- Verify fix
SELECT 
    p.id,
    p.content,
    p.likes_count AS "Updated likes_count",
    (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) AS "Actual likes"
FROM posts p
ORDER BY p.created_at DESC
LIMIT 5;

-- ✅ After running this, likes_count should match actual likes!

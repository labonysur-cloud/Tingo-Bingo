-- ============================================
-- SIMPLE FIX: Just sync the likes_count numbers
-- (Triggers already exist, we just need to sync the data)
-- ============================================

-- Step 1: Check current state
SELECT 
    p.id,
    SUBSTRING(p.content, 1, 30) AS content,
    p.likes_count AS "Current likes_count in posts table",
    (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) AS "Actual likes in post_likes table"
FROM posts p
ORDER BY p.created_at DESC
LIMIT 10;

-- Step 2: Sync all posts' likes_count with reality
UPDATE posts
SET likes_count = (
    SELECT COUNT(*)
    FROM post_likes
    WHERE post_likes.post_id = posts.id
);

-- Step 3: Verify the fix worked
SELECT 
    p.id,
    SUBSTRING(p.content, 1, 30) AS content,
    p.likes_count AS "Updated likes_count",
    (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) AS "Actual likes"
FROM posts p
ORDER BY p.created_at DESC
LIMIT 10;

-- ✅ Now both columns should match!
-- ✅ Triggers will keep them in sync going forward

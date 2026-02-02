-- ============================================
-- SAVE POSTS FEATURE - DATABASE SETUP
-- ============================================
-- This script sets up the database for saving posts to Moodboard
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. CREATE post_saves TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS post_saves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

-- ============================================
-- 2. ADD saves_count TO posts TABLE
-- ============================================
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS saves_count INTEGER DEFAULT 0;

-- ============================================
-- 3. CREATE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_post_saves_user_id ON post_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_post_saves_post_id ON post_saves(post_id);
CREATE INDEX IF NOT EXISTS idx_post_saves_created_at ON post_saves(created_at DESC);

-- ============================================
-- 4. CREATE TRIGGER FUNCTION FOR saves_count
-- ============================================
CREATE OR REPLACE FUNCTION update_post_saves_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts 
        SET saves_count = saves_count + 1 
        WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts 
        SET saves_count = GREATEST(0, saves_count - 1) 
        WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. CREATE TRIGGER
-- ============================================
DROP TRIGGER IF EXISTS trigger_update_post_saves_count ON post_saves;
CREATE TRIGGER trigger_update_post_saves_count
    AFTER INSERT OR DELETE ON post_saves
    FOR EACH ROW
    EXECUTE FUNCTION update_post_saves_count();

-- ============================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE post_saves ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own saved posts" ON post_saves;
DROP POLICY IF EXISTS "Users can save posts" ON post_saves;
DROP POLICY IF EXISTS "Users can unsave their own posts" ON post_saves;

-- Policy: Users can view their own saved posts
CREATE POLICY "Users can view their own saved posts"
    ON post_saves
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can save posts (insert)
CREATE POLICY "Users can save posts"
    ON post_saves
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can unsave their own posts (delete)
CREATE POLICY "Users can unsave their own posts"
    ON post_saves
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- 7. ENABLE SUPABASE REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE post_saves;

-- ============================================
-- 8. INITIALIZE EXISTING POSTS
-- ============================================
-- Set saves_count to 0 for all existing posts (if not already set)
UPDATE posts 
SET saves_count = 0 
WHERE saves_count IS NULL;

-- Update saves_count based on existing saves (if any)
UPDATE posts p
SET saves_count = (
    SELECT COUNT(*) 
    FROM post_saves ps 
    WHERE ps.post_id = p.id
);

-- ============================================
-- 9. VERIFICATION QUERY
-- ============================================
-- Run this to verify the setup:
SELECT 
    'post_saves table' as check_item,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'post_saves') 
        THEN '✓ Created' 
        ELSE '✗ Missing' 
    END as status
UNION ALL
SELECT 
    'saves_count column',
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'posts' AND column_name = 'saves_count'
    ) 
        THEN '✓ Added' 
        ELSE '✗ Missing' 
    END
UNION ALL
SELECT 
    'RLS enabled',
    CASE WHEN (SELECT relrowsecurity FROM pg_class WHERE relname = 'post_saves') 
        THEN '✓ Enabled' 
        ELSE '✗ Disabled' 
    END
UNION ALL
SELECT 
    'Realtime enabled',
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'post_saves'
    ) 
        THEN '✓ Enabled' 
        ELSE '✗ Disabled' 
    END;

-- ============================================
-- DONE! 
-- ============================================
-- Next steps:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Update SocialContext.tsx with save functionality
-- 3. Add SaveButton to posts
-- 4. Create Moodboard component

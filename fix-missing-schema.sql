-- ============================================
-- TINGOBINGO - FIX MISSING SCHEMA
-- Safe migration: uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS
-- Run this in your Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. FIX MESSAGES TABLE
--    - Make content nullable (for media-only messages)
--    - Add media_url, media_type, read_at columns
-- ============================================

-- Allow content to be NULL (media-only messages have no text)
ALTER TABLE messages ALTER COLUMN content DROP NOT NULL;

-- Add media support columns (safe: won't error if they already exist)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_type TEXT CHECK (media_type IN ('image', 'video', 'gif'));
ALTER TABLE messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- ============================================
-- 2. FIX COMMENTS TABLE
--    - Add parent_comment_id for nested replies
--    - Add likes_count for comment likes
-- ============================================

ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- ============================================
-- 3. FIX POSTS TABLE
--    - Add saves_count column
-- ============================================

ALTER TABLE posts ADD COLUMN IF NOT EXISTS saves_count INTEGER DEFAULT 0;

-- ============================================
-- 4. CREATE post_saves TABLE (if not exists)
--    Used by SocialContext.savePost() / getSavedPosts()
-- ============================================

CREATE TABLE IF NOT EXISTS post_saves (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_post_saves_post ON post_saves(post_id);
CREATE INDEX IF NOT EXISTS idx_post_saves_user ON post_saves(user_id);

-- Enable RLS
ALTER TABLE post_saves ENABLE ROW LEVEL SECURITY;

-- RLS Policies for post_saves
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'post_saves' AND policyname = 'Anyone can view saves'
    ) THEN
        CREATE POLICY "Anyone can view saves"
            ON post_saves FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'post_saves' AND policyname = 'Authenticated users can save'
    ) THEN
        CREATE POLICY "Authenticated users can save"
            ON post_saves FOR INSERT
            WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'post_saves' AND policyname = 'Users can unsave'
    ) THEN
        CREATE POLICY "Users can unsave"
            ON post_saves FOR DELETE
            USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');
    END IF;
END $$;

-- ============================================
-- 5. CREATE comment_likes TABLE (if not exists)
--    Used by SocialContext.likeComment()
-- ============================================

CREATE TABLE IF NOT EXISTS comment_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user ON comment_likes(user_id);

-- Enable RLS
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comment_likes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'comment_likes' AND policyname = 'Anyone can view comment likes'
    ) THEN
        CREATE POLICY "Anyone can view comment likes"
            ON comment_likes FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'comment_likes' AND policyname = 'Authenticated users can like comments'
    ) THEN
        CREATE POLICY "Authenticated users can like comments"
            ON comment_likes FOR INSERT
            WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'comment_likes' AND policyname = 'Users can unlike comments'
    ) THEN
        CREATE POLICY "Users can unlike comments"
            ON comment_likes FOR DELETE
            USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');
    END IF;
END $$;

-- ============================================
-- 6. CREATE TRIGGERS for comment likes count
--    Keep likes_count in sync automatically
-- ============================================

CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE comments SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.comment_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trigger_comment_like_count ON comment_likes;
CREATE TRIGGER trigger_comment_like_count
AFTER INSERT OR DELETE ON comment_likes
FOR EACH ROW EXECUTE FUNCTION update_comment_likes_count();

-- ============================================
-- 7. CREATE TRIGGERS for post saves_count
--    Keep saves_count in sync automatically
-- ============================================

CREATE OR REPLACE FUNCTION update_post_saves_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET saves_count = saves_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET saves_count = GREATEST(0, saves_count - 1) WHERE id = OLD.post_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trigger_post_saves_count ON post_saves;
CREATE TRIGGER trigger_post_saves_count
AFTER INSERT OR DELETE ON post_saves
FOR EACH ROW EXECUTE FUNCTION update_post_saves_count();

-- ============================================
-- 8. ADD NOTIFICATION INSERT POLICY
--    (For direct inserts; triggers use superuser and bypass RLS)
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'System can insert notifications'
    ) THEN
        CREATE POLICY "System can insert notifications"
            ON notifications FOR INSERT
            WITH CHECK (true);
    END IF;
END $$;

-- ============================================
-- 9. ENABLE REALTIME FOR NEW TABLES
-- ============================================

DO $$
BEGIN
    -- post_saves
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE post_saves;
    EXCEPTION WHEN duplicate_object THEN
        NULL; -- Already in publication
    END;

    -- comment_likes
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE comment_likes;
    EXCEPTION WHEN duplicate_object THEN
        NULL; -- Already in publication
    END;
END $$;

-- ============================================
-- VERIFICATION
-- ============================================

SELECT 'Schema fix complete! ✅ All missing tables and columns added.' as status;

-- Show what we have now:
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name IN ('messages', 'comments', 'posts', 'post_saves', 'comment_likes')
    AND table_schema = 'public'
ORDER BY table_name, ordinal_position;

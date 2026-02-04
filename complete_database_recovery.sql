-- ============================================
-- COMPLETE DATABASE RECOVERY & FIX SCRIPT
-- ============================================

-- 1. Create missing STORIES table
CREATE TABLE IF NOT EXISTS stories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    type TEXT DEFAULT 'image',
    caption TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
    CONSTRAINT valid_type CHECK (type IN ('image', 'video'))
);

-- 2. Create missing HIGHLIGHTS table
CREATE TABLE IF NOT EXISTS highlights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    cover_image TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create missing HIGHLIGHT_STORIES junction table
CREATE TABLE IF NOT EXISTS highlight_stories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    highlight_id UUID REFERENCES highlights(id) ON DELETE CASCADE,
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(highlight_id, story_id)
);

-- 4. Enable RLS on new tables
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlight_stories ENABLE ROW LEVEL SECURITY;

-- 5. Set PERMISSIVE Policies (Fixes "cannot upload" / "cannot give story")
-- Using TRUE for everything since we handle Auth in the app (Firebase)

-- Stories
DROP POLICY IF EXISTS "Anyone can view stories" ON stories;
CREATE POLICY "Anyone can view stories" ON stories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can create stories" ON stories;
CREATE POLICY "Anyone can create stories" ON stories FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can delete stories" ON stories;
CREATE POLICY "Anyone can delete stories" ON stories FOR DELETE USING (true);

-- Highlights
DROP POLICY IF EXISTS "Anyone can view highlights" ON highlights;
CREATE POLICY "Anyone can view highlights" ON highlights FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can manage highlights" ON highlights;
CREATE POLICY "Anyone can manage highlights" ON highlights FOR ALL USING (true);

-- Highlight Stories
DROP POLICY IF EXISTS "Anyone can view highlight stories" ON highlight_stories;
CREATE POLICY "Anyone can view highlight stories" ON highlight_stories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can manage highlight stories" ON highlight_stories;
CREATE POLICY "Anyone can manage highlight stories" ON highlight_stories FOR ALL USING (true);

-- 6. ENABLE REAL TIME (Fixes "cannot see post in real time")
-- This is critical - it allows the app to receive updates automatically
begin;
  -- Remove existing participation to reset
  drop publication if exists supabase_realtime;
  
  -- Create publication
  create publication supabase_realtime;
commit;

-- Add tables to publication
ALTER PUBLICATION supabase_realtime ADD TABLE posts;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE post_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE stories;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- 7. Fix existing RLS just in case
-- Ensure posts have permissive policy
DROP POLICY IF EXISTS "Anyone can insert posts" ON posts;
CREATE POLICY "Anyone can insert posts" ON posts FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view posts" ON posts;
CREATE POLICY "Anyone can view posts" ON posts FOR SELECT USING (true);


SELECT '✅ Database recovered! Stories table created, Realtime enabled.' as result;

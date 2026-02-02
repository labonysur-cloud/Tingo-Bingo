-- Create follows table
-- Fixed to match TingoBingo's user ID structure (TEXT, not UUID)
CREATE TABLE IF NOT EXISTS follows (
    follower_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
);

-- Enable RLS
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Policies
-- Everyone can read who follows who
DROP POLICY IF EXISTS "Public read access" ON follows;
CREATE POLICY "Public read access" ON follows
    FOR SELECT USING (true);

-- Authenticated users can follow others
DROP POLICY IF EXISTS "Users can follow" ON follows;
CREATE POLICY "Users can follow" ON follows
    FOR INSERT WITH CHECK (follower_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Authenticated users can unfollow
DROP POLICY IF EXISTS "Users can unfollow" ON follows;
CREATE POLICY "Users can unfollow" ON follows
    FOR DELETE USING (follower_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Index for performance
CREATE INDEX IF NOT EXISTS follows_follower_idx ON follows(follower_id);
CREATE INDEX IF NOT EXISTS follows_following_idx ON follows(following_id);

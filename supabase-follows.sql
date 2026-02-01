-- Create follows table
CREATE TABLE IF NOT EXISTS follows (
    follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
);

-- Enable RLS
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Policies
-- Everyone can read who follows who
CREATE POLICY "Public read access" ON follows
    FOR SELECT USING (true);

-- Authenticated users can follow others (insert their own id as follower)
CREATE POLICY "Users can follow" ON follows
    FOR INSERT WITH CHECK (auth.uid() = follower_id);

-- Authenticated users can unfollow (delete where they are the follower)
CREATE POLICY "Users can unfollow" ON follows
    FOR DELETE USING (auth.uid() = follower_id);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE follows;

-- Index for performance
CREATE INDEX IF NOT EXISTS follows_follower_idx ON follows(follower_id);
CREATE INDEX IF NOT EXISTS follows_following_idx ON follows(following_id);

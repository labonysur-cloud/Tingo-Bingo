-- Add coins to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 0;

-- Game Scores Table
CREATE TABLE IF NOT EXISTS game_scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_id TEXT NOT NULL, -- 'catch-lazr', 'tingo-jump'
    score INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for Leaderboards
CREATE INDEX IF NOT EXISTS idx_game_scores_game_score ON game_scores(game_id, score DESC);

-- RLS
ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;

-- Everyone can view scores
CREATE POLICY "Anyone can view scores" ON game_scores FOR SELECT USING (true);

-- Users can insert their own scores
CREATE POLICY "Users can insert own scores" ON game_scores FOR INSERT 
WITH CHECK (user_id = auth.uid()::text);

-- Users can update... actually, history is better. Let's just allow inserts. 
-- We can aggregate MAX(score) for leaderboards.

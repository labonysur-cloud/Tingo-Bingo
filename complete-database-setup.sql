-- ============================================
-- TINGOBINGO - COMPLETE DATABASE RESET AND SETUP
-- Run this entire script to fix all database issues
-- ============================================

-- ============================================
-- STEP 1: DROP EVERYTHING (CLEAN SLATE)
-- ============================================

-- Drop all tables
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS follows CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS post_likes CASCADE;
DROP TABLE IF EXISTS profile_name_changes CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS chats CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS pets CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop all functions
DROP FUNCTION IF EXISTS notify_new_follower CASCADE;
DROP FUNCTION IF EXISTS notify_post_like CASCADE;
DROP FUNCTION IF EXISTS notify_post_comment CASCADE;
DROP FUNCTION IF EXISTS notify_new_message CASCADE;
DROP FUNCTION IF EXISTS set_primary_pet CASCADE;
DROP FUNCTION IF EXISTS can_change_profile_name CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;

-- ============================================
-- STEP 2: CREATE CORE TABLES
-- ============================================

-- Users Table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  name TEXT NOT NULL,
  avatar TEXT,
  bio TEXT,
  location TEXT,
  profile_name_changes INTEGER DEFAULT 0,
  profile_name_last_changed TIMESTAMPTZ,
  primary_pet_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pets Table
CREATE TABLE pets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  species TEXT,
  breed TEXT,
  age TEXT,
  gender TEXT,
  avatar TEXT,
  bio TEXT,
  is_primary BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  page_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ADD CONSTRAINT fk_users_primary_pet 
  FOREIGN KEY (primary_pet_id) REFERENCES pets(id) ON DELETE SET NULL;

-- Posts Table
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pet_id UUID REFERENCES pets(id) ON DELETE SET NULL,
  posted_as_pet_id UUID REFERENCES pets(id) ON DELETE SET NULL,
  content TEXT,
  image_url TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post Likes Table
CREATE TABLE post_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Comments Table
CREATE TABLE comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Follows Table
CREATE TABLE follows (
    follower_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
);

-- Chats Table
CREATE TABLE chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_1 TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  participant_2 TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_message TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participant_1, participant_2)
);

-- Messages Table
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications Table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('follow', 'like', 'comment', 'message')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    actor_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    actor_name TEXT,
    actor_avatar TEXT,
    reference_id TEXT,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profile Name Changes History
CREATE TABLE profile_name_changes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pet_id UUID REFERENCES pets(id) ON DELETE SET NULL,
  old_name TEXT,
  new_name TEXT NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 3: CREATE INDEXES
-- ============================================

-- Users
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_name ON users(name);
CREATE INDEX idx_users_primary_pet ON users(primary_pet_id);

-- Pets
CREATE INDEX idx_pets_owner ON pets(owner_id);
CREATE INDEX idx_pets_primary ON pets(is_primary) WHERE is_primary = true;

-- Posts
CREATE INDEX idx_posts_user ON posts(user_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);

-- Post Likes
CREATE INDEX idx_post_likes_post ON post_likes(post_id);
CREATE INDEX idx_post_likes_user ON post_likes(user_id);

-- Comments
CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_comments_user ON comments(user_id);

-- Follows
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);

-- Notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read) WHERE read = FALSE;

-- ============================================
-- STEP 4: ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_name_changes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 5: CREATE RLS POLICIES
-- ============================================

-- Users Policies
CREATE POLICY "Anyone can view user profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE 
  USING (id = current_setting('request.jwt.claims', true)::json->>'sub');
CREATE POLICY "Users can delete own profile" ON users FOR DELETE 
  USING (id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Pets Policies
CREATE POLICY "Anyone can view pets" ON pets FOR SELECT USING (true);
CREATE POLICY "Users can create own pets" ON pets FOR INSERT 
  WITH CHECK (owner_id = current_setting('request.jwt.claims', true)::json->>'sub');
CREATE POLICY "Users can update own pets" ON pets FOR UPDATE 
  USING (owner_id = current_setting('request.jwt.claims', true)::json->>'sub');
CREATE POLICY "Users can delete own pets" ON pets FOR DELETE 
  USING (owner_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Posts Policies
CREATE POLICY "Anyone can view posts" ON posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create posts" ON posts FOR INSERT 
  WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE 
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');
CREATE POLICY "Users can delete own posts" ON posts FOR DELETE 
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Post Likes Policies
CREATE POLICY "Anyone can view likes" ON post_likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can like" ON post_likes FOR INSERT 
  WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');
CREATE POLICY "Users can unlike" ON post_likes FOR DELETE 
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Comments Policies
CREATE POLICY "Anyone can view comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can comment" ON comments FOR INSERT 
  WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE 
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Follows Policies
CREATE POLICY "Anyone can view follows" ON follows FOR SELECT USING (true);
CREATE POLICY "Users can follow" ON follows FOR INSERT 
  WITH CHECK (follower_id = current_setting('request.jwt.claims', true)::json->>'sub');
CREATE POLICY "Users can unfollow" ON follows FOR DELETE 
  USING (follower_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Chats Policies
CREATE POLICY "Users can view own chats" ON chats FOR SELECT USING (
    participant_1 = current_setting('request.jwt.claims', true)::json->>'sub' OR
    participant_2 = current_setting('request.jwt.claims', true)::json->>'sub'
);
CREATE POLICY "Users can create chats" ON chats FOR INSERT WITH CHECK (
    participant_1 = current_setting('request.jwt.claims', true)::json->>'sub' OR
    participant_2 = current_setting('request.jwt.claims', true)::json->>'sub'
);
CREATE POLICY "Users can update own chats" ON chats FOR UPDATE USING (
    participant_1 = current_setting('request.jwt.claims', true)::json->>'sub' OR
    participant_2 = current_setting('request.jwt.claims', true)::json->>'sub'
);

-- Messages Policies
CREATE POLICY "Users can view messages in own chats" ON messages FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM chats WHERE chats.id = messages.chat_id AND (
            chats.participant_1 = current_setting('request.jwt.claims', true)::json->>'sub' OR
            chats.participant_2 = current_setting('request.jwt.claims', true)::json->>'sub'
        )
    )
);
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (
    sender_id = current_setting('request.jwt.claims', true)::json->>'sub' AND
    EXISTS (
        SELECT 1 FROM chats WHERE chats.id = messages.chat_id AND (
            chats.participant_1 = current_setting('request.jwt.claims', true)::json->>'sub' OR
            chats.participant_2 = current_setting('request.jwt.claims', true)::json->>'sub'
        )
    )
);

-- Notifications Policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');
CREATE POLICY "Users can delete own notifications" ON notifications FOR DELETE
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- ============================================
-- STEP 6: CREATE HELPER FUNCTIONS
-- ============================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 7: CREATE TRIGGERS
-- ============================================

-- Auto-update timestamps
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pets_updated_at BEFORE UPDATE ON pets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON chats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 8: NOTIFICATION TRIGGERS
-- ============================================

-- Trigger 1: New Follower Notification
CREATE OR REPLACE FUNCTION notify_new_follower()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notifications (user_id, type, title, message, actor_id, actor_name, actor_avatar)
    SELECT
        NEW.following_id,
        'follow',
        'New Follower',
        follower.name || ' started following you',
        NEW.follower_id,
        follower.name,
        follower.avatar
    FROM users follower
    WHERE follower.id = NEW.follower_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_new_follower
AFTER INSERT ON follows
FOR EACH ROW
EXECUTE FUNCTION notify_new_follower();

-- Trigger 2: Like Notification
CREATE OR REPLACE FUNCTION notify_post_like()
RETURNS TRIGGER AS $$
DECLARE
    post_owner_id TEXT;
BEGIN
    SELECT user_id INTO post_owner_id FROM posts WHERE id = NEW.post_id;
    
    IF NEW.user_id != post_owner_id THEN
        INSERT INTO notifications (user_id, type, title, message, actor_id, actor_name, actor_avatar, reference_id)
        SELECT
            post_owner_id,
            'like',
            'New Like',
            u.name || ' liked your post',
            NEW.user_id,
            u.name,
            u.avatar,
            NEW.post_id::TEXT
        FROM users u
        WHERE u.id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_post_like
AFTER INSERT ON post_likes
FOR EACH ROW
EXECUTE FUNCTION notify_post_like();

-- Trigger 3: Comment Notification
CREATE OR REPLACE FUNCTION notify_post_comment()
RETURNS TRIGGER AS $$
DECLARE
    post_owner_id TEXT;
BEGIN
    SELECT user_id INTO post_owner_id FROM posts WHERE id = NEW.post_id;
    
    IF NEW.user_id != post_owner_id THEN
        INSERT INTO notifications (user_id, type, title, message, actor_id, actor_name, actor_avatar, reference_id)
        SELECT
            post_owner_id,
            'comment',
            'New Comment',
            u.name || ' commented on your post',
            NEW.user_id,
            u.name,
            u.avatar,
            NEW.post_id::TEXT
        FROM users u
        WHERE u.id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_post_comment
AFTER INSERT ON comments
FOR EACH ROW
EXECUTE FUNCTION notify_post_comment();

-- Trigger 4: Message Notification
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
    recipient_id TEXT;
BEGIN
    SELECT 
        CASE 
            WHEN participant_1 = NEW.sender_id THEN participant_2
            ELSE participant_1
        END INTO recipient_id
    FROM chats
    WHERE id = NEW.chat_id;
    
    INSERT INTO notifications (user_id, type, title, message, actor_id, actor_name, actor_avatar, reference_id)
    SELECT
        recipient_id,
        'message',
        'New Message',
        sender.name || ' sent you a message',
        NEW.sender_id,
        sender.name,
        sender.avatar,
        NEW.chat_id::TEXT
    FROM users sender
    WHERE sender.id = NEW.sender_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_new_message
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION notify_new_message();

-- ============================================
-- DONE! All tables, policies, and triggers created
-- ============================================

-- Test by querying tables
SELECT 'Database setup complete!' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

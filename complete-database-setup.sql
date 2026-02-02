-- ============================================
-- TINGOBINGO - FINAL COMPLETE DATABASE SETUP
-- This matches your current app code structure
-- ============================================

-- DROP EVERYTHING
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS follows CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS post_likes CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS chats CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS conversation_participants CASCADE;
DROP TABLE IF EXISTS highlight_stories CASCADE;
DROP TABLE IF EXISTS highlights CASCADE;
DROP TABLE IF EXISTS stories CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS pets CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS notify_new_follower CASCADE;
DROP FUNCTION IF EXISTS notify_post_like CASCADE;
DROP FUNCTION IF EXISTS notify_post_comment CASCADE;
DROP FUNCTION IF EXISTS notify_new_message CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
DROP FUNCTION IF EXISTS get_or_create_conversation CASCADE;

-- ============================================
-- CREATE TABLES
-- ============================================

-- Users
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  name TEXT NOT NULL,
  avatar TEXT,
  bio TEXT,
  location TEXT,
  primary_pet_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pets
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

-- Posts
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pet_id UUID REFERENCES pets(id) ON DELETE SET NULL,
  content TEXT,
  image_url TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post Likes
CREATE TABLE post_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Comments
CREATE TABLE comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Follows
CREATE TABLE follows (
    follower_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
);

-- Chats (Simple Schema)
CREATE TABLE chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_1 TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  participant_2 TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_message TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participant_1, participant_2)
);

-- Messages
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stories
CREATE TABLE stories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('image', 'video')),
    caption TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Highlights
CREATE TABLE highlights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    cover_image TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Highlight Stories (Junction Table)
CREATE TABLE highlight_stories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    highlight_id UUID NOT NULL REFERENCES highlights(id) ON DELETE CASCADE,
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(highlight_id, story_id)
);

-- Notifications
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

-- ============================================
-- CREATE INDEXES
-- ============================================

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_pets_owner ON pets(owner_id);
CREATE INDEX idx_posts_user ON posts(user_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_post_likes_post ON post_likes(post_id);
CREATE INDEX idx_post_likes_user ON post_likes(user_id);
CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);
CREATE INDEX idx_chats_participants ON chats(participant_1, participant_2);
CREATE INDEX idx_messages_chat ON messages(chat_id);
CREATE INDEX idx_stories_user ON stories(user_id);
CREATE INDEX idx_stories_expires ON stories(expires_at);
CREATE INDEX idx_highlights_user ON highlights(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read) WHERE read = FALSE;

-- ============================================
-- ENABLE RLS
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlight_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Users
CREATE POLICY "Anyone can view users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Pets
CREATE POLICY "Anyone can view pets" ON pets FOR SELECT USING (true);
CREATE POLICY "Users can create own pets" ON pets FOR INSERT WITH CHECK (owner_id = current_setting('request.jwt.claims', true)::json->>'sub');
CREATE POLICY "Users can update own pets" ON pets FOR UPDATE USING (owner_id = current_setting('request.jwt.claims', true)::json->>'sub');
CREATE POLICY "Users can delete own pets" ON pets FOR DELETE USING (owner_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Posts
CREATE POLICY "Anyone can view posts" ON posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create posts" ON posts FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');
CREATE POLICY "Users can delete own posts" ON posts FOR DELETE USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Post Likes
CREATE POLICY "Anyone can view likes" ON post_likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can like" ON post_likes FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');
CREATE POLICY "Users can unlike" ON post_likes FOR DELETE USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Comments
CREATE POLICY "Anyone can view comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can comment" ON comments FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Follows
CREATE POLICY "Anyone can view follows" ON follows FOR SELECT USING (true);
CREATE POLICY "Users can follow" ON follows FOR INSERT WITH CHECK (follower_id = current_setting('request.jwt.claims', true)::json->>'sub');
CREATE POLICY "Users can unfollow" ON follows FOR DELETE USING (follower_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Chats
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

-- Messages
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

-- Stories
CREATE POLICY "Anyone can view active stories" ON stories FOR SELECT USING (expires_at > NOW());
CREATE POLICY "Users can create own stories" ON stories FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');
CREATE POLICY "Users can delete own stories" ON stories FOR DELETE USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Highlights
CREATE POLICY "Anyone can view highlights" ON highlights FOR SELECT USING (true);
CREATE POLICY "Users can create own highlights" ON highlights FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');
CREATE POLICY "Users can update own highlights" ON highlights FOR UPDATE USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');
CREATE POLICY "Users can delete own highlights" ON highlights FOR DELETE USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Highlight Stories (permissive for now)
CREATE POLICY "Anyone can view highlight stories" ON highlight_stories FOR SELECT USING (true);
CREATE POLICY "Users can add to highlights" ON highlight_stories FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can remove from highlights" ON highlight_stories FOR DELETE USING (true);

-- Notifications
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');
CREATE POLICY "Users can delete own notifications" ON notifications FOR DELETE USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- ============================================
-- FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pets_updated_at BEFORE UPDATE ON pets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON chats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- NOTIFICATION TRIGGERS
-- ============================================

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
-- DONE!
-- ============================================

SELECT 'Database setup complete! All tables, indexes, RLS policies, and triggers created.' as status;

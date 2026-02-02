-- =============================================
-- NOTIFICATIONS TABLE & TRIGGERS
-- Real-time notification system for TingoBingo
-- =============================================

-- 1. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('follow', 'like', 'comment', 'message')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    actor_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    actor_name TEXT,
    actor_avatar TEXT,
    reference_id TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- 3. Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
CREATE POLICY "Users can delete own notifications"
ON notifications FOR DELETE
USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- =============================================
-- TRIGGER FUNCTIONS
-- =============================================

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

DROP TRIGGER IF EXISTS trigger_new_follower ON follows;
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
    -- Get post owner
    SELECT user_id INTO post_owner_id FROM posts WHERE id = NEW.post_id;
    
    -- Don't notify if user likes their own post
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
            NEW.post_id
        FROM users u
        WHERE u.id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_post_like ON likes;
CREATE TRIGGER trigger_post_like
AFTER INSERT ON likes
FOR EACH ROW
EXECUTE FUNCTION notify_post_like();

-- Trigger 3: Comment Notification
CREATE OR REPLACE FUNCTION notify_post_comment()
RETURNS TRIGGER AS $$
DECLARE
    post_owner_id TEXT;
BEGIN
    -- Get post owner
    SELECT user_id INTO post_owner_id FROM posts WHERE id = NEW.post_id;
    
    -- Don't notify if user comments on their own post
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
            NEW.post_id
        FROM users u
        WHERE u.id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_post_comment ON comments;
CREATE TRIGGER trigger_post_comment
AFTER INSERT ON comments
FOR EACH ROW
EXECUTE FUNCTION notify_post_comment();

-- Trigger 4: Message Notification
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify the receiver
    INSERT INTO notifications (user_id, type, title, message, actor_id, actor_name, actor_avatar, reference_id)
    SELECT
        NEW.receiver_id,
        'message',
        'New Message',
        sender.name || ' sent you a message',
        NEW.sender_id,
        sender.name,
        sender.avatar,
        NEW.chat_id
    FROM users sender
    WHERE sender.id = NEW.sender_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_new_message ON messages;
CREATE TRIGGER trigger_new_message
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION notify_new_message();

-- =============================================
-- CLEANUP FUNCTION (Optional)
-- Auto-delete notifications older than 30 days
-- =============================================
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
    DELETE FROM notifications
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- DONE!
-- Run this SQL in Supabase SQL Editor
-- =============================================

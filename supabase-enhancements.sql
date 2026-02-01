-- ============================================
-- TINGOBINGO SCHEMA ENHANCEMENTS (FIXED)
-- Phase 2: Social Features Database
-- Adds: Likes, Comments, Notifications, Follows
-- ============================================

-- ===================
-- POST LIKES TABLE
-- ===================
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id) -- One like per user per post
);

CREATE INDEX IF NOT EXISTS idx_post_likes_post ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_created ON post_likes(created_at DESC);

-- RLS Policies for post_likes
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view likes" ON post_likes;
CREATE POLICY "Anyone can view likes"
  ON post_likes FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can like posts" ON post_likes;
CREATE POLICY "Users can like posts"
  ON post_likes FOR INSERT
  WITH CHECK (user_id = public.get_user_id());

DROP POLICY IF EXISTS "Users can unlike posts" ON post_likes;
CREATE POLICY "Users can unlike posts"
  ON post_likes FOR DELETE
  USING (user_id = public.get_user_id());

-- ===================
-- COMMENTS TABLE
-- ===================
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 2000),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);

-- RLS Policies for comments
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view comments" ON comments;
CREATE POLICY "Anyone can view comments"
  ON comments FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can comment" ON comments;
CREATE POLICY "Authenticated users can comment"
  ON comments FOR INSERT
  WITH CHECK (user_id = public.get_user_id() AND char_length(content) > 0);

DROP POLICY IF EXISTS "Users can update own comments" ON comments;
CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  USING (user_id = public.get_user_id());

DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  USING (user_id = public.get_user_id());

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at 
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================
-- FOLLOWS TABLE
-- ===================
CREATE TABLE IF NOT EXISTS follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id) -- Can't follow yourself
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_created ON follows(created_at DESC);

-- RLS Policies for follows
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view follows" ON follows;
CREATE POLICY "Anyone can view follows"
  ON follows FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can follow others" ON follows;
CREATE POLICY "Users can follow others"
  ON follows FOR INSERT
  WITH CHECK (follower_id = public.get_user_id());

DROP POLICY IF EXISTS "Users can unfollow" ON follows;
CREATE POLICY "Users can unfollow"
  ON follows FOR DELETE
  USING (follower_id = public.get_user_id());

-- ===================
-- NOTIFICATIONS TABLE
-- ===================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'mention')),
  actor_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- RLS Policies for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id = public.get_user_id());

DROP POLICY IF EXISTS "System can create notifications" ON notifications;
CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true); -- Allow system to create notifications

DROP POLICY IF EXISTS "Users can mark notifications as read" ON notifications;
CREATE POLICY "Users can mark notifications as read"
  ON notifications FOR UPDATE
  USING (user_id = public.get_user_id());

-- ===================
-- UPDATE POSTS TABLE
-- ===================
-- Add comments_count column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' AND column_name = 'comments_count'
  ) THEN
    ALTER TABLE posts ADD COLUMN comments_count INTEGER DEFAULT 0;
  END IF;
END$$;

-- ===================
-- TRIGGER FUNCTIONS
-- ===================

-- Function to update like count
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS post_likes_count_trigger ON post_likes;
CREATE TRIGGER post_likes_count_trigger
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

-- Function to update comment count
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS post_comments_count_trigger ON comments;
CREATE TRIGGER post_comments_count_trigger
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- Function to create notification on like
CREATE OR REPLACE FUNCTION create_like_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Don't notify if user likes their own post
  IF NEW.user_id != (SELECT user_id FROM posts WHERE id = NEW.post_id) THEN
    INSERT INTO notifications (user_id, type, actor_id, post_id)
    SELECT user_id, 'like', NEW.user_id, NEW.post_id
    FROM posts WHERE id = NEW.post_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS like_notification_trigger ON post_likes;
CREATE TRIGGER like_notification_trigger
  AFTER INSERT ON post_likes
  FOR EACH ROW EXECUTE FUNCTION create_like_notification();

-- Function to create notification on comment
CREATE OR REPLACE FUNCTION create_comment_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Don't notify if user comments on their own post
  IF NEW.user_id != (SELECT user_id FROM posts WHERE id = NEW.post_id) THEN
    INSERT INTO notifications (user_id, type, actor_id, post_id, comment_id, content)
    SELECT 
      user_id, 
      'comment', 
      NEW.user_id, 
      NEW.post_id, 
      NEW.id,
      LEFT(NEW.content, 100) -- First 100 chars of comment
    FROM posts WHERE id = NEW.post_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS comment_notification_trigger ON comments;
CREATE TRIGGER comment_notification_trigger
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION create_comment_notification();

-- Function to create notification on follow
CREATE OR REPLACE FUNCTION create_follow_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, actor_id)
  VALUES (NEW.following_id, 'follow', NEW.follower_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS follow_notification_trigger ON follows;
CREATE TRIGGER follow_notification_trigger
  AFTER INSERT ON follows
  FOR EACH ROW EXECUTE FUNCTION create_follow_notification();

-- ===================
-- HELPER FUNCTIONS
-- ===================

-- Get user's followers count
CREATE OR REPLACE FUNCTION get_followers_count(p_user_id TEXT)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM follows WHERE following_id = p_user_id;
$$ LANGUAGE SQL STABLE;

-- Get user's following count
CREATE OR REPLACE FUNCTION get_following_count(p_user_id TEXT)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM follows WHERE follower_id = p_user_id;
$$ LANGUAGE SQL STABLE;

-- Check if user A follows user B
CREATE OR REPLACE FUNCTION is_following(p_follower_id TEXT, p_following_id TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM follows 
    WHERE follower_id = p_follower_id AND following_id = p_following_id
  );
$$ LANGUAGE SQL STABLE;

-- Get unread notifications count
CREATE OR REPLACE FUNCTION get_unread_notifications_count(p_user_id TEXT)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM notifications 
  WHERE user_id = p_user_id AND read = false;
$$ LANGUAGE SQL STABLE;

-- ===================
-- COMMENTS
-- ===================
COMMENT ON TABLE post_likes IS 'User likes on posts - junction table with automatic notification triggers';
COMMENT ON TABLE comments IS 'Comments on posts with full CRUD support and notification system';
COMMENT ON TABLE follows IS 'User follow relationships for social graph';
COMMENT ON TABLE notifications IS 'User notifications for social interactions (likes, comments, follows, mentions)';

-- ===================
-- GRANT PERMISSIONS
-- ===================
GRANT EXECUTE ON FUNCTION get_followers_count TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_following_count TO authenticated, anon;
GRANT EXECUTE ON FUNCTION is_following TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_unread_notifications_count TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_user_id TO authenticated, anon;

-- ✅ READY TO RUN
-- This script now uses public.get_user_id() instead of auth.user_id()

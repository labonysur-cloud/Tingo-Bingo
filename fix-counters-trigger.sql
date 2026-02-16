-- ============================================
-- FIX COUNTERS TRIGGERS (SECURITY DEFINER)
-- ============================================

-- Function to handle new post like
CREATE OR REPLACE FUNCTION handle_new_post_like()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.posts
  SET likes_count = likes_count + 1
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle removed post like
CREATE OR REPLACE FUNCTION handle_removed_post_like()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.posts
  SET likes_count = GREATEST(0, likes_count - 1)
  WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for post_likes
DROP TRIGGER IF EXISTS on_post_like_added ON public.post_likes;
CREATE TRIGGER on_post_like_added
  AFTER INSERT ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION handle_new_post_like();

DROP TRIGGER IF EXISTS on_post_like_removed ON public.post_likes;
CREATE TRIGGER on_post_like_removed
  AFTER DELETE ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION handle_removed_post_like();


-- Function to handle new post save
CREATE OR REPLACE FUNCTION handle_new_post_save()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.posts
  SET saves_count = saves_count + 1
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle removed post save
CREATE OR REPLACE FUNCTION handle_removed_post_save()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.posts
  SET saves_count = GREATEST(0, saves_count - 1)
  WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for post_saves
DROP TRIGGER IF EXISTS on_post_save_added ON public.post_saves;
CREATE TRIGGER on_post_save_added
  AFTER INSERT ON public.post_saves
  FOR EACH ROW EXECUTE FUNCTION handle_new_post_save();

DROP TRIGGER IF EXISTS on_post_save_removed ON public.post_saves;
CREATE TRIGGER on_post_save_removed
  AFTER DELETE ON public.post_saves
  FOR EACH ROW EXECUTE FUNCTION handle_removed_post_save();


-- Function to handle new comment (updates post.comments_count)
CREATE OR REPLACE FUNCTION handle_new_comment()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.posts
  SET comments_count = comments_count + 1
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle removed comment
CREATE OR REPLACE FUNCTION handle_removed_comment()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.posts
  SET comments_count = GREATEST(0, comments_count - 1)
  WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for comments
DROP TRIGGER IF EXISTS on_comment_added ON public.comments;
CREATE TRIGGER on_comment_added
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION handle_new_comment();

DROP TRIGGER IF EXISTS on_comment_removed ON public.comments;
CREATE TRIGGER on_comment_removed
  AFTER DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION handle_removed_comment();


-- Function to handle new comment like (updates comments.likes_count)
-- Assuming 'comments' table has likes_count. If not, this might error, but assuming YES from context.
CREATE OR REPLACE FUNCTION handle_new_comment_like()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.comments
  SET likes_count = likes_count + 1
  WHERE id = NEW.comment_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle removed comment like
CREATE OR REPLACE FUNCTION handle_removed_comment_like()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.comments
  SET likes_count = GREATEST(0, likes_count - 1)
  WHERE id = OLD.comment_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for comment_likes
DROP TRIGGER IF EXISTS on_comment_like_added ON public.comment_likes;
CREATE TRIGGER on_comment_like_added
  AFTER INSERT ON public.comment_likes
  FOR EACH ROW EXECUTE FUNCTION handle_new_comment_like();

DROP TRIGGER IF EXISTS on_comment_like_removed ON public.comment_likes;
CREATE TRIGGER on_comment_like_removed
  AFTER DELETE ON public.comment_likes
  FOR EACH ROW EXECUTE FUNCTION handle_removed_comment_like();

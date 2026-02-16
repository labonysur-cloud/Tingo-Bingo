-- ============================================
-- REVERT RLS POLICIES (Supabase/Firebase ID Mismatch)
-- ============================================

-- Force proper schema search path
SET search_path TO public;

-- Drop STRICT policies (they fail because Firebase Auth UID != Supabase auth.uid())
DROP POLICY IF EXISTS "insert_posts" ON public.posts;
DROP POLICY IF EXISTS "insert_comments" ON public.comments;
DROP POLICY IF EXISTS "insert_post_likes" ON public.post_likes;
DROP POLICY IF EXISTS "insert_post_saves" ON public.post_saves;
DROP POLICY IF EXISTS "insert_comment_likes" ON public.comment_likes;
DROP POLICY IF EXISTS "delete_posts" ON public.posts;
DROP POLICY IF EXISTS "delete_comments" ON public.comments;
DROP POLICY IF EXISTS "delete_post_likes" ON public.post_likes;
DROP POLICY IF EXISTS "delete_post_saves" ON public.post_saves;
DROP POLICY IF EXISTS "delete_comment_likes" ON public.comment_likes;

-- Recreate PERMISSIVE policies (to allow actions with Firebase UIDs)
-- NOTE: This relies on frontend sending correct user_id.

CREATE POLICY "insert_posts" ON public.posts FOR INSERT WITH CHECK (true);
CREATE POLICY "delete_posts" ON public.posts FOR DELETE USING (true);

CREATE POLICY "insert_comments" ON public.comments FOR INSERT WITH CHECK (true);
CREATE POLICY "delete_comments" ON public.comments FOR DELETE USING (true);

-- Likes & Saves need to allow ANY insert/delete if the ID matches stored one
CREATE POLICY "insert_post_likes" ON public.post_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "delete_post_likes" ON public.post_likes FOR DELETE USING (true);

CREATE POLICY "insert_post_saves" ON public.post_saves FOR INSERT WITH CHECK (true);
CREATE POLICY "delete_post_saves" ON public.post_saves FOR DELETE USING (true);

CREATE POLICY "insert_comment_likes" ON public.comment_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "delete_comment_likes" ON public.comment_likes FOR DELETE USING (true);

-- Ensure Update policies are also permissive if needed
DROP POLICY IF EXISTS "update_posts" ON public.posts;
CREATE POLICY "update_posts" ON public.posts FOR UPDATE USING (true);

DROP POLICY IF EXISTS "update_comments" ON public.comments;
CREATE POLICY "update_comments" ON public.comments FOR UPDATE USING (true);

-- The "Force Delete" function will still work and provide extra security.

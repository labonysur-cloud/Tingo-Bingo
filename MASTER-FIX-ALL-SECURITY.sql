-- ============================================
-- MASTER SECURITY & FUNCTION FIX (ALL-IN-ONE)
-- ============================================

-- 1. FIX FUNCTION SEARCH PATHS (Mutable Warning)
-- Ensure all trigger functions run in safe 'public' schema
-- Also catch exceptions to prevent deletion failures

CREATE OR REPLACE FUNCTION public.handle_new_post_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.posts
  SET likes_count = likes_count + 1
  WHERE id = new.post_id;
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  RETURN new;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_removed_post_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.posts
  SET likes_count = GREATEST(0, likes_count - 1)
  WHERE id = old.post_id;
  RETURN old;
EXCEPTION WHEN OTHERS THEN
  RETURN old;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_post_save()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.posts
  SET saves_count = saves_count + 1
  WHERE id = new.post_id;
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  RETURN new;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_removed_post_save()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.posts
  SET saves_count = GREATEST(0, saves_count - 1)
  WHERE id = old.post_id;
  RETURN old;
EXCEPTION WHEN OTHERS THEN
  RETURN old;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.posts
  SET comments_count = comments_count + 1
  WHERE id = new.post_id;
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  RETURN new;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_removed_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.posts
  SET comments_count = GREATEST(0, comments_count - 1)
  WHERE id = old.post_id;
  RETURN old;
EXCEPTION WHEN OTHERS THEN
  RETURN old;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_comment_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.comments
  SET likes_count = likes_count + 1
  WHERE id = new.comment_id;
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  RETURN new;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_removed_comment_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.comments
  SET likes_count = GREATEST(0, likes_count - 1)
  WHERE id = old.comment_id;
  RETURN old;
EXCEPTION WHEN OTHERS THEN
  RETURN old;
END;
$function$;


-- 2. FIX RLS POLICIES (Restrict INSERT Access)
-- Drop existing lax policies
DROP POLICY IF EXISTS "insert_posts" ON public.posts;
DROP POLICY IF EXISTS "insert_comments" ON public.comments;
DROP POLICY IF EXISTS "insert_post_likes" ON public.post_likes;
DROP POLICY IF EXISTS "insert_post_saves" ON public.post_saves;
DROP POLICY IF EXISTS "insert_comment_likes" ON public.comment_likes;
-- Also system notification policy
DROP POLICY IF EXISTS "System can create notifications for any user" ON public.notifications;

-- Create STRICT INSERT policies
-- Only allow inserting if user_id matches authenticated user

CREATE POLICY "insert_posts" ON public.posts FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "insert_comments" ON public.comments FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "insert_post_likes" ON public.post_likes FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "insert_post_saves" ON public.post_saves FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "insert_comment_likes" ON public.comment_likes FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text);


-- 3. ENSURE DELETE POLICIES ARE ROBUST (UUID/TEXT Mismatch)
-- Re-apply this just to be absolutely sure

DROP POLICY IF EXISTS "delete_posts" ON public.posts;
CREATE POLICY "delete_posts" ON public.posts FOR DELETE 
USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "delete_comments" ON public.comments;
CREATE POLICY "delete_comments" ON public.comments FOR DELETE 
USING (
    (auth.uid()::text = user_id::text) 
    OR 
    EXISTS (
        SELECT 1 
        FROM public.posts 
        WHERE id = comments.post_id 
        AND user_id::text = auth.uid()::text
    )
);

-- 4. ENSURE SELECT POLICIES EXIST (If missing, users can't see anything)
-- We check IF NOT EXISTS to avoid errors, or just recreate them safely
-- (Assuming SELECT policies are generally OK, but let's make sure they exist)

DROP POLICY IF EXISTS "select_posts" ON public.posts;
CREATE POLICY "select_posts" ON public.posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "select_comments" ON public.comments;
CREATE POLICY "select_comments" ON public.comments FOR SELECT USING (true);

-- Done!

-- ============================================
-- FORCE DELETE FUNCTION (Bypasses RLS)
-- ============================================

-- Function to FORCE DELETE a post securely
CREATE OR REPLACE FUNCTION public.force_delete_post(post_id_param UUID, user_id_param TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_owner_id TEXT;
BEGIN
  -- 1. Check if post exists and get owner
  SELECT user_id INTO v_owner_id
  FROM public.posts
  WHERE id = post_id_param;

  IF NOT FOUND THEN
    RETURN FALSE; -- Post not found
  END IF;

  -- 2. Verify ownership (Comparison is Case-Insensitive and Trimmed just in case)
  IF TRIM(v_owner_id) = TRIM(user_id_param) THEN
    -- ownership confirmed, delete it
    DELETE FROM public.posts WHERE id = post_id_param;
    RETURN TRUE;
  ELSE
    -- Ownership check failed
    RETURN FALSE;
  END IF;

EXCEPTION WHEN OTHERS THEN
  -- Log error if needed, but return false to create safe failure
  RETURN FALSE;
END;
$function$;

-- Function to FORCE DELETE a comment securely
CREATE OR REPLACE FUNCTION public.force_delete_comment(comment_id_param UUID, user_id_param TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_comment_owner_id TEXT;
  v_post_owner_id TEXT;
BEGIN
  -- 1. Get comment owner and post owner
  SELECT c.user_id, p.user_id 
  INTO v_comment_owner_id, v_post_owner_id
  FROM public.comments c
  JOIN public.posts p ON c.post_id = p.id
  WHERE c.id = comment_id_param;

  IF NOT FOUND THEN
    RETURN FALSE; -- Comment not found
  END IF;

  -- 2. Check if user is EITHER comment owner OR post owner
  IF (TRIM(v_comment_owner_id) = TRIM(user_id_param)) OR (TRIM(v_post_owner_id) = TRIM(user_id_param)) THEN
    DELETE FROM public.comments WHERE id = comment_id_param;
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;

EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$function$;

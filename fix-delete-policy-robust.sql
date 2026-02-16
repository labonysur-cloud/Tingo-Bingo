-- ============================================
-- FIX DELETE POLICY (Robust Type Casting)
-- ============================================

-- Force proper schema search path
SET search_path TO public;

-- Drop previous policies
DROP POLICY IF EXISTS "delete_posts" ON public.posts;
DROP POLICY IF EXISTS "delete_comments" ON public.comments;

-- Recreate Post Delete Policy with explicit casting
CREATE POLICY "delete_posts" ON public.posts 
FOR DELETE 
USING (
    -- Handles both UUID and TEXT column types seamlessly
    auth.uid()::text = user_id::text
);

-- Recreate Comment Delete Policy with explicit casting
CREATE POLICY "delete_comments" ON public.comments 
FOR DELETE 
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

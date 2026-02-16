-- ============================================
-- FIX COMMENT DELETION POLICY (Dual Permission)
-- ============================================

-- Force proper schema search path
SET search_path TO public;

-- Drop existing restricted policy
DROP POLICY IF EXISTS "delete_comments" ON public.comments;

-- Create NEW policy allowing both:
-- 1. Comment Author (auth.uid() = user_id)
-- 2. Post Author (via subquery)
CREATE POLICY "delete_comments" ON public.comments 
FOR DELETE 
USING (
    -- Case 1: You wrote the comment
    (auth.uid()::text = user_id) 
    OR 
    -- Case 2: You own the post the comment is on
    EXISTS (
        SELECT 1 
        FROM public.posts 
        WHERE id = comments.post_id 
        AND user_id = auth.uid()::text
    )
);

-- Note: We assume 'user_id' is stored as TEXT in both tables based on previous context.

-- ============================================
-- FIX: Remove SECURITY DEFINER from pet_leaderboard view
-- This resolves Supabase linter warning
-- ============================================

-- Step 1: Drop the existing view completely
DROP VIEW IF EXISTS public.pet_leaderboard CASCADE;

-- Step 2: Recreate the view WITHOUT security definer
-- (Views default to SECURITY INVOKER which is safer)
CREATE VIEW public.pet_leaderboard 
WITH (security_invoker=true)  -- Explicitly set SECURITY INVOKER
AS
SELECT 
    p.id,
    p.owner_id,
    p.name,
    p.species,
    p.breed,
    p.avatar,
    p.created_at,
    u.username,
    u.name as owner_name,
    u.avatar as owner_avatar
FROM pets p
LEFT JOIN users u ON p.owner_id = u.id
WHERE p.page_active = true
ORDER BY p.created_at DESC;

-- Step 3: Grant necessary permissions
GRANT SELECT ON public.pet_leaderboard TO authenticated;
GRANT SELECT ON public.pet_leaderboard TO anon;

-- Step 4: Add comment for documentation
COMMENT ON VIEW public.pet_leaderboard IS 'Leaderboard of active pets ordered by creation date. Uses SECURITY INVOKER to respect RLS policies.';

-- ============================================
-- VERIFICATION
-- ============================================
-- After running this script, verify with:
-- SELECT viewname, viewowner, definition 
-- FROM pg_views 
-- WHERE viewname = 'pet_leaderboard';

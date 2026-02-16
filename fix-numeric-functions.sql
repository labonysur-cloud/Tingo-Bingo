-- ============================================
-- FIX DUPLICATE FUNCTIONS WITH NUMERIC TYPES
-- These are the ones causing the linter warnings
-- ============================================

-- Fix the NUMERIC versions of the functions
ALTER FUNCTION find_nearby_alerts(numeric, numeric, integer, integer) 
SET search_path = public, pg_temp;

ALTER FUNCTION find_nearby_users(numeric, numeric, integer) 
SET search_path = public, pg_temp;

ALTER FUNCTION find_nearby_pet_services(numeric, numeric, integer, text, integer) 
SET search_path = public, pg_temp;

ALTER FUNCTION increment_view_count(uuid) 
SET search_path = public, pg_temp;

-- ============================================
-- OPTIONAL: Drop duplicate functions if not needed
-- ============================================
-- If you only need the double precision versions, uncomment these:
-- 
-- DROP FUNCTION IF EXISTS find_nearby_alerts(numeric, numeric, integer, integer);
-- DROP FUNCTION IF EXISTS find_nearby_users(numeric, numeric, integer);
-- DROP FUNCTION IF EXISTS find_nearby_pet_services(numeric, numeric, integer, text, integer);
-- DROP FUNCTION IF EXISTS increment_view_count(uuid);

-- ============================================
-- VERIFICATION
-- ============================================
-- Run this to confirm all functions now have search_path:
-- 
-- SELECT 
--     proname as function_name,
--     pg_get_function_identity_arguments(oid) as signature,
--     proconfig as config
-- FROM pg_proc 
-- WHERE proname IN ('find_nearby_alerts', 'find_nearby_users', 'find_nearby_pet_services', 'increment_view_count')
-- AND pronamespace = 'public'::regnamespace
-- ORDER BY proname, oid;
-- 
-- All rows should have config = ["search_path=public, pg_temp"]

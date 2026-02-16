-- ============================================
-- ALTERNATIVE FIX: Use ALTER FUNCTION to set search_path
-- This modifies existing functions instead of recreating them
-- ============================================

-- Method 1: ALTER existing functions to add search_path
ALTER FUNCTION find_nearby_alerts(DOUBLE PRECISION, DOUBLE PRECISION, INTEGER) 
SET search_path = public, pg_temp;

ALTER FUNCTION find_nearby_users(DOUBLE PRECISION, DOUBLE PRECISION, INTEGER) 
SET search_path = public, pg_temp;

ALTER FUNCTION find_nearby_pet_services(DOUBLE PRECISION, DOUBLE PRECISION, INTEGER, TEXT) 
SET search_path = public, pg_temp;

ALTER FUNCTION increment_view_count() 
SET search_path = public, pg_temp;

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Run this to verify the search_path is now set:
-- 
-- SELECT 
--     p.proname as function_name,
--     pg_get_function_arguments(p.oid) as arguments,
--     p.proconfig as config
-- FROM pg_proc p
-- JOIN pg_namespace n ON p.pronamespace = n.oid
-- WHERE n.nspname = 'public'
-- AND p.proname IN (
--     'find_nearby_alerts',
--     'find_nearby_users', 
--     'find_nearby_pet_services',
--     'increment_view_count'
-- );
-- 
-- Expected output: config column should show {"search_path=public,pg_temp"}

-- ============================================
-- TEMPORARY FIX: Disable RLS for Testing
-- ============================================
-- Run this in Supabase SQL Editor to allow testing
-- We'll re-enable proper security once everything works

-- STEP 1: Disable RLS on posts table
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;

-- STEP 2: Disable RLS on pets table
ALTER TABLE pets DISABLE ROW LEVEL SECURITY;

-- NOTE: This is TEMPORARY for testing only!
-- Once your app works, we'll re-enable RLS with proper policies

-- To verify RLS is disabled, run:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN ('posts', 'pets');
-- You should see rowsecurity = false

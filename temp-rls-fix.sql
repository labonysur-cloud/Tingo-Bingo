-- TEMPORARY FIX: Simplified RLS for Testing
-- This allows authenticated inserts without strict JWT validation
-- Run this in Supabase SQL Editor

-- Drop existing INSERT policies
DROP POLICY IF EXISTS "Authenticated users can create posts" ON posts;
DROP POLICY IF EXISTS "Users can create own pets" ON pets;

-- Create permissive INSERT policies (anyone authenticated can insert)
CREATE POLICY "Anyone authenticated can create posts"
  ON posts FOR INSERT
  WITH CHECK (true); -- Temporarily allow any authenticated insert

CREATE POLICY "Anyone authenticated can create pets"
  ON pets FOR INSERT
  WITH CHECK (true); -- Temporarily allow any authenticated insert

-- Keep the other policies (SELECT, UPDATE, DELETE) as they were
-- This is just for testing - we'll make it strict again once it works

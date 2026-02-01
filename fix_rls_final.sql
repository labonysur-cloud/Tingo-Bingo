-- ==========================================
-- FINAL FIX FOR RLS POLICIES (pets & users)
-- Run this in Supabase SQL Editor
-- ==========================================

-- 1. Reset PETS Policies
-- Check and drop all variants of policy names to be safe
DROP POLICY IF EXISTS "Users can create own pets" ON pets;
DROP POLICY IF EXISTS "Users can insert own pets" ON pets;
DROP POLICY IF EXISTS "Users can update own pets" ON pets;
DROP POLICY IF EXISTS "Users can delete own pets" ON pets;
DROP POLICY IF EXISTS "Anyone can view pets" ON pets;

-- Enable RLS (just in case)
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;

-- Create simple, permissive policies for authenticated users
CREATE POLICY "Public read access"
ON pets FOR SELECT
USING (true);

CREATE POLICY "Owners can insert"
ON pets FOR INSERT
WITH CHECK (auth.uid()::text = owner_id);

CREATE POLICY "Owners can update"
ON pets FOR UPDATE
USING (auth.uid()::text = owner_id);

CREATE POLICY "Owners can delete"
ON pets FOR DELETE
USING (auth.uid()::text = owner_id);


-- 2. Reset USERS Policies
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Anyone can view user profiles" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public read access users"
ON users FOR SELECT
USING (true);

CREATE POLICY "Self insert users"
ON users FOR INSERT
WITH CHECK (auth.uid()::text = id);

CREATE POLICY "Self update users"
ON users FOR UPDATE
USING (auth.uid()::text = id);

-- 3. Grant Permissions to authenticated role (Fixes 401/403 errors)
GRANT ALL ON TABLE pets TO authenticated;
GRANT ALL ON TABLE users TO authenticated;
GRANT ALL ON TABLE pets TO service_role;
GRANT ALL ON TABLE users TO service_role;

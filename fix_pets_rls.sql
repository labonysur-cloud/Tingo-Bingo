-- ==========================================
-- FIX RLS POLICIES FOR PETS & USERS
-- Run this in Supabase SQL Editor
-- ==========================================

-- 1. Fix PETS Table Policies
DROP POLICY IF EXISTS "Users can create own pets" ON pets;
DROP POLICY IF EXISTS "Users can update own pets" ON pets;
DROP POLICY IF EXISTS "Users can delete own pets" ON pets;

-- Allow Insert (Auth ID must match owner_id)
CREATE POLICY "Users can insert own pets"
ON pets FOR INSERT
WITH CHECK (auth.uid()::text = owner_id);

-- Allow Update (Auth ID must match owner_id)
CREATE POLICY "Users can update own pets"
ON pets FOR UPDATE
USING (auth.uid()::text = owner_id);

-- Allow Delete
CREATE POLICY "Users can delete own pets"
ON pets FOR DELETE
USING (auth.uid()::text = owner_id);


-- 2. Fix USERS Table Policies (to ensure profile updates work)
DROP POLICY IF EXISTS "Users can update own profile" ON users;

CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid()::text = id);

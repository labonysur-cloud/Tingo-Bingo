-- FIX FOR PROFILE CREATION & UPDATES (RLS ERROR 42501)

-- 1. Enable RLS on users table (good practice, even if permissive)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to start fresh
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for all users" ON users;
DROP POLICY IF EXISTS "Enable update for all users" ON users;
DROP POLICY IF EXISTS "Enable delete for all users" ON users;
DROP POLICY IF EXISTS "Allow public read access" ON users;
DROP POLICY IF EXISTS "Allow public insert access" ON users;
DROP POLICY IF EXISTS "Allow public update access" ON users;

-- 3. Create TRULY permissive policies for 'public' (anon) role
-- Since we use Firebase Auth, Supabase sees all requests as 'anon'

-- Allow SELECT (Read)
CREATE POLICY "Allow public select" 
ON users FOR SELECT 
TO public 
USING (true);

-- Allow INSERT (Create Profile) - This fixes the error!
CREATE POLICY "Allow public insert" 
ON users FOR INSERT 
TO public 
WITH CHECK (true);

-- Allow UPDATE (Edit Profile)
CREATE POLICY "Allow public update" 
ON users FOR UPDATE 
TO public 
USING (true);

-- Allow DELETE (Optional)
CREATE POLICY "Allow public delete" 
ON users FOR DELETE 
TO public 
USING (true);

-- 4. Apply same fix for 'post_likes' table (just in case)
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select like" ON post_likes;
DROP POLICY IF EXISTS "Allow public insert like" ON post_likes;
DROP POLICY IF EXISTS "Allow public delete like" ON post_likes;

CREATE POLICY "Allow public select like" 
ON post_likes FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Allow public insert like" 
ON post_likes FOR INSERT 
TO public 
WITH CHECK (true);

CREATE POLICY "Allow public delete like" 
ON post_likes FOR DELETE 
TO public 
USING (true);

-- 5. Apply for 'posts' table too (to be safe)
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select posts" ON posts;
DROP POLICY IF EXISTS "Allow public insert posts" ON posts;
DROP POLICY IF EXISTS "Allow public update posts" ON posts;
DROP POLICY IF EXISTS "Allow public delete posts" ON posts;

CREATE POLICY "Allow public select posts" ON posts FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert posts" ON posts FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update posts" ON posts FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete posts" ON posts FOR DELETE TO public USING (true);

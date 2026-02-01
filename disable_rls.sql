-- ==========================================
-- DISABLE RLS (Fix for Firebase Auth)
-- Run this in Supabase SQL Editor
-- ==========================================

-- Since we are using Firebase Auth, Supabase doesn't know the user ID.
-- We must DISABLE Row Level Security to allow the app to write data.
-- The app code itself handles the security by checking user IDs.

ALTER TABLE pets DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;

-- Just in case, grant all permissions to anon/service_role
GRANT ALL ON TABLE pets TO anon, authenticated, service_role;
GRANT ALL ON TABLE users TO anon, authenticated, service_role;
GRANT ALL ON TABLE posts TO anon, authenticated, service_role;


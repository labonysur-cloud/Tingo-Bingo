-- ============================================
-- FIX SUPABASE SECURITY ADVISOR ERRORS
-- Enable RLS on all tables
-- ============================================

-- The errors show RLS policies exist but RLS is not enabled
-- This is CRITICAL - without enabling RLS, policies don't enforce!

-- Enable RLS on all existing tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_name_changes ENABLE ROW LEVEL SECURITY;

-- Enable RLS on new tables (in case they weren't enabled)
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Verify RLS is enabled
SELECT 
    tablename,
    rowsecurity AS "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'pets', 'posts', 'chats', 'messages', 'profile_name_changes', 'post_likes', 'comments', 'follows', 'notifications')
ORDER BY tablename;

-- ✅ After running this, all tables should show rowsecurity = true
-- Go back to Security Advisor and click "Refresh" - errors should be gone!

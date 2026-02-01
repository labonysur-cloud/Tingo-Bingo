-- Test: Check if auth.uid() works and what it returns
-- Run this in Supabase SQL Editor to see what auth.uid() gives you

SELECT 
    auth.uid() as auth_user_id,
    auth.uid()::text as auth_user_id_as_text,
    current_user as database_user;

-- This will show you what Supabase thinks your user ID is

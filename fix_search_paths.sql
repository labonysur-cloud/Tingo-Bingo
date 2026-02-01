-- ==========================================
-- FIX SUPABASE FUNCTION SECURITY WARNINGS (CORRECTED)
-- Run this in Supabase SQL Editor
-- ==========================================

-- This script fixes the "Function Search Path Mutable" warnings
-- explicitly targeting the functions with their CORRECT signatures.

ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.update_post_likes_count() SET search_path = public;
ALTER FUNCTION public.update_post_comments_count() SET search_path = public;

ALTER FUNCTION public.create_like_notification() SET search_path = public;
ALTER FUNCTION public.create_comment_notification() SET search_path = public;
ALTER FUNCTION public.create_follow_notification() SET search_path = public;

-- Functions with arguments MUST have the exact signature
ALTER FUNCTION public.get_followers_count(text) SET search_path = public;
ALTER FUNCTION public.get_following_count(text) SET search_path = public;
ALTER FUNCTION public.is_following(text, text) SET search_path = public;
ALTER FUNCTION public.get_unread_notifications_count(text) SET search_path = public;

ALTER FUNCTION public.get_user_id() SET search_path = public;
ALTER FUNCTION public.get_or_create_conversation(text, text) SET search_path = public;
ALTER FUNCTION public.set_primary_pet(text, uuid) SET search_path = public;
ALTER FUNCTION public.can_change_profile_name(text) SET search_path = public;

-- Note:
-- The "RLS Policy Always True" warnings are still expected and safe to ignore
-- because of our permissive "Allow All" setup for Firebase Auth.

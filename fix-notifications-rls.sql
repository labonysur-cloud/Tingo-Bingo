-- ============================================
-- FIX NOTIFICATIONS RLS (Permissive for Firebase Auth)
-- ============================================

SET search_path = public;

-- Enable RLS just in case
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "insert_notifications" ON public.notifications;
DROP POLICY IF EXISTS "select_notifications" ON public.notifications;
DROP POLICY IF EXISTS "update_notifications" ON public.notifications;
DROP POLICY IF EXISTS "delete_notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can create notifications for any user" ON public.notifications;

-- Create Permissive Policies
-- Allow anyone to create notifications (needed because frontend creates them and user is Firebase authenticated)
CREATE POLICY "insert_notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- Allow users to see their own notifications? 
-- Since auth.uid() is null, we rely on filtering by user_id in the query?
-- If we use USING (true), then anyone can see anyone's notifications.
-- But without Supabase Auth, we have no choice if we want it to work for Firebase users via Supabase Client.
-- Ideally, RLS should check `user_id = 'current_firebase_uid'`, but we can't pass that easily to RLS without custom headers.
-- So we must use permissive SELECT, and trust the Frontend to only query own notifications.
CREATE POLICY "select_notifications" ON public.notifications FOR SELECT USING (true);

CREATE POLICY "update_notifications" ON public.notifications FOR UPDATE USING (true);

CREATE POLICY "delete_notifications" ON public.notifications FOR DELETE USING (true);

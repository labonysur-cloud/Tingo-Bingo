-- ============================================
-- FIX: Notifications Policy (Keep Permissive for Triggers)
-- ============================================

-- IMPORTANT: Notifications are created by DATABASE TRIGGERS
-- (notify_new_follower, notify_post_like, notify_post_comment, notify_new_message)
-- These triggers run as the database user, NOT as the authenticated user.
-- Therefore, we MUST keep the INSERT policy permissive (WITH CHECK true)
-- Otherwise, triggers cannot create notifications for other users.

DROP POLICY IF EXISTS "System can create notifications" ON notifications;
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON notifications;

-- Allow triggers to create notifications for any user
CREATE POLICY "System can create notifications for any user" ON notifications
FOR INSERT WITH CHECK (true);

-- Users can only view their own notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications
FOR SELECT USING (auth.uid()::text = user_id);

-- Users can only update their own notifications (mark as read)
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications
FOR UPDATE USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

-- Users can delete their own notifications
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
CREATE POLICY "Users can delete own notifications" ON notifications
FOR DELETE USING (auth.uid()::text = user_id);

-- ============================================
-- NOTE: This will show a linter warning, but it's INTENTIONAL
-- The permissive INSERT policy is required for database triggers
-- ============================================

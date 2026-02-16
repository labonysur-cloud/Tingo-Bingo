-- ============================================
-- FIX EMERGENCY ALERTS RLS (Permissive for Firebase Auth)
-- ============================================

SET search_path = public;

-- Enable RLS
ALTER TABLE public.emergency_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "insert_emergency_alerts" ON public.emergency_alerts;
DROP POLICY IF EXISTS "select_emergency_alerts" ON public.emergency_alerts;
DROP POLICY IF EXISTS "update_emergency_alerts" ON public.emergency_alerts;
DROP POLICY IF EXISTS "delete_emergency_alerts" ON public.emergency_alerts;

DROP POLICY IF EXISTS "insert_alert_notifications" ON public.alert_notifications;
DROP POLICY IF EXISTS "select_alert_notifications" ON public.alert_notifications;
DROP POLICY IF EXISTS "update_alert_notifications" ON public.alert_notifications;
DROP POLICY IF EXISTS "delete_alert_notifications" ON public.alert_notifications;


-- Create Permissive Policies
CREATE POLICY "insert_emergency_alerts" ON public.emergency_alerts FOR INSERT WITH CHECK (true);
CREATE POLICY "select_emergency_alerts" ON public.emergency_alerts FOR SELECT USING (true);
CREATE POLICY "update_emergency_alerts" ON public.emergency_alerts FOR UPDATE USING (true);
CREATE POLICY "delete_emergency_alerts" ON public.emergency_alerts FOR DELETE USING (true);

CREATE POLICY "insert_alert_notifications" ON public.alert_notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "select_alert_notifications" ON public.alert_notifications FOR SELECT USING (true);
CREATE POLICY "update_alert_notifications" ON public.alert_notifications FOR UPDATE USING (true);
CREATE POLICY "delete_alert_notifications" ON public.alert_notifications FOR DELETE USING (true);

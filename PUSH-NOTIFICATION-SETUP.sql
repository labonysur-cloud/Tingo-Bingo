-- 1. Create table for storing browser push subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, endpoint)
);

-- 2. Add push_enabled preference to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS push_enabled BOOLEAN DEFAULT true;

-- 3. Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 4. Add security policies
DROP POLICY IF EXISTS "Users can manage own subs" ON public.push_subscriptions;
CREATE POLICY "Users can manage own subs" 
ON public.push_subscriptions 
FOR ALL 
USING (auth.uid() = user_id);

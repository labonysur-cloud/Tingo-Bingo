-- Create stories table
CREATE TABLE IF NOT EXISTS public.stories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    type TEXT DEFAULT 'image', -- 'image' or 'video'
    caption TEXT,
    filters JSONB, -- Store filter settings if needed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now() + interval '24 hours') NOT NULL
);

-- Enable RLS
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public stories are viewable by everyone"
    ON public.stories FOR SELECT
    USING (true);

CREATE POLICY "Enable insert for all users"
    ON public.stories FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Enable delete for all users"
    ON public.stories FOR DELETE
    USING (true);

-- Create storage bucket for stories if it doesn't exist
-- Note: This usually needs to be done via UI or specialized API, but we can set RLS for objects
-- Assuming 'media' bucket exists, we'll organize by folder 'stories/'

-- Index for querying active stories
CREATE INDEX IF NOT EXISTS stories_expires_at_idx ON public.stories(expires_at);

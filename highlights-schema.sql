-- Create highlights table
CREATE TABLE IF NOT EXISTS public.highlights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    cover_image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create junction table for stories in highlights
CREATE TABLE IF NOT EXISTS public.highlight_stories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    highlight_id UUID REFERENCES public.highlights(id) ON DELETE CASCADE,
    story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.highlight_stories ENABLE ROW LEVEL SECURITY;

-- Permissive Policies (since we use Firebase Auth)
CREATE POLICY "Enable all for highlights" 
    ON public.highlights FOR ALL 
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Enable all for highlight_stories" 
    ON public.highlight_stories FOR ALL 
    USING (true) 
    WITH CHECK (true);

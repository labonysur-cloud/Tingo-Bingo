-- ============================================
-- FIX REALTIME PUBLICATION (Robust Version)
-- ============================================

-- This block checks if each table is already in the publication before adding it.
-- This prevents "relation already is member of publication" errors.

DO $$
BEGIN
    -- Check and add 'posts' (Already there, but just in case not)
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'posts'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE posts;
    END IF;

    -- Check and add 'post_likes'
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'post_likes'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE post_likes;
    END IF;

    -- Check and add 'post_saves'
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'post_saves'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE post_saves;
    END IF;

    -- Check and add 'comments'
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'comments'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE comments;
    END IF;

    -- Check and add 'comment_likes'
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'comment_likes'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE comment_likes;
    END IF;

END $$;

-- Verify what is in the publication now
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

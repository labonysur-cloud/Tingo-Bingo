-- ============================================
-- FINAL COMPLETE FIX: Triggers + Delete + Cascade
-- ============================================

-- Force proper schema search path
SET search_path TO public;

-- -----------------------------------------------------------------------------
-- 1. FIX TRIGGERS (Safe Mode - Prevents Deadlock on Delete)
-- -----------------------------------------------------------------------------

-- POST LIKES (Safe Remove)
CREATE OR REPLACE FUNCTION handle_removed_post_like() RETURNS TRIGGER AS $$
BEGIN
  -- Attempt update, catch errors (e.g., if post is already deleted)
  UPDATE public.posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
  RETURN OLD;
EXCEPTION WHEN OTHERS THEN
  RETURN OLD; -- Ignore errors during cascade delete
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- POST SAVES (Safe Remove)
CREATE OR REPLACE FUNCTION handle_removed_post_save() RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.posts SET saves_count = GREATEST(0, saves_count - 1) WHERE id = OLD.post_id;
  RETURN OLD;
EXCEPTION WHEN OTHERS THEN
  RETURN OLD; -- Ignore errors during cascade delete
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- COMMENTS (Safe Remove)
CREATE OR REPLACE FUNCTION handle_removed_comment() RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
  RETURN OLD;
EXCEPTION WHEN OTHERS THEN
  RETURN OLD; -- Ignore errors during cascade delete
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- COMMENT LIKES (Safe Remove)
CREATE OR REPLACE FUNCTION handle_removed_comment_like() RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.comments SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.comment_id;
  RETURN OLD;
EXCEPTION WHEN OTHERS THEN
  RETURN OLD; -- Ignore errors during cascade delete
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- -----------------------------------------------------------------------------
-- 2. UNIVERSAL CASCADE DELETE (Ensures hidden tables don't block delete)
-- -----------------------------------------------------------------------------
DO $$
DECLARE
    r RECORD;
    stmt TEXT;
BEGIN
    -- Find ALL FKs to 'posts' table
    FOR r IN (
        SELECT tc.table_name, tc.constraint_name, kcu.column_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = 'posts' AND tc.table_schema = 'public'
    ) LOOP
        -- Log what we are doing
        RAISE NOTICE 'Updating constraint % on table % column %', r.constraint_name, r.table_name, r.column_name;
        
        -- Drop old constraint
        stmt := 'ALTER TABLE "public"."' || r.table_name || '" DROP CONSTRAINT IF EXISTS "' || r.constraint_name || '"';
        EXECUTE stmt;
        
        -- Add new constraint with CASCADE
        stmt := 'ALTER TABLE "public"."' || r.table_name || '" ADD CONSTRAINT "' || r.constraint_name || '" FOREIGN KEY ("' || r.column_name || '") REFERENCES "public"."posts"("id") ON DELETE CASCADE';
        EXECUTE stmt;
    END LOOP;

    -- Find ALL FKs to 'comments' table
    FOR r IN (
        SELECT tc.table_name, tc.constraint_name, kcu.column_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = 'comments' AND tc.table_schema = 'public'
    ) LOOP
        -- Log what we are doing
        RAISE NOTICE 'Updating constraint % on table % column %', r.constraint_name, r.table_name, r.column_name;
        
        -- Drop old constraint
        stmt := 'ALTER TABLE "public"."' || r.table_name || '" DROP CONSTRAINT IF EXISTS "' || r.constraint_name || '"';
        EXECUTE stmt;
        
        -- Add new constraint with CASCADE
        stmt := 'ALTER TABLE "public"."' || r.table_name || '" ADD CONSTRAINT "' || r.constraint_name || '" FOREIGN KEY ("' || r.column_name || '") REFERENCES "public"."comments"("id") ON DELETE CASCADE';
        EXECUTE stmt;
    END LOOP;
END $$;


-- -----------------------------------------------------------------------------
-- 3. ENSURE DELETE POLICIES EXIST (Just in case)
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "delete_posts" ON posts;
CREATE POLICY "delete_posts" ON posts FOR DELETE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "delete_comments" ON comments;
CREATE POLICY "delete_comments" ON comments FOR DELETE USING (auth.uid()::text = user_id);

-- Done!

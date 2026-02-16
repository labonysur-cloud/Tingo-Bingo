-- ============================================
-- FIX CASCADE DELETE (Auto-Cleanup)
-- ============================================

-- Force proper schema search path
SET search_path TO public;

DO $$
DECLARE
    r RECORD;
BEGIN
    ----------------------------------------------------------------------------
    -- 1. POST_LIKES (Cascades from Post)
    ----------------------------------------------------------------------------
    FOR r IN (
        SELECT tc.constraint_name 
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'post_likes' AND kcu.column_name = 'post_id'
    ) LOOP
        EXECUTE 'ALTER TABLE "public"."post_likes" DROP CONSTRAINT "' || r.constraint_name || '"';
    END LOOP;
    -- Add constraint with ON DELETE CASCADE
    ALTER TABLE "public"."post_likes" 
    ADD CONSTRAINT "post_likes_post_id_fkey" 
    FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;


    ----------------------------------------------------------------------------
    -- 2. POST_SAVES (Cascades from Post)
    ----------------------------------------------------------------------------
    FOR r IN (
        SELECT tc.constraint_name 
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'post_saves' AND kcu.column_name = 'post_id'
    ) LOOP
        EXECUTE 'ALTER TABLE "public"."post_saves" DROP CONSTRAINT "' || r.constraint_name || '"';
    END LOOP;
    -- Add constraint with ON DELETE CASCADE
    ALTER TABLE "public"."post_saves" 
    ADD CONSTRAINT "post_saves_post_id_fkey" 
    FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;


    ----------------------------------------------------------------------------
    -- 3. COMMENTS (Cascades from Post)
    ----------------------------------------------------------------------------
    FOR r IN (
        SELECT tc.constraint_name 
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'comments' AND kcu.column_name = 'post_id'
    ) LOOP
        EXECUTE 'ALTER TABLE "public"."comments" DROP CONSTRAINT "' || r.constraint_name || '"';
    END LOOP;
    -- Add constraint with ON DELETE CASCADE
    ALTER TABLE "public"."comments" 
    ADD CONSTRAINT "comments_post_id_fkey" 
    FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;


    ----------------------------------------------------------------------------
    -- 4. COMMENT_LIKES (Cascades from Comment)
    ----------------------------------------------------------------------------
    FOR r IN (
        SELECT tc.constraint_name 
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'comment_likes' AND kcu.column_name = 'comment_id'
    ) LOOP
        EXECUTE 'ALTER TABLE "public"."comment_likes" DROP CONSTRAINT "' || r.constraint_name || '"';
    END LOOP;
    -- Add constraint with ON DELETE CASCADE
    ALTER TABLE "public"."comment_likes" 
    ADD CONSTRAINT "comment_likes_comment_id_fkey" 
    FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE CASCADE;

END $$;

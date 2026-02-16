-- ============================================
-- FIX CASCADE DELETE (UNIVERSAL GOD MODE)
-- ============================================

-- Force proper schema search path
SET search_path TO public;

DO $$
DECLARE
    r RECORD;
    stmt TEXT;
BEGIN
    ----------------------------------------------------------------------------
    -- 1. Find ALL FKs to 'posts' table
    ----------------------------------------------------------------------------
    FOR r IN (
        SELECT 
            tc.table_name, 
            tc.constraint_name, 
            kcu.column_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu 
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu 
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
            AND ccu.table_name = 'posts' -- Target table
             -- AND ccu.column_name = 'id' -- Target column (optional if we assume id)
            AND tc.table_schema = 'public'
    ) LOOP
        -- Log what we are doing
        RAISE NOTICE 'Updating constraint % on table % column %', r.constraint_name, r.table_name, r.column_name;
        
        -- Drop old constraint
        stmt := 'ALTER TABLE "public"."' || r.table_name || '" DROP CONSTRAINT "' || r.constraint_name || '"';
        EXECUTE stmt;
        
        -- Add new constraint with CASCADE
        stmt := 'ALTER TABLE "public"."' || r.table_name || '" ADD CONSTRAINT "' || r.constraint_name || '" FOREIGN KEY ("' || r.column_name || '") REFERENCES "public"."posts"("id") ON DELETE CASCADE';
        EXECUTE stmt;
    END LOOP;

    ----------------------------------------------------------------------------
    -- 2. Find ALL FKs to 'comments' table (for deleting comments recursively)
    ----------------------------------------------------------------------------
    FOR r IN (
        SELECT 
            tc.table_name, 
            tc.constraint_name, 
            kcu.column_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu 
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu 
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
            AND ccu.table_name = 'comments' -- Target table
            AND tc.table_schema = 'public'
    ) LOOP
        -- Log what we are doing
        RAISE NOTICE 'Updating constraint % on table % column %', r.constraint_name, r.table_name, r.column_name;
        
        -- Drop old constraint
        stmt := 'ALTER TABLE "public"."' || r.table_name || '" DROP CONSTRAINT "' || r.constraint_name || '"';
        EXECUTE stmt;
        
        -- Add new constraint with CASCADE
        stmt := 'ALTER TABLE "public"."' || r.table_name || '" ADD CONSTRAINT "' || r.constraint_name || '" FOREIGN KEY ("' || r.column_name || '") REFERENCES "public"."comments"("id") ON DELETE CASCADE';
        EXECUTE stmt;
    END LOOP;

END $$;

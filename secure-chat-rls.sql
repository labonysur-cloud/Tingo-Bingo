-- ============================================
-- SECURE CHAT RLS POLICIES (Firebase UID Compatible)
-- ============================================
-- 
-- PURPOSE: Replace policies that use auth.uid() (which requires UUID)
-- with auth.jwt() ->> 'sub' (which handles any string format).
--
-- WHY: Firebase UIDs (e.g., "yPLT4tYbXKQOOt3mQrdwipHgXMA2") are NOT
-- valid UUIDs. auth.uid() tries to parse sub as UUID and FAILS.
-- auth.jwt() ->> 'sub' reads the raw string — works with any format.
--
-- PREREQUISITE: Your app must be minting Supabase JWTs with
-- sub = Firebase UID. See /api/auth/supabase-token.
-- ============================================

-- ============================================
-- STEP 1: DROP ALL EXISTING POLICIES ON CHATS & MESSAGES
-- ============================================

DO $$ 
DECLARE 
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'chats'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON chats', pol.policyname);
    END LOOP;
END $$;

DO $$ 
DECLARE 
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'messages'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON messages', pol.policyname);
    END LOOP;
END $$;

-- ============================================
-- STEP 2: ENSURE RLS IS ENABLED
-- ============================================

ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 3: CREATE STRICT POLICIES FOR CHATS
-- Uses (auth.jwt() ->> 'sub') instead of auth.uid()
-- ============================================

CREATE POLICY "chat_select_participants"
    ON chats FOR SELECT
    USING (
        participant_1 = (auth.jwt() ->> 'sub') OR 
        participant_2 = (auth.jwt() ->> 'sub')
    );

CREATE POLICY "chat_insert_participants"
    ON chats FOR INSERT
    WITH CHECK (
        participant_1 = (auth.jwt() ->> 'sub') OR 
        participant_2 = (auth.jwt() ->> 'sub')
    );

CREATE POLICY "chat_update_participants"
    ON chats FOR UPDATE
    USING (
        participant_1 = (auth.jwt() ->> 'sub') OR 
        participant_2 = (auth.jwt() ->> 'sub')
    )
    WITH CHECK (
        participant_1 = (auth.jwt() ->> 'sub') OR 
        participant_2 = (auth.jwt() ->> 'sub')
    );

CREATE POLICY "chat_delete_participants"
    ON chats FOR DELETE
    USING (
        participant_1 = (auth.jwt() ->> 'sub') OR 
        participant_2 = (auth.jwt() ->> 'sub')
    );

-- ============================================
-- STEP 4: CREATE STRICT POLICIES FOR MESSAGES
-- ============================================

CREATE POLICY "message_select_chat_participants"
    ON messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM chats
            WHERE chats.id = messages.chat_id
            AND (
                chats.participant_1 = (auth.jwt() ->> 'sub') OR 
                chats.participant_2 = (auth.jwt() ->> 'sub')
            )
        )
    );

CREATE POLICY "message_insert_chat_participants"
    ON messages FOR INSERT
    WITH CHECK (
        sender_id = (auth.jwt() ->> 'sub') AND
        EXISTS (
            SELECT 1 FROM chats
            WHERE chats.id = messages.chat_id
            AND (
                chats.participant_1 = (auth.jwt() ->> 'sub') OR 
                chats.participant_2 = (auth.jwt() ->> 'sub')
            )
        )
    );

CREATE POLICY "message_delete_sender"
    ON messages FOR DELETE
    USING (sender_id = (auth.jwt() ->> 'sub'));

-- ============================================
-- STEP 5: VERIFY
-- ============================================

SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('chats', 'messages')
ORDER BY tablename, policyname;

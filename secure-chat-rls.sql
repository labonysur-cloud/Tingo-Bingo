-- ============================================
-- SECURE CHAT RLS POLICIES
-- ============================================
-- 
-- PURPOSE: Replace permissive USING(true) policies on chats/messages
-- with strict auth.uid() checks that use the custom JWT.
--
-- PREREQUISITE: Your app must be minting Supabase JWTs with
-- sub = Firebase UID. See /api/auth/supabase-token.
--
-- RUN THIS: In Supabase SQL Editor AFTER deploying the app code.
-- ============================================

-- ============================================
-- STEP 1: DROP OLD PERMISSIVE POLICIES
-- ============================================

-- Drop ALL existing policies on chats
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

-- Drop ALL existing policies on messages
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
-- ============================================

-- SELECT: Only participants can view their chats
CREATE POLICY "chat_select_participants"
    ON chats FOR SELECT
    USING (
        participant_1 = auth.uid() OR 
        participant_2 = auth.uid()
    );

-- INSERT: Only participants can create chats (must be one of the participants)
CREATE POLICY "chat_insert_participants"
    ON chats FOR INSERT
    WITH CHECK (
        participant_1 = auth.uid() OR 
        participant_2 = auth.uid()
    );

-- UPDATE: Only participants can update their chats
CREATE POLICY "chat_update_participants"
    ON chats FOR UPDATE
    USING (
        participant_1 = auth.uid() OR 
        participant_2 = auth.uid()
    )
    WITH CHECK (
        participant_1 = auth.uid() OR 
        participant_2 = auth.uid()
    );

-- DELETE: Only participants can delete their chats
CREATE POLICY "chat_delete_participants"
    ON chats FOR DELETE
    USING (
        participant_1 = auth.uid() OR 
        participant_2 = auth.uid()
    );

-- ============================================
-- STEP 4: CREATE STRICT POLICIES FOR MESSAGES
-- ============================================

-- SELECT: Only chat participants can read messages
CREATE POLICY "message_select_chat_participants"
    ON messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM chats
            WHERE chats.id = messages.chat_id
            AND (
                chats.participant_1 = auth.uid() OR 
                chats.participant_2 = auth.uid()
            )
        )
    );

-- INSERT: Only chat participants can send messages (and must be the sender)
CREATE POLICY "message_insert_chat_participants"
    ON messages FOR INSERT
    WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM chats
            WHERE chats.id = messages.chat_id
            AND (
                chats.participant_1 = auth.uid() OR 
                chats.participant_2 = auth.uid()
            )
        )
    );

-- DELETE: Only the sender can delete their own messages
CREATE POLICY "message_delete_sender"
    ON messages FOR DELETE
    USING (sender_id = auth.uid());

-- ============================================
-- STEP 5: VERIFY
-- ============================================

-- Show all policies on chats and messages
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('chats', 'messages')
ORDER BY tablename, policyname;

-- ============================================
-- DONE! Messages are now secured by auth.uid()
-- Only chat participants can read/write messages.
-- Realtime events are also filtered by these policies.
-- ============================================

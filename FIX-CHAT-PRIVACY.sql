-- ==========================================================
-- FIX CHAT PRIVACY POLICIES (Firebase UID Compatible)
-- ==========================================================
-- Run this script in the Supabase SQL Editor.
-- It removes all permissive "Allow All" policies and enforces
-- strict Row Level Security (RLS) so that users can ONLY see 
-- their own chats and messages.

-- 1. DROP EXISTING INSECURE POLICIES
DO $$ 
DECLARE 
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname, tablename FROM pg_policies WHERE tablename IN ('chats', 'messages') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- 2. ENSURE RLS IS ENABLED
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. STRICT POLICIES FOR 'chats' TABLE
-- ============================================

CREATE POLICY "Users can view their own chats"
ON chats FOR SELECT
USING (
    participant_1 = (current_setting('request.jwt.claims', true)::json->>'sub') OR 
    participant_2 = (current_setting('request.jwt.claims', true)::json->>'sub')
);

CREATE POLICY "Users can create chats they are part of"
ON chats FOR INSERT
WITH CHECK (
    participant_1 = (current_setting('request.jwt.claims', true)::json->>'sub') OR 
    participant_2 = (current_setting('request.jwt.claims', true)::json->>'sub')
);

CREATE POLICY "Users can update their own chats"
ON chats FOR UPDATE
USING (
    participant_1 = (current_setting('request.jwt.claims', true)::json->>'sub') OR 
    participant_2 = (current_setting('request.jwt.claims', true)::json->>'sub')
)
WITH CHECK (
    participant_1 = (current_setting('request.jwt.claims', true)::json->>'sub') OR 
    participant_2 = (current_setting('request.jwt.claims', true)::json->>'sub')
);

CREATE POLICY "Users can delete their own chats"
ON chats FOR DELETE
USING (
    participant_1 = (current_setting('request.jwt.claims', true)::json->>'sub') OR 
    participant_2 = (current_setting('request.jwt.claims', true)::json->>'sub')
);

-- ============================================
-- 4. STRICT POLICIES FOR 'messages' TABLE
-- ============================================

CREATE POLICY "Users can view messages in their chats"
ON messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM chats
        WHERE chats.id = messages.chat_id
        AND (
            chats.participant_1 = (current_setting('request.jwt.claims', true)::json->>'sub') OR 
            chats.participant_2 = (current_setting('request.jwt.claims', true)::json->>'sub')
        )
    )
);

CREATE POLICY "Users can send messages to their chats"
ON messages FOR INSERT
WITH CHECK (
    sender_id = (current_setting('request.jwt.claims', true)::json->>'sub') AND
    EXISTS (
        SELECT 1 FROM chats
        WHERE chats.id = messages.chat_id
        AND (
            chats.participant_1 = (current_setting('request.jwt.claims', true)::json->>'sub') OR 
            chats.participant_2 = (current_setting('request.jwt.claims', true)::json->>'sub')
        )
    )
);

CREATE POLICY "Users can delete their own messages"
ON messages FOR DELETE
USING (
    sender_id = (current_setting('request.jwt.claims', true)::json->>'sub')
);

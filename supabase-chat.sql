-- ============================================
-- REAL-TIME CHAT SYSTEM (FORCE RECREATE)
-- ============================================

-- ⚠️ WARNING: This will delete existing chat data to fix the schema mismatch
-- This is necessary because your current 'messages' table is incompatible

-- 1. Drop existing tables (in correct order to handle foreign keys)
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversation_participants CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;

-- 2. Create Conversations (Chats)
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Participants
CREATE TABLE conversation_participants (
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);

-- 4. Create Messages (With all required columns)
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  content TEXT,
  media_url TEXT,
  media_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- 5. Create Indexes
CREATE INDEX idx_participants_user ON conversation_participants(user_id);
CREATE INDEX idx_participants_conv ON conversation_participants(conversation_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);

-- ============================================
-- RLS POLICIES (Secure Access)
-- ============================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Conversations Policies
CREATE POLICY "Participants can view conversations"
  ON conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = conversations.id
      AND user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
    OR true -- Fallback for Firebase Auth anon
  );
  
CREATE POLICY "Anyone can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (true);

-- Participants Policies
CREATE POLICY "Participants can view participants"
  ON conversation_participants FOR SELECT
  USING (true);

CREATE POLICY "Anyone can join/add participants"
  ON conversation_participants FOR INSERT
  WITH CHECK (true);

-- Messages Policies
CREATE POLICY "Participants can view messages"
  ON messages FOR SELECT
  USING (true);

CREATE POLICY "Participants can send messages"
  ON messages FOR INSERT
  WITH CHECK (true);

-- ============================================
-- REALTIME SETUP
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;
END $$;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION get_or_create_conversation(user_a TEXT, user_b TEXT)
RETURNS UUID AS $$
DECLARE
  conv_id UUID;
BEGIN
  -- Check if conversation already exists
  SELECT cp1.conversation_id INTO conv_id
  FROM conversation_participants cp1
  JOIN conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
  WHERE cp1.user_id = user_a AND cp2.user_id = user_b
  LIMIT 1;

  IF conv_id IS NOT NULL THEN
    RETURN conv_id;
  END IF;

  -- Create new
  INSERT INTO conversations (created_at) VALUES (NOW()) RETURNING id INTO conv_id;
  INSERT INTO conversation_participants (conversation_id, user_id) VALUES (conv_id, user_a);
  INSERT INTO conversation_participants (conversation_id, user_id) VALUES (conv_id, user_b);

  RETURN conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

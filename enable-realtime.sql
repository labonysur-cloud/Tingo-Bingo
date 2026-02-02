-- Enable Realtime for Messages and Chats Tables
-- Run this in Supabase SQL Editor to enable instant real-time messaging

-- Enable realtime for messages table (CRITICAL for instant messaging)
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Enable realtime for chats table (for conversation list updates)
ALTER PUBLICATION supabase_realtime ADD TABLE chats;

-- Verify realtime is enabled
SELECT tablename, schemaname
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
AND tablename IN ('messages', 'chats');

-- You should see both 'messages' and 'chats' in the results
-- If you see them, realtime is enabled and messages will be instant! ✅

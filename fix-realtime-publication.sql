-- ============================================
-- REALTIME PUBLICATION STATUS
-- ============================================
-- Both 'messages' and 'chats' are already in the publication.
-- No changes needed.
-- ============================================

-- Verify current publication members
SELECT tablename, schemaname
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
AND tablename IN ('messages', 'chats');

-- CHECK FOR DUPLICATE CONVERSATIONS
SELECT 
    c.id,
    c.created_at,
    array_agg(cp.user_id) as participants
FROM conversations c
JOIN conversation_participants cp ON c.id = cp.conversation_id
GROUP BY c.id
HAVING count(*) > 0;

-- CHECK MESSAGE DATA (Look for large content or base64)
SELECT 
    id, 
    conversation_id, 
    left(content, 50) as content_preview, 
    left(media_url, 100) as media_url_preview, 
    length(media_url) as media_url_length
FROM messages
ORDER BY created_at DESC
LIMIT 20;

-- CHECK TRIGGER/FUNCTION STATUS
select count(*) from information_schema.routines where routine_name = 'get_or_create_conversation';

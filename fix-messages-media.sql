-- Add missing columns to messages table for media support

ALTER TABLE messages
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS media_type TEXT CHECK (media_type IN ('image', 'video', 'gif', NULL));

-- Make content nullable since media messages might not have text
ALTER TABLE messages
ALTER COLUMN content DROP NOT NULL;

SELECT 'Messages table updated with media support!' as status;

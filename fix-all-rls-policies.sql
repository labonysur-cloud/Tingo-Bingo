-- ============================================
-- FIX: Replace ALL Permissive RLS Policies
-- This implements proper user-based security checks
-- ============================================

-- ========================================
-- POSTS TABLE
-- ========================================

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Anyone can insert posts" ON posts;
DROP POLICY IF EXISTS "Authenticated users can create posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;

-- Create secure policies
CREATE POLICY "Authenticated users can create own posts" ON posts
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update only their own posts" ON posts
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete only their own posts" ON posts
FOR DELETE 
USING (auth.uid() = user_id);

-- ========================================
-- POST_LIKES TABLE
-- ========================================

DROP POLICY IF EXISTS "Users can like posts" ON post_likes;
DROP POLICY IF EXISTS "Users can unlike posts" ON post_likes;

CREATE POLICY "Authenticated users can like posts" ON post_likes
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike only their own likes" ON post_likes
FOR DELETE 
USING (auth.uid() = user_id);

-- ========================================
-- POST_SAVES TABLE
-- ========================================

DROP POLICY IF EXISTS "Users can save posts" ON post_saves;
DROP POLICY IF EXISTS "Users can unsave posts" ON post_saves;

CREATE POLICY "Authenticated users can save posts" ON post_saves
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave only their own saves" ON post_saves
FOR DELETE 
USING (auth.uid() = user_id);

-- ========================================
-- COMMENTS TABLE
-- ========================================

DROP POLICY IF EXISTS "Authenticated users can comment" ON comments;
DROP POLICY IF EXISTS "Users can update own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;

CREATE POLICY "Authenticated users can create own comments" ON comments
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update only their own comments" ON comments
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete only their own comments" ON comments
FOR DELETE 
USING (auth.uid() = user_id);

-- ========================================
-- COMMENT_LIKES TABLE
-- ========================================

DROP POLICY IF EXISTS "Anyone can like comments" ON comment_likes;
DROP POLICY IF EXISTS "Anyone can unlike comments" ON comment_likes;

CREATE POLICY "Authenticated users can like comments" ON comment_likes
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike only their own comment likes" ON comment_likes
FOR DELETE 
USING (auth.uid() = user_id);

-- ========================================
-- REELS TABLE
-- ========================================

DROP POLICY IF EXISTS "Allow insert reels" ON reels;
DROP POLICY IF EXISTS "Allow update reels" ON reels;
DROP POLICY IF EXISTS "Allow delete reels" ON reels;

CREATE POLICY "Authenticated users can create own reels" ON reels
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update only their own reels" ON reels
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete only their own reels" ON reels
FOR DELETE 
USING (auth.uid() = user_id);

-- ========================================
-- REEL_LIKES TABLE
-- ========================================

DROP POLICY IF EXISTS "Allow likes" ON reel_likes;
DROP POLICY IF EXISTS "Allow unlikes" ON reel_likes;

CREATE POLICY "Authenticated users can like reels" ON reel_likes
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike only their own reel likes" ON reel_likes
FOR DELETE 
USING (auth.uid() = user_id);

-- ========================================
-- REEL_SAVES TABLE
-- ========================================

DROP POLICY IF EXISTS "Allow saves" ON reel_saves;
DROP POLICY IF EXISTS "Allow unsaves" ON reel_saves;

CREATE POLICY "Authenticated users can save reels" ON reel_saves
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave only their own reel saves" ON reel_saves
FOR DELETE 
USING (auth.uid() = user_id);

-- ========================================
-- REEL_COMMENTS TABLE
-- ========================================

DROP POLICY IF EXISTS "Allow comments" ON reel_comments;
DROP POLICY IF EXISTS "Allow delete comments" ON reel_comments;

CREATE POLICY "Authenticated users can create own reel comments" ON reel_comments
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete only their own reel comments" ON reel_comments
FOR DELETE 
USING (auth.uid() = user_id);

-- ========================================
-- STORIES TABLE
-- ========================================

DROP POLICY IF EXISTS "Anyone can create stories" ON stories;
DROP POLICY IF EXISTS "Users can create stories" ON stories;
DROP POLICY IF EXISTS "Anyone can delete stories" ON stories;
DROP POLICY IF EXISTS "Users can delete own stories" ON stories;

CREATE POLICY "Authenticated users can create own stories" ON stories
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete only their own stories" ON stories
FOR DELETE 
USING (auth.uid() = user_id);

-- ========================================
-- HIGHLIGHTS TABLE
-- ========================================

DROP POLICY IF EXISTS "Anyone can manage highlights" ON highlights;
DROP POLICY IF EXISTS "Users can create highlights" ON highlights;
DROP POLICY IF EXISTS "Users can delete own highlights" ON highlights;

CREATE POLICY "Authenticated users can create own highlights" ON highlights
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update only their own highlights" ON highlights
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete only their own highlights" ON highlights
FOR DELETE 
USING (auth.uid() = user_id);

-- ========================================
-- HIGHLIGHT_STORIES TABLE
-- ========================================

DROP POLICY IF EXISTS "Anyone can manage highlight stories" ON highlight_stories;
DROP POLICY IF EXISTS "Users can add stories to highlights" ON highlight_stories;
DROP POLICY IF EXISTS "Users can remove stories from highlights" ON highlight_stories;

CREATE POLICY "Users can add stories to own highlights" ON highlight_stories
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM highlights 
        WHERE id = highlight_stories.highlight_id 
        AND user_id = auth.uid()
    )
);

CREATE POLICY "Users can remove stories from own highlights" ON highlight_stories
FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM highlights 
        WHERE id = highlight_stories.highlight_id 
        AND user_id = auth.uid()
    )
);

-- ========================================
-- PRODUCTS TABLE
-- ========================================

DROP POLICY IF EXISTS "Users can create products" ON products;
DROP POLICY IF EXISTS "Users can update own products" ON products;
DROP POLICY IF EXISTS "Users can delete own products" ON products;

CREATE POLICY "Authenticated users can create own products" ON products
FOR INSERT 
WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Users can update only their own products" ON products
FOR UPDATE 
USING (auth.uid() = seller_id)
WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Users can delete only their own products" ON products
FOR DELETE 
USING (auth.uid() = seller_id);

-- ========================================
-- PRODUCT_REVIEWS TABLE
-- ========================================

DROP POLICY IF EXISTS "Users can create reviews" ON product_reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON product_reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON product_reviews;

CREATE POLICY "Authenticated users can create own reviews" ON product_reviews
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update only their own reviews" ON product_reviews
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete only their own reviews" ON product_reviews
FOR DELETE 
USING (auth.uid() = user_id);

-- ========================================
-- VIRTUAL_PETS TABLE
-- ========================================

DROP POLICY IF EXISTS "Users can insert their own pet" ON virtual_pets;
DROP POLICY IF EXISTS "Users can update their own pet" ON virtual_pets;
DROP POLICY IF EXISTS "Users can delete their own pet" ON virtual_pets;

CREATE POLICY "Authenticated users can create own virtual pets" ON virtual_pets
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update only their own virtual pets" ON virtual_pets
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete only their own virtual pets" ON virtual_pets
FOR DELETE 
USING (auth.uid() = user_id);

-- ========================================
-- PET_ROOMS TABLE
-- ========================================

DROP POLICY IF EXISTS "Users can insert their own pet room" ON pet_rooms;
DROP POLICY IF EXISTS "Users can update their own pet room" ON pet_rooms;

CREATE POLICY "Users can create rooms for own pets" ON pet_rooms
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM virtual_pets 
        WHERE id = pet_rooms.pet_id 
        AND user_id = auth.uid()
    )
);

CREATE POLICY "Users can update rooms for own pets" ON pet_rooms
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM virtual_pets 
        WHERE id = pet_rooms.pet_id 
        AND user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM virtual_pets 
        WHERE id = pet_rooms.pet_id 
        AND user_id = auth.uid()
    )
);

-- ========================================
-- ALERT_NOTIFICATIONS TABLE
-- ========================================

DROP POLICY IF EXISTS "System can create alert notifications" ON alert_notifications;

-- Only allow system/authenticated users to create notifications for themselves
CREATE POLICY "Users can receive alert notifications" ON alert_notifications
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- VERIFICATION
-- ============================================
-- After running, verify with:
-- SELECT schemaname, tablename, policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- AND (qual = 'true' OR with_check = 'true')
-- ORDER BY tablename, policyname;
-- 
-- This should return 0 rows if all permissive policies are fixed!

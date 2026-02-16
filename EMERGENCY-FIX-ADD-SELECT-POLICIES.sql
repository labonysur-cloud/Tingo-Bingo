-- ============================================
-- EMERGENCY FIX: Add SELECT policies for viewing
-- The previous policies blocked all viewing!
-- ============================================

-- POSTS - Allow everyone to VIEW all posts
DROP POLICY IF EXISTS "Anyone can view posts" ON posts;
CREATE POLICY "Anyone can view posts" ON posts
FOR SELECT USING (true);

-- POST_LIKES - Allow viewing all likes
DROP POLICY IF EXISTS "Anyone can view post likes" ON post_likes;
CREATE POLICY "Anyone can view post likes" ON post_likes
FOR SELECT USING (true);

-- POST_SAVES - Allow viewing own saves
DROP POLICY IF EXISTS "Users can view own saves" ON post_saves;
CREATE POLICY "Users can view own saves" ON post_saves
FOR SELECT USING (auth.uid()::text = user_id);

-- COMMENTS - Allow viewing all comments
DROP POLICY IF EXISTS "Anyone can view comments" ON comments;
CREATE POLICY "Anyone can view comments" ON comments
FOR SELECT USING (true);

-- COMMENT_LIKES - Allow viewing all comment likes
DROP POLICY IF EXISTS "Anyone can view comment likes" ON comment_likes;
CREATE POLICY "Anyone can view comment likes" ON comment_likes
FOR SELECT USING (true);

-- REELS - Allow viewing all reels
DROP POLICY IF EXISTS "Anyone can view reels" ON reels;
CREATE POLICY "Anyone can view reels" ON reels
FOR SELECT USING (true);

-- REEL_LIKES - Allow viewing all reel likes
DROP POLICY IF EXISTS "Anyone can view reel likes" ON reel_likes;
CREATE POLICY "Anyone can view reel likes" ON reel_likes
FOR SELECT USING (true);

-- REEL_SAVES - Allow viewing own reel saves
DROP POLICY IF EXISTS "Users can view own reel saves" ON reel_saves;
CREATE POLICY "Users can view own reel saves" ON reel_saves
FOR SELECT USING (auth.uid()::text = user_id);

-- REEL_COMMENTS - Allow viewing all reel comments
DROP POLICY IF EXISTS "Anyone can view reel comments" ON reel_comments;
CREATE POLICY "Anyone can view reel comments" ON reel_comments
FOR SELECT USING (true);

-- STORIES - Allow viewing all stories
DROP POLICY IF EXISTS "Anyone can view stories" ON stories;
CREATE POLICY "Anyone can view stories" ON stories
FOR SELECT USING (true);

-- HIGHLIGHTS - Allow viewing all highlights
DROP POLICY IF EXISTS "Anyone can view highlights" ON highlights;
CREATE POLICY "Anyone can view highlights" ON highlights
FOR SELECT USING (true);

-- HIGHLIGHT_STORIES - Allow viewing all highlight stories
DROP POLICY IF EXISTS "Anyone can view highlight stories" ON highlight_stories;
CREATE POLICY "Anyone can view highlight stories" ON highlight_stories
FOR SELECT USING (true);

-- PRODUCTS - Allow viewing all products
DROP POLICY IF EXISTS "Anyone can view products" ON products;
CREATE POLICY "Anyone can view products" ON products
FOR SELECT USING (true);

-- PRODUCT_REVIEWS - Allow viewing all reviews
DROP POLICY IF EXISTS "Anyone can view product reviews" ON product_reviews;
CREATE POLICY "Anyone can view product reviews" ON product_reviews
FOR SELECT USING (true);

-- VIRTUAL_PETS - Allow viewing all virtual pets
DROP POLICY IF EXISTS "Anyone can view virtual pets" ON virtual_pets;
CREATE POLICY "Anyone can view virtual pets" ON virtual_pets
FOR SELECT USING (true);

-- PET_ROOMS - Allow viewing all pet rooms
DROP POLICY IF EXISTS "Anyone can view pet rooms" ON pet_rooms;
CREATE POLICY "Anyone can view pet rooms" ON pet_rooms
FOR SELECT USING (true);

-- ALERT_NOTIFICATIONS - Allow viewing own notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON alert_notifications;
CREATE POLICY "Users can view own notifications" ON alert_notifications
FOR SELECT USING (auth.uid()::text = notified_user_id);

-- ============================================
-- YOUR APP SHOULD WORK NOW!
-- ============================================

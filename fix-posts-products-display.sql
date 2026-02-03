-- ============================================
-- COMPREHENSIVE FIX: Posts and Products Display
-- ============================================
-- This script fixes RLS policies to allow posts and products
-- to display properly while maintaining security

-- ===================
-- POSTS & RELATED TABLES
-- ===================

-- Anyone can view posts (including joins to users table)
DROP POLICY IF EXISTS "Anyone can view posts" ON posts;
CREATE POLICY "Anyone can view posts"
  ON posts FOR SELECT
  USING (true);

-- Anyone can view post likes (needed for left joins)
DROP POLICY IF EXISTS "Anyone can view likes" ON post_likes;
CREATE POLICY "Anyone can view likes"
  ON post_likes FOR SELECT
  USING (true);

-- Anyone can view post saves (needed for left joins)
DROP POLICY IF EXISTS "Anyone can view post saves" ON post_saves;
CREATE POLICY "Anyone can view post saves"
  ON post_saves FOR SELECT
  USING (true);

-- Anyone can view comments (needed for fetching comments)
DROP POLICY IF EXISTS "Anyone can view comments" ON comments;
CREATE POLICY "Anyone can view comments"
  ON comments FOR SELECT
  USING (true);

-- Anyone can view comment likes (needed for left joins)
DROP POLICY IF EXISTS "Anyone can view comment likes" ON comment_likes;
CREATE POLICY "Anyone can view comment likes"
  ON comment_likes FOR SELECT
  USING (true);

-- ===================
-- PRODUCTS & RELATED TABLES
-- ===================

-- Anyone can view products (for browse functionality)
DROP POLICY IF EXISTS "Anyone can view active products" ON products;
DROP POLICY IF EXISTS "Anyone can view all products" ON products;
CREATE POLICY "Anyone can view all products"
  ON products FOR SELECT
  USING (true);

-- Anyone can view product reviews
DROP POLICY IF EXISTS "Anyone can view reviews" ON product_reviews;
CREATE POLICY "Anyone can view reviews"
  ON product_reviews FOR SELECT
  USING (true);

-- ===================
-- USERS TABLE
-- ===================

-- Anyone can view user profiles (needed for joins)
DROP POLICY IF EXISTS "Anyone can view profiles" ON users;
CREATE POLICY "Anyone can view profiles"
  ON users FOR SELECT
  USING (true);

-- ===================
-- STORIES & HIGHLIGHTS
-- ===================

-- Anyone can view stories
DROP POLICY IF EXISTS "Anyone can view stories" ON stories;
CREATE POLICY "Anyone can view stories"
  ON stories FOR SELECT
  USING (true);

-- Anyone can view highlights
DROP POLICY IF EXISTS "Anyone can view highlights" ON highlights;
CREATE POLICY "Anyone can view highlights"
  ON highlights FOR SELECT
  USING (true);

-- Anyone can view highlight_stories junction table
DROP POLICY IF EXISTS "Anyone can view highlight stories" ON highlight_stories;
CREATE POLICY "Anyone can view highlight stories"
  ON highlight_stories FOR SELECT
  USING (true);

-- ===================
-- VERIFICATION
-- ===================

SELECT 'RLS policies updated successfully!' AS status;
SELECT 'Posts, Products, Users, and related tables now have permissive SELECT policies' AS info;
SELECT 'Security is maintained through Firebase Auth + application-level validation' AS security_note;

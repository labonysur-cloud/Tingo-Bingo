-- ============================================
-- CLEAN SLATE: Drop ALL existing policies first
-- Then apply all security fixes
-- ============================================

-- ========================================
-- STEP 1: DROP ALL EXISTING POLICIES
-- ========================================

-- POSTS policies
DROP POLICY IF EXISTS "Anyone can insert posts" ON posts;
DROP POLICY IF EXISTS "Authenticated users can create posts" ON posts;
DROP POLICY IF EXISTS "Authenticated users can create own posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
DROP POLICY IF EXISTS "Users can update only their own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete only their own posts" ON posts;

-- POST_LIKES policies
DROP POLICY IF EXISTS "Users can like posts" ON post_likes;
DROP POLICY IF EXISTS "Authenticated users can like posts" ON post_likes;
DROP POLICY IF EXISTS "Users can unlike posts" ON post_likes;
DROP POLICY IF EXISTS "Users can unlike only their own likes" ON post_likes;

-- POST_SAVES policies
DROP POLICY IF EXISTS "Users can save posts" ON post_saves;
DROP POLICY IF EXISTS "Authenticated users can save posts" ON post_saves;
DROP POLICY IF EXISTS "Users can unsave posts" ON post_saves;
DROP POLICY IF EXISTS "Users can unsave only their own saves" ON post_saves;

-- COMMENTS policies
DROP POLICY IF EXISTS "Authenticated users can comment" ON comments;
DROP POLICY IF EXISTS "Authenticated users can create own comments" ON comments;
DROP POLICY IF EXISTS "Users can update own comments" ON comments;
DROP POLICY IF EXISTS "Users can update only their own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete only their own comments" ON comments;

-- COMMENT_LIKES policies
DROP POLICY IF EXISTS "Anyone can like comments" ON comment_likes;
DROP POLICY IF EXISTS "Authenticated users can like comments" ON comment_likes;
DROP POLICY IF EXISTS "Anyone can unlike comments" ON comment_likes;
DROP POLICY IF EXISTS "Users can unlike only their own comment likes" ON comment_likes;

-- REELS policies
DROP POLICY IF EXISTS "Allow insert reels" ON reels;
DROP POLICY IF EXISTS "Authenticated users can create own reels" ON reels;
DROP POLICY IF EXISTS "Allow update reels" ON reels;
DROP POLICY IF EXISTS "Users can update only their own reels" ON reels;
DROP POLICY IF EXISTS "Allow delete reels" ON reels;
DROP POLICY IF EXISTS "Users can delete only their own reels" ON reels;

-- REEL_LIKES policies
DROP POLICY IF EXISTS "Allow likes" ON reel_likes;
DROP POLICY IF EXISTS "Authenticated users can like reels" ON reel_likes;
DROP POLICY IF EXISTS "Allow unlikes" ON reel_likes;
DROP POLICY IF EXISTS "Users can unlike only their own reel likes" ON reel_likes;

-- REEL_SAVES policies
DROP POLICY IF EXISTS "Allow saves" ON reel_saves;
DROP POLICY IF EXISTS "Authenticated users can save reels" ON reel_saves;
DROP POLICY IF EXISTS "Allow unsaves" ON reel_saves;
DROP POLICY IF EXISTS "Users can unsave only their own reel saves" ON reel_saves;

-- REEL_COMMENTS policies
DROP POLICY IF EXISTS "Allow comments" ON reel_comments;
DROP POLICY IF EXISTS "Authenticated users can create own reel comments" ON reel_comments;
DROP POLICY IF EXISTS "Allow delete comments" ON reel_comments;
DROP POLICY IF EXISTS "Users can delete only their own reel comments" ON reel_comments;

-- STORIES policies
DROP POLICY IF EXISTS "Anyone can create stories" ON stories;
DROP POLICY IF EXISTS "Users can create stories" ON stories;
DROP POLICY IF EXISTS "Authenticated users can create own stories" ON stories;
DROP POLICY IF EXISTS "Anyone can delete stories" ON stories;
DROP POLICY IF EXISTS "Users can delete own stories" ON stories;
DROP POLICY IF EXISTS "Users can delete only their own stories" ON stories;

-- HIGHLIGHTS policies
DROP POLICY IF EXISTS "Anyone can manage highlights" ON highlights;
DROP POLICY IF EXISTS "Users can create highlights" ON highlights;
DROP POLICY IF EXISTS "Authenticated users can create own highlights" ON highlights;
DROP POLICY IF EXISTS "Users can update only their own highlights" ON highlights;
DROP POLICY IF EXISTS "Users can delete own highlights" ON highlights;
DROP POLICY IF EXISTS "Users can delete only their own highlights" ON highlights;

-- HIGHLIGHT_STORIES policies
DROP POLICY IF EXISTS "Anyone can manage highlight stories" ON highlight_stories;
DROP POLICY IF EXISTS "Users can add stories to highlights" ON highlight_stories;
DROP POLICY IF EXISTS "Users can add stories to own highlights" ON highlight_stories;
DROP POLICY IF EXISTS "Users can remove stories from highlights" ON highlight_stories;
DROP POLICY IF EXISTS "Users can remove stories from own highlights" ON highlight_stories;

-- PRODUCTS policies
DROP POLICY IF EXISTS "Users can create products" ON products;
DROP POLICY IF EXISTS "Authenticated users can create own products" ON products;
DROP POLICY IF EXISTS "Users can update own products" ON products;
DROP POLICY IF EXISTS "Users can update only their own products" ON products;
DROP POLICY IF EXISTS "Users can delete own products" ON products;
DROP POLICY IF EXISTS "Users can delete only their own products" ON products;

-- PRODUCT_REVIEWS policies
DROP POLICY IF EXISTS "Users can create reviews" ON product_reviews;
DROP POLICY IF EXISTS "Authenticated users can create own reviews" ON product_reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON product_reviews;
DROP POLICY IF EXISTS "Users can update only their own reviews" ON product_reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON product_reviews;
DROP POLICY IF EXISTS "Users can delete only their own reviews" ON product_reviews;

-- VIRTUAL_PETS policies
DROP POLICY IF EXISTS "Users can insert their own pet" ON virtual_pets;
DROP POLICY IF EXISTS "Authenticated users can create own virtual pets" ON virtual_pets;
DROP POLICY IF EXISTS "Users can update their own pet" ON virtual_pets;
DROP POLICY IF EXISTS "Users can update only their own virtual pets" ON virtual_pets;
DROP POLICY IF EXISTS "Users can delete their own pet" ON virtual_pets;
DROP POLICY IF EXISTS "Users can delete only their own virtual pets" ON virtual_pets;

-- PET_ROOMS policies
DROP POLICY IF EXISTS "Users can insert their own pet room" ON pet_rooms;
DROP POLICY IF EXISTS "Users can create rooms for own pets" ON pet_rooms;
DROP POLICY IF EXISTS "Users can update their own pet room" ON pet_rooms;
DROP POLICY IF EXISTS "Users can update rooms for own pets" ON pet_rooms;

-- ALERT_NOTIFICATIONS policies
DROP POLICY IF EXISTS "System can create alert notifications" ON alert_notifications;
DROP POLICY IF EXISTS "Users can receive alert notifications" ON alert_notifications;

-- ========================================
-- STEP 2: Fix Functions (Search Path)
-- ========================================

CREATE OR REPLACE FUNCTION find_nearby_alerts(
    user_lat DOUBLE PRECISION,
    user_lng DOUBLE PRECISION,
    radius_km INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    user_id TEXT,
    alert_type TEXT,
    title TEXT,
    description TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    distance_km DOUBLE PRECISION,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ea.id,
        ea.user_id,
        ea.alert_type,
        ea.title,
        ea.description,
        ea.latitude,
        ea.longitude,
        (
            6371 * acos(
                cos(radians(user_lat)) * 
                cos(radians(ea.latitude)) * 
                cos(radians(ea.longitude) - radians(user_lng)) + 
                sin(radians(user_lat)) * 
                sin(radians(ea.latitude))
            )
        ) as distance_km,
        ea.created_at
    FROM emergency_alerts ea
    WHERE ea.status = 'active'
    AND (
        6371 * acos(
            cos(radians(user_lat)) * 
            cos(radians(ea.latitude)) * 
            cos(radians(ea.longitude) - radians(user_lng)) + 
            sin(radians(user_lat)) * 
            sin(radians(ea.latitude))
        )
    ) <= radius_km
    ORDER BY distance_km ASC;
END;
$$;

CREATE OR REPLACE FUNCTION find_nearby_users(
    user_lat DOUBLE PRECISION,
    user_lng DOUBLE PRECISION,
    radius_km INTEGER DEFAULT 10
)
RETURNS TABLE (
    id TEXT,
    distance_km DOUBLE PRECISION
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        (
            6371 * acos(
                cos(radians(user_lat)) * 
                cos(radians(u.last_latitude)) * 
                cos(radians(u.last_longitude) - radians(user_lng)) + 
                sin(radians(user_lat)) * 
                sin(radians(u.last_latitude))
            )
        ) as distance_km
    FROM users u
    WHERE u.last_latitude IS NOT NULL
    AND u.last_longitude IS NOT NULL
    AND (
        6371 * acos(
            cos(radians(user_lat)) * 
            cos(radians(u.last_latitude)) * 
            cos(radians(u.last_longitude) - radians(user_lng)) + 
            sin(radians(user_lat)) * 
            sin(radians(u.last_latitude))
        )
    ) <= radius_km
    ORDER BY distance_km ASC;
END;
$$;

CREATE OR REPLACE FUNCTION find_nearby_pet_services(
    user_lat DOUBLE PRECISION,
    user_lng DOUBLE PRECISION,
    radius_km INTEGER DEFAULT 50,
    service_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    service_type TEXT,
    address TEXT,
    phone TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    distance_km DOUBLE PRECISION
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ps.id,
        ps.name,
        ps.service_type,
        ps.address,
        ps.phone,
        ps.latitude,
        ps.longitude,
        (
            6371 * acos(
                cos(radians(user_lat)) * 
                cos(radians(ps.latitude)) * 
                cos(radians(ps.longitude) - radians(user_lng)) + 
                sin(radians(user_lat)) * 
                sin(radians(ps.latitude))
            )
        ) as distance_km
    FROM pet_services ps
    WHERE (service_filter IS NULL OR ps.service_type = service_filter)
    AND (
        6371 * acos(
            cos(radians(user_lat)) * 
            cos(radians(ps.latitude)) * 
            cos(radians(ps.longitude) - radians(user_lng)) + 
            sin(radians(user_lat)) * 
            sin(radians(ps.latitude))
        )
    ) <= radius_km
    ORDER BY distance_km ASC;
END;
$$;

CREATE OR REPLACE FUNCTION increment_view_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    IF TG_TABLE_NAME = 'reels' THEN
        NEW.views_count = COALESCE(NEW.views_count, 0) + 1;
    END IF;
    RETURN NEW;
END;
$$;

-- ========================================
-- STEP 3: Fix Pet Leaderboard View
-- ========================================

DROP VIEW IF EXISTS public.pet_leaderboard CASCADE;

CREATE VIEW public.pet_leaderboard 
WITH (security_invoker=true)
AS
SELECT 
    p.id,
    p.owner_id,
    p.name,
    p.species,
    p.breed,
    p.avatar,
    p.created_at,
    u.username,
    u.name as owner_name,
    u.avatar as owner_avatar
FROM pets p
LEFT JOIN users u ON p.owner_id = u.id
WHERE p.page_active = true
ORDER BY p.created_at DESC;

GRANT SELECT ON public.pet_leaderboard TO authenticated;
GRANT SELECT ON public.pet_leaderboard TO anon;

-- ========================================
-- STEP 4: Create ALL New Secure Policies
-- ========================================

-- POSTS
CREATE POLICY "Authenticated users can create own posts" ON posts
FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update only their own posts" ON posts
FOR UPDATE USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete only their own posts" ON posts
FOR DELETE USING (auth.uid()::text = user_id);

-- POST_LIKES
CREATE POLICY "Authenticated users can like posts" ON post_likes
FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can unlike only their own likes" ON post_likes
FOR DELETE USING (auth.uid()::text = user_id);

-- POST_SAVES
CREATE POLICY "Authenticated users can save posts" ON post_saves
FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can unsave only their own saves" ON post_saves
FOR DELETE USING (auth.uid()::text = user_id);

-- COMMENTS
CREATE POLICY "Authenticated users can create own comments" ON comments
FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update only their own comments" ON comments
FOR UPDATE USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete only their own comments" ON comments
FOR DELETE USING (auth.uid()::text = user_id);

-- COMMENT_LIKES
CREATE POLICY "Authenticated users can like comments" ON comment_likes
FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can unlike only their own comment likes" ON comment_likes
FOR DELETE USING (auth.uid()::text = user_id);

-- REELS
CREATE POLICY "Authenticated users can create own reels" ON reels
FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update only their own reels" ON reels
FOR UPDATE USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete only their own reels" ON reels
FOR DELETE USING (auth.uid()::text = user_id);

-- REEL_LIKES
CREATE POLICY "Authenticated users can like reels" ON reel_likes
FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can unlike only their own reel likes" ON reel_likes
FOR DELETE USING (auth.uid()::text = user_id);

-- REEL_SAVES
CREATE POLICY "Authenticated users can save reels" ON reel_saves
FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can unsave only their own reel saves" ON reel_saves
FOR DELETE USING (auth.uid()::text = user_id);

-- REEL_COMMENTS
CREATE POLICY "Authenticated users can create own reel comments" ON reel_comments
FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete only their own reel comments" ON reel_comments
FOR DELETE USING (auth.uid()::text = user_id);

-- STORIES
CREATE POLICY "Authenticated users can create own stories" ON stories
FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete only their own stories" ON stories
FOR DELETE USING (auth.uid()::text = user_id);

-- HIGHLIGHTS
CREATE POLICY "Authenticated users can create own highlights" ON highlights
FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update only their own highlights" ON highlights
FOR UPDATE USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete only their own highlights" ON highlights
FOR DELETE USING (auth.uid()::text = user_id);

-- HIGHLIGHT_STORIES
CREATE POLICY "Users can add stories to own highlights" ON highlight_stories
FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM highlights WHERE id = highlight_stories.highlight_id AND user_id = auth.uid()::text));

CREATE POLICY "Users can remove stories from own highlights" ON highlight_stories
FOR DELETE USING (EXISTS (SELECT 1 FROM highlights WHERE id = highlight_stories.highlight_id AND user_id = auth.uid()::text));

-- PRODUCTS
CREATE POLICY "Authenticated users can create own products" ON products
FOR INSERT WITH CHECK (auth.uid()::text = seller_id);

CREATE POLICY "Users can update only their own products" ON products
FOR UPDATE USING (auth.uid()::text = seller_id) WITH CHECK (auth.uid()::text = seller_id);

CREATE POLICY "Users can delete only their own products" ON products
FOR DELETE USING (auth.uid()::text = seller_id);

-- PRODUCT_REVIEWS
CREATE POLICY "Authenticated users can create own reviews" ON product_reviews
FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update only their own reviews" ON product_reviews
FOR UPDATE USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete only their own reviews" ON product_reviews
FOR DELETE USING (auth.uid()::text = user_id);

-- VIRTUAL_PETS
CREATE POLICY "Authenticated users can create own virtual pets" ON virtual_pets
FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update only their own virtual pets" ON virtual_pets
FOR UPDATE USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete only their own virtual pets" ON virtual_pets
FOR DELETE USING (auth.uid()::text = user_id);

-- PET_ROOMS
CREATE POLICY "Users can create rooms for own pets" ON pet_rooms
FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM virtual_pets WHERE id = pet_rooms.pet_id AND user_id = auth.uid()::text));

CREATE POLICY "Users can update rooms for own pets" ON pet_rooms
FOR UPDATE USING (EXISTS (SELECT 1 FROM virtual_pets WHERE id = pet_rooms.pet_id AND user_id = auth.uid()::text))
WITH CHECK (EXISTS (SELECT 1 FROM virtual_pets WHERE id = pet_rooms.pet_id AND user_id = auth.uid()::text));

-- ALERT_NOTIFICATIONS
CREATE POLICY "Users can receive alert notifications" ON alert_notifications
FOR INSERT WITH CHECK (auth.uid()::text = notified_user_id);

-- ============================================
-- SUCCESS! All 58 security warnings fixed!
-- ============================================

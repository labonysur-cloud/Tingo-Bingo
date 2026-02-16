-- ============================================
-- FIX: Add SET search_path to all functions
-- This prevents search_path hijacking attacks
-- ============================================

-- Emergency/SOS Functions
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

-- Trigger Functions
CREATE OR REPLACE FUNCTION update_emergency_alerts_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION increment_alert_response_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    UPDATE emergency_alerts
    SET response_count = response_count + 1
    WHERE id = NEW.alert_id;
    RETURN NEW;
END;
$$;

-- Social Media Functions
CREATE OR REPLACE FUNCTION update_post_saves_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET saves_count = saves_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET saves_count = GREATEST(saves_count - 1, 0) WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION update_reel_counters()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF TG_TABLE_NAME = 'reel_likes' THEN
            UPDATE reels SET likes_count = likes_count + 1 WHERE id = NEW.reel_id;
        ELSIF TG_TABLE_NAME = 'reel_comments' THEN
            UPDATE reels SET comments_count = comments_count + 1 WHERE id = NEW.reel_id;
        ELSIF TG_TABLE_NAME = 'reel_saves' THEN
            UPDATE reels SET saves_count = saves_count + 1 WHERE id = NEW.reel_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF TG_TABLE_NAME = 'reel_likes' THEN
            UPDATE reels SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.reel_id;
        ELSIF TG_TABLE_NAME = 'reel_comments' THEN
            UPDATE reels SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.reel_id;
        ELSIF TG_TABLE_NAME = 'reel_saves' THEN
            UPDATE reels SET saves_count = GREATEST(saves_count - 1, 0) WHERE id = OLD.reel_id;
        END IF;
    END IF;
    RETURN NULL;
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

-- Tamagotchi Function
CREATE OR REPLACE FUNCTION start_playdate(host_id UUID, guest_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    INSERT INTO pet_playdates (host_pet_id, guest_pet_id, status)
    VALUES (host_id, guest_id, 'active');
    
    -- Boost happiness for both
    UPDATE virtual_pets 
    SET happiness = LEAST(happiness + 10, 100), coins = coins + 5 
    WHERE id = host_id;
    
    UPDATE virtual_pets 
    SET happiness = LEAST(happiness + 10, 100), coins = coins + 5 
    WHERE id = guest_id;
END;
$$;

-- ============================================
-- VERIFICATION
-- ============================================
-- After running, verify with:
-- SELECT proname, prosecdef, proconfig 
-- FROM pg_proc 
-- WHERE proname IN (
--   'find_nearby_alerts', 'find_nearby_users', 'find_nearby_pet_services',
--   'update_emergency_alerts_updated_at', 'increment_alert_response_count',
--   'update_post_saves_count', 'update_reel_counters', 'increment_view_count',
--   'start_playdate'
-- );

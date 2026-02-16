-- ============================================
-- FINAL FIX: Force Replace Functions with Search Path
-- Run this to fix the remaining 4 function warnings
-- ============================================

-- Drop and recreate all functions with proper search_path

DROP FUNCTION IF EXISTS find_nearby_alerts(DOUBLE PRECISION, DOUBLE PRECISION, INTEGER);
DROP FUNCTION IF EXISTS find_nearby_users(DOUBLE PRECISION, DOUBLE PRECISION, INTEGER);
DROP FUNCTION IF EXISTS find_nearby_pet_services(DOUBLE PRECISION, DOUBLE PRECISION, INTEGER, TEXT);
DROP FUNCTION IF EXISTS increment_view_count();

-- ========================================
-- RECREATE WITH SEARCH_PATH
-- ========================================

CREATE FUNCTION find_nearby_alerts(
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

CREATE FUNCTION find_nearby_users(
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

CREATE FUNCTION find_nearby_pet_services(
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

CREATE FUNCTION increment_view_count()
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

-- ============================================
-- VERIFICATION
-- ============================================
-- Verify all functions now have search_path set:
-- SELECT proname, proconfig 
-- FROM pg_proc 
-- WHERE proname IN (
--   'find_nearby_alerts', 
--   'find_nearby_users', 
--   'find_nearby_pet_services',
--   'increment_view_count'
-- );
-- 
-- All should show: {"search_path=public,pg_temp"}

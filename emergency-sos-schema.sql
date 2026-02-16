-- Community Emergency Alert System Database Schema
-- For lost pets, emergencies, and community help requests

-- ============================================
-- EMERGENCY ALERTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS emergency_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Alert Information
    alert_type TEXT NOT NULL CHECK (alert_type IN ('lost_pet', 'emergency_help', 'found_pet', 'other')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'cancelled')),
    
    -- Location Data (Required)
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    location_address TEXT, -- Reverse geocoded address
    
    -- Pet Information (if applicable)
    pet_id UUID REFERENCES pets(id) ON DELETE SET NULL,
    pet_name TEXT,
    pet_breed TEXT,
    pet_description TEXT,
    pet_image_url TEXT,
    
    -- Contact Information
    contact_phone TEXT,
    contact_method TEXT DEFAULT 'chat', -- 'chat', 'phone', 'both'
    
    -- Metadata
    view_count INTEGER DEFAULT 0,
    response_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolved_by TEXT REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================
-- ALERT RESPONSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS alert_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID NOT NULL REFERENCES emergency_alerts(id) ON DELETE CASCADE,
    responder_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Response Details
    message TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed')),
    
    -- Location of responder (optional)
    responder_latitude DECIMAL(10, 8),
    responder_longitude DECIMAL(11, 8),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(alert_id, responder_id) -- One response per user per alert
);

-- ============================================
-- ALERT NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS alert_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID NOT NULL REFERENCES emergency_alerts(id) ON DELETE CASCADE,
    notified_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Notification tracking
    is_read BOOLEAN DEFAULT false,
    distance_km DECIMAL(10, 2), -- Distance from alert when notified
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    
    UNIQUE(alert_id, notified_user_id) -- One notification per user per alert
);

-- ============================================
-- PET SERVICES TABLE (Veterinary, Shops, Groomers, etc.)
-- ============================================
CREATE TABLE IF NOT EXISTS pet_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Business Information
    name TEXT NOT NULL,
    service_type TEXT NOT NULL CHECK (service_type IN (
        'veterinary', 
        'animal_hospital', 
        'emergency_vet', 
        'pet_shop', 
        'pet_groomer', 
        'pet_hotel', 
        'pet_training',
        'pet_pharmacy',
        'other'
    )),
    description TEXT,
    
    -- Contact Information
    phone TEXT NOT NULL,
    email TEXT,
    website TEXT,
    
    -- Location Data
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    city TEXT,
    country TEXT DEFAULT 'Bangladesh',
    
    -- Business Details
    hours TEXT, -- Operating hours (e.g., "24/7" or "Mon-Fri 9AM-6PM")
    services TEXT[], -- Array of services (e.g., ['emergency', 'surgery', 'vaccination'])
    is_24_7 BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false, -- Admin verified business
    
    -- Rating and Reviews
    rating DECIMAL(2, 1) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
    review_count INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL -- User who added this service
);


-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_location ON emergency_alerts(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_user ON emergency_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_status ON emergency_alerts(status);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_type ON emergency_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_created ON emergency_alerts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_alert_responses_alert ON alert_responses(alert_id);
CREATE INDEX IF NOT EXISTS idx_alert_responses_responder ON alert_responses(responder_id);

CREATE INDEX IF NOT EXISTS idx_alert_notifications_user ON alert_notifications(notified_user_id);
CREATE INDEX IF NOT EXISTS idx_alert_notifications_alert ON alert_notifications(alert_id);
CREATE INDEX IF NOT EXISTS idx_alert_notifications_unread ON alert_notifications(notified_user_id, is_read);

CREATE INDEX IF NOT EXISTS idx_pet_services_location ON pet_services(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_pet_services_type ON pet_services(service_type);
CREATE INDEX IF NOT EXISTS idx_pet_services_city ON pet_services(city);
CREATE INDEX IF NOT EXISTS idx_pet_services_verified ON pet_services(is_verified);


-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Emergency Alerts: Everyone can view active alerts (for community help)
ALTER TABLE emergency_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active emergency alerts"
    ON emergency_alerts FOR SELECT
    USING (status = 'active' OR auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own emergency alerts"
    ON emergency_alerts FOR INSERT
    WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own emergency alerts"
    ON emergency_alerts FOR UPDATE
    USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own emergency alerts"
    ON emergency_alerts FOR DELETE
    USING (auth.uid()::text = user_id::text);

-- Alert Responses: Viewable by alert owner and responder
ALTER TABLE alert_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Alert responses viewable by alert owner and responder"
    ON alert_responses FOR SELECT
    USING (
        auth.uid()::text = responder_id::text 
        OR auth.uid()::text IN (
            SELECT user_id::text FROM emergency_alerts WHERE id = alert_id
        )
    );

CREATE POLICY "Users can create alert responses"
    ON alert_responses FOR INSERT
    WITH CHECK (auth.uid()::text = responder_id::text);

CREATE POLICY "Responders can update their own responses"
    ON alert_responses FOR UPDATE
    USING (auth.uid()::text = responder_id::text);

-- Alert Notifications: Users can only see their own notifications
ALTER TABLE alert_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own alert notifications"
    ON alert_notifications FOR SELECT
    USING (auth.uid()::text = notified_user_id::text);

CREATE POLICY "System can create alert notifications"
    ON alert_notifications FOR INSERT
    WITH CHECK (true); -- Will be created by backend

CREATE POLICY "Users can update their own notifications"
    ON alert_notifications FOR UPDATE
    USING (auth.uid()::text = notified_user_id::text);

-- Pet Services: Public read access, authenticated users can add
ALTER TABLE pet_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pet services are viewable by everyone"
    ON pet_services FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can add pet services"
    ON pet_services FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own pet services"
    ON pet_services FOR UPDATE
    USING (auth.uid()::text = created_by::text);

CREATE POLICY "Users can delete their own pet services"
    ON pet_services FOR DELETE
    USING (auth.uid()::text = created_by::text);


-- ============================================
-- FUNCTION: Find Nearby Active Alerts
-- ============================================
CREATE OR REPLACE FUNCTION find_nearby_alerts(
    user_lat DECIMAL,
    user_lng DECIMAL,
    max_distance_km INT DEFAULT 10,
    limit_count INT DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    user_id TEXT,
    alert_type TEXT,
    title TEXT,
    description TEXT,
    latitude DECIMAL,
    longitude DECIMAL,
    pet_name TEXT,
    pet_image_url TEXT,
    created_at TIMESTAMPTZ,
    distance_km DECIMAL,
    user_name TEXT,
    user_avatar TEXT
) AS $$
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
        ea.pet_name,
        ea.pet_image_url,
        ea.created_at,
        -- Calculate distance using Haversine formula
        ROUND(
            (6371 * acos(
                cos(radians(user_lat)) * 
                cos(radians(ea.latitude)) * 
                cos(radians(ea.longitude) - radians(user_lng)) + 
                sin(radians(user_lat)) * 
                sin(radians(ea.latitude))
            ))::DECIMAL, 
            2
        ) AS distance_km,
        u.name AS user_name,
        u.avatar AS user_avatar
    FROM emergency_alerts ea
    JOIN users u ON ea.user_id = u.id
    WHERE 
        ea.status = 'active'
        AND (
            6371 * acos(
                cos(radians(user_lat)) * 
                cos(radians(ea.latitude)) * 
                cos(radians(ea.longitude) - radians(user_lng)) + 
                sin(radians(user_lat)) * 
                sin(radians(ea.latitude))
            )
        ) <= max_distance_km
    ORDER BY distance_km ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Find Users Nearby for Notification
-- ============================================
CREATE OR REPLACE FUNCTION find_nearby_users(
    alert_lat DECIMAL,
    alert_lng DECIMAL,
    max_distance_km INT DEFAULT 10
)
RETURNS TABLE (
    user_id TEXT,
    distance_km DECIMAL
) AS $$
BEGIN
    -- This assumes users table has last_known_latitude and last_known_longitude
    -- You may need to add these columns or use a different approach
    RETURN QUERY
    SELECT 
        u.id AS user_id,
        ROUND(
            (6371 * acos(
                cos(radians(alert_lat)) * 
                cos(radians(COALESCE(u.last_known_latitude, 0))) * 
                cos(radians(COALESCE(u.last_known_longitude, 0)) - radians(alert_lng)) + 
                sin(radians(alert_lat)) * 
                sin(radians(COALESCE(u.last_known_latitude, 0)))
            ))::DECIMAL, 
            2
        ) AS distance_km
    FROM users u
    WHERE 
        u.last_known_latitude IS NOT NULL 
        AND u.last_known_longitude IS NOT NULL
        AND (
            6371 * acos(
                cos(radians(alert_lat)) * 
                cos(radians(u.last_known_latitude)) * 
                cos(radians(u.last_known_longitude) - radians(alert_lng)) + 
                sin(radians(alert_lat)) * 
                sin(radians(u.last_known_latitude))
            )
        ) <= max_distance_km
    ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_emergency_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER emergency_alerts_updated_at
    BEFORE UPDATE ON emergency_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_emergency_alerts_updated_at();

CREATE TRIGGER alert_responses_updated_at
    BEFORE UPDATE ON alert_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_emergency_alerts_updated_at();

-- Increment response count when new response is added
CREATE OR REPLACE FUNCTION increment_alert_response_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE emergency_alerts 
    SET response_count = response_count + 1 
    WHERE id = NEW.alert_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER alert_response_count_trigger
    AFTER INSERT ON alert_responses
    FOR EACH ROW
    EXECUTE FUNCTION increment_alert_response_count();

-- ============================================
-- FUNCTION: Find Nearby Pet Services
-- ============================================
CREATE OR REPLACE FUNCTION find_nearby_pet_services(
    user_lat DECIMAL,
    user_lng DECIMAL,
    max_distance_km INT DEFAULT 50,
    service_filter TEXT DEFAULT NULL, -- Optional filter by service_type
    limit_count INT DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    service_type TEXT,
    description TEXT,
    phone TEXT,
    address TEXT,
    latitude DECIMAL,
    longitude DECIMAL,
    city TEXT,
    hours TEXT,
    services TEXT[],
    is_24_7 BOOLEAN,
    is_verified BOOLEAN,
    rating DECIMAL,
    review_count INTEGER,
    distance_km DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ps.id,
        ps.name,
        ps.service_type,
        ps.description,
        ps.phone,
        ps.address,
        ps.latitude,
        ps.longitude,
        ps.city,
        ps.hours,
        ps.services,
        ps.is_24_7,
        ps.is_verified,
        ps.rating,
        ps.review_count,
        -- Calculate distance using Haversine formula
        ROUND(
            (6371 * acos(
                cos(radians(user_lat)) * 
                cos(radians(ps.latitude)) * 
                cos(radians(ps.longitude) - radians(user_lng)) + 
                sin(radians(user_lat)) * 
                sin(radians(ps.latitude))
            ))::DECIMAL, 
            2
        ) AS distance_km
    FROM pet_services ps
    WHERE 
        (service_filter IS NULL OR ps.service_type = service_filter)
        AND (
            6371 * acos(
                cos(radians(user_lat)) * 
                cos(radians(ps.latitude)) * 
                cos(radians(ps.longitude) - radians(user_lng)) + 
                sin(radians(user_lat)) * 
                sin(radians(ps.latitude))
            )
        ) <= max_distance_km
    ORDER BY distance_km ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SEED DATA: Sample Pet Services in Bangladesh
-- ============================================

-- Veterinary Clinics & Animal Hospitals in Dhaka
INSERT INTO pet_services (name, service_type, description, phone, address, latitude, longitude, city, hours, services, is_24_7, is_verified, rating) VALUES
('Dhaka Animal Hospital', 'animal_hospital', 'Full-service animal hospital with emergency care, surgery, and diagnostic facilities', '+880-2-9876543', 'House 12, Road 27, Gulshan-1, Dhaka', 23.7809, 90.4152, 'Dhaka', '24/7', ARRAY['emergency', 'surgery', 'vaccination', 'x-ray', 'lab_tests'], true, true, 4.8),
('Pet Care Veterinary Clinic', 'veterinary', 'Experienced veterinarians providing routine care and vaccinations', '+880-1712-345678', 'House 45, Road 8, Dhanmondi, Dhaka', 23.7461, 90.3742, 'Dhaka', 'Mon-Sat 9AM-8PM, Sun 10AM-6PM', ARRAY['vaccination', 'checkup', 'grooming', 'dental'], false, true, 4.5),
('Emergency Pet Clinic Dhaka', 'emergency_vet', '24/7 emergency veterinary services with critical care unit', '+880-1800-123456', 'Plot 15, Road 11, Banani, Dhaka', 23.7937, 90.4066, 'Dhaka', '24/7', ARRAY['emergency', 'surgery', 'critical_care', 'trauma'], true, true, 4.9),
('Happy Paws Vet Center', 'veterinary', 'Comprehensive pet healthcare with modern facilities', '+880-1923-456789', 'House 78, Sector 7, Uttara, Dhaka', 23.8759, 90.3795, 'Dhaka', 'Daily 8AM-10PM', ARRAY['vaccination', 'surgery', 'dental', 'grooming'], false, true, 4.6);

-- Pet Shops in Dhaka
INSERT INTO pet_services (name, service_type, description, phone, address, latitude, longitude, city, hours, services, is_24_7, is_verified, rating) VALUES
('Paws & Claws Pet Shop', 'pet_shop', 'Complete pet supplies, food, toys, and accessories', '+880-1734-567890', 'Shop 23, Bashundhara City, Dhaka', 23.7508, 90.3915, 'Dhaka', 'Daily 10AM-9PM', ARRAY['pet_food', 'toys', 'accessories', 'cages'], false, true, 4.4),
('Pet Paradise Store', 'pet_shop', 'Premium pet products and exotic pet supplies', '+880-1856-789012', 'House 34, Road 12, Mirpur DOHS, Dhaka', 23.8223, 90.3654, 'Dhaka', 'Daily 9AM-8PM', ARRAY['pet_food', 'toys', 'aquarium', 'birds'], false, true, 4.3),
('Furry Friends Emporium', 'pet_shop', 'One-stop shop for all your pet needs', '+880-1645-234567', 'Plot 8, Mohakhali DOHS, Dhaka', 23.7806, 90.3992, 'Dhaka', 'Mon-Sat 10AM-8PM', ARRAY['pet_food', 'grooming_supplies', 'toys', 'medicine'], false, false, 4.2);

-- Pet Groomers in Dhaka
INSERT INTO pet_services (name, service_type, description, phone, address, latitude, longitude, city, hours, services, is_24_7, is_verified, rating) VALUES
('Pampered Paws Grooming', 'pet_groomer', 'Professional pet grooming and spa services', '+880-1978-345678', 'House 56, Road 15, Baridhara, Dhaka', 23.8103, 90.4226, 'Dhaka', 'Daily 9AM-7PM', ARRAY['bath', 'haircut', 'nail_trim', 'ear_cleaning'], false, true, 4.7),
('Glam Pets Salon', 'pet_groomer', 'Luxury grooming services for cats and dogs', '+880-1567-890123', 'Shop 12, Jamuna Future Park, Dhaka', 23.8103, 90.4226, 'Dhaka', 'Daily 10AM-8PM', ARRAY['bath', 'haircut', 'styling', 'spa'], false, true, 4.6);

-- Pet Hotels & Training in Dhaka
INSERT INTO pet_services (name, service_type, description, phone, address, latitude, longitude, city, hours, services, is_24_7, is_verified, rating) VALUES
('Pet Paradise Hotel', 'pet_hotel', 'Comfortable boarding facility with 24/7 care', '+880-1889-456789', 'Plot 23, Purbachal, Dhaka', 23.8859, 90.5269, 'Dhaka', '24/7', ARRAY['boarding', 'daycare', 'playtime'], true, true, 4.5),
('Obedient Paws Training', 'pet_training', 'Professional dog training and behavior modification', '+880-1756-123456', 'House 89, Road 5, Gulshan-2, Dhaka', 23.7925, 90.4078, 'Dhaka', 'Mon-Sat 8AM-6PM', ARRAY['obedience', 'agility', 'behavior'], false, true, 4.8);

-- Chittagong
INSERT INTO pet_services (name, service_type, description, phone, address, latitude, longitude, city, hours, services, is_24_7, is_verified, rating) VALUES
('Chittagong Veterinary Hospital', 'animal_hospital', '24/7 animal hospital with emergency services', '+880-31-654321', 'CDA Avenue, Agrabad, Chittagong', 22.3569, 91.7832, 'Chittagong', '24/7', ARRAY['emergency', 'surgery', 'vaccination', 'lab_tests'], true, true, 4.7),
('Pet Paradise Clinic CG', 'veterinary', 'Quality veterinary care for all pets', '+880-1834-567890', 'Khulshi Hill, Chittagong', 22.3384, 91.8067, 'Chittagong', 'Mon-Sat 10AM-7PM', ARRAY['checkup', 'grooming', 'vaccination'], false, true, 4.4),
('Chittagong Pet Mart', 'pet_shop', 'Complete pet supplies and accessories', '+880-1945-678901', 'GEC Circle, Chittagong', 22.3569, 91.8325, 'Chittagong', 'Daily 10AM-8PM', ARRAY['pet_food', 'toys', 'accessories'], false, false, 4.1);

-- Sylhet
INSERT INTO pet_services (name, service_type, description, phone, address, latitude, longitude, city, hours, services, is_24_7, is_verified, rating) VALUES
('Sylhet Animal Care', 'veterinary', 'Trusted veterinary clinic in Sylhet', '+880-821-123456', 'Zindabazar, Sylhet', 24.8949, 91.8687, 'Sylhet', 'Daily 9AM-9PM', ARRAY['emergency', 'vaccination', 'surgery'], false, true, 4.5),
('Sylhet Pet Corner', 'pet_shop', 'Pet supplies and grooming products', '+880-1723-456789', 'Amberkhana, Sylhet', 24.8897, 91.8697, 'Sylhet', 'Daily 10AM-7PM', ARRAY['pet_food', 'toys', 'grooming_supplies'], false, false, 4.0);

-- Rajshahi
INSERT INTO pet_services (name, service_type, description, phone, address, latitude, longitude, city, hours, services, is_24_7, is_verified, rating) VALUES
('Rajshahi Pet Hospital', 'animal_hospital', '24/7 emergency and routine pet care', '+880-721-765432', 'Shaheb Bazar, Rajshahi', 24.3745, 88.6042, 'Rajshahi', '24/7', ARRAY['emergency', 'surgery', 'critical_care'], true, true, 4.6),
('Rajshahi Pet Shop', 'pet_shop', 'Quality pet products at affordable prices', '+880-1678-901234', 'Laxmipur, Rajshahi', 24.3636, 88.6241, 'Rajshahi', 'Daily 9AM-8PM', ARRAY['pet_food', 'toys', 'accessories'], false, false, 4.2);

-- Pet Pharmacy
INSERT INTO pet_services (name, service_type, description, phone, address, latitude, longitude, city, hours, services, is_24_7, is_verified, rating) VALUES
('Pet Meds Pharmacy', 'pet_pharmacy', 'Specialized pet medications and supplements', '+880-1567-234567', 'House 23, Road 9, Dhanmondi, Dhaka', 23.7465, 90.3772, 'Dhaka', 'Daily 9AM-9PM', ARRAY['medications', 'supplements', 'prescriptions'], false, true, 4.5);

-- ============================================
-- ADD LOCATION COLUMNS TO USERS TABLE
-- ============================================
-- Add last known location to users table for nearby user detection
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'last_known_latitude'
    ) THEN
        ALTER TABLE users ADD COLUMN last_known_latitude DECIMAL(10, 8);
        ALTER TABLE users ADD COLUMN last_known_longitude DECIMAL(11, 8);
        ALTER TABLE users ADD COLUMN last_location_update TIMESTAMPTZ;
    END IF;
END $$;

-- ============================================
-- COMPLETE FIX: Add SELECT policies for ALL tables
-- This allows viewing while keeping write operations secure
-- ============================================

-- USERS - Allow viewing all user profiles
DROP POLICY IF EXISTS "Anyone can view users" ON users;
CREATE POLICY "Anyone can view users" ON users
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
FOR UPDATE USING (auth.uid()::text = id) WITH CHECK (auth.uid()::text = id);

-- PETS - Allow viewing all pets
DROP POLICY IF EXISTS "Anyone can view pets" ON pets;
CREATE POLICY "Anyone can view pets" ON pets
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create own pets" ON pets;
CREATE POLICY "Users can create own pets" ON pets
FOR INSERT WITH CHECK (auth.uid()::text = owner_id);

DROP POLICY IF EXISTS "Users can update own pets" ON pets;
CREATE POLICY "Users can update own pets" ON pets
FOR UPDATE USING (auth.uid()::text = owner_id) WITH CHECK (auth.uid()::text = owner_id);

DROP POLICY IF EXISTS "Users can delete own pets" ON pets;
CREATE POLICY "Users can delete own pets" ON pets
FOR DELETE USING (auth.uid()::text = owner_id);

-- FOLLOWS - Allow viewing all follows
DROP POLICY IF EXISTS "Anyone can view follows" ON follows;
CREATE POLICY "Anyone can view follows" ON follows
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can follow others" ON follows;
CREATE POLICY "Users can follow others" ON follows
FOR INSERT WITH CHECK (auth.uid()::text = follower_id);

DROP POLICY IF EXISTS "Users can unfollow" ON follows;
CREATE POLICY "Users can unfollow" ON follows
FOR DELETE USING (auth.uid()::text = follower_id);

-- CHATS - Allow viewing own chats
DROP POLICY IF EXISTS "Users can view own chats" ON chats;
CREATE POLICY "Users can view own chats" ON chats
FOR SELECT USING (
    auth.uid()::text = participant_1 OR 
    auth.uid()::text = participant_2
);

DROP POLICY IF EXISTS "Users can create chats" ON chats;
CREATE POLICY "Users can create chats" ON chats
FOR INSERT WITH CHECK (
    auth.uid()::text = participant_1 OR 
    auth.uid()::text = participant_2
);

-- MESSAGES - Allow viewing messages in own chats
DROP POLICY IF EXISTS "Users can view messages in own chats" ON messages;
CREATE POLICY "Users can view messages in own chats" ON messages
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM chats 
        WHERE chats.id = messages.chat_id 
        AND (chats.participant_1 = auth.uid()::text OR chats.participant_2 = auth.uid()::text)
    )
);

DROP POLICY IF EXISTS "Users can send messages in own chats" ON messages;
CREATE POLICY "Users can send messages in own chats" ON messages
FOR INSERT WITH CHECK (
    auth.uid()::text = sender_id AND
    EXISTS (
        SELECT 1 FROM chats 
        WHERE chats.id = messages.chat_id 
        AND (chats.participant_1 = auth.uid()::text OR chats.participant_2 = auth.uid()::text)
    )
);

-- NOTIFICATIONS - Allow viewing own notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications
FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "System can create notifications" ON notifications;
CREATE POLICY "Authenticated users can create notifications" ON notifications
FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications
FOR UPDATE USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

-- CART_ITEMS - Allow viewing own cart
DROP POLICY IF EXISTS "Users can view own cart" ON cart_items;
CREATE POLICY "Users can view own cart" ON cart_items
FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can manage own cart" ON cart_items;
CREATE POLICY "Users can manage own cart" ON cart_items
FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

-- EMERGENCY_ALERTS - Allow viewing all active alerts
DROP POLICY IF EXISTS "Anyone can view emergency alerts" ON emergency_alerts;
CREATE POLICY "Anyone can view emergency alerts" ON emergency_alerts
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create alerts" ON emergency_alerts;
CREATE POLICY "Users can create alerts" ON emergency_alerts
FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own alerts" ON emergency_alerts;
CREATE POLICY "Users can update own alerts" ON emergency_alerts
FOR UPDATE USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

-- ALERT_RESPONSES - Allow viewing responses to alerts
DROP POLICY IF EXISTS "Anyone can view alert responses" ON alert_responses;
CREATE POLICY "Anyone can view alert responses" ON alert_responses
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can respond to alerts" ON alert_responses;
CREATE POLICY "Users can respond to alerts" ON alert_responses
FOR INSERT WITH CHECK (auth.uid()::text = responder_id);

DROP POLICY IF EXISTS "Users can update own responses" ON alert_responses;
CREATE POLICY "Users can update own responses" ON alert_responses
FOR UPDATE USING (auth.uid()::text = responder_id) WITH CHECK (auth.uid()::text = responder_id);

-- PET_SERVICES - Allow viewing all services
DROP POLICY IF EXISTS "Anyone can view pet services" ON pet_services;
CREATE POLICY "Anyone can view pet services" ON pet_services
FOR SELECT USING (true);

-- ============================================
-- REFRESH YOUR BROWSER - IT SHOULD WORK NOW!
-- ============================================

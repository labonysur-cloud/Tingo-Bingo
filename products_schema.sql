-- Products Marketplace Schema

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    seller_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Product Details
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category TEXT NOT NULL, -- 'food', 'toys', 'furniture', 'accessories'
    
    -- Images (Cloudinary URLs)
    images TEXT[], -- Array of image URLs
    
    -- Inventory
    stock INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Reviews Table
CREATE TABLE IF NOT EXISTS product_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(product_id, user_id) -- One review per user per product
);

-- Shopping Cart Table (optional - can use local storage too)
CREATE TABLE IF NOT EXISTS cart_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    
    added_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, product_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);

-- RLS Policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Anyone can view active products
CREATE POLICY "Anyone can view active products" ON products
    FOR SELECT USING (is_active = true);

-- Users can view their own inactive products
CREATE POLICY "Users can view own products" ON products
    FOR SELECT USING (seller_id = auth.uid()::text);

-- Users can create products
CREATE POLICY "Users can create products" ON products
    FOR INSERT WITH CHECK (seller_id = auth.uid()::text);

-- Users can update their own products
CREATE POLICY "Users can update own products" ON products
    FOR UPDATE USING (seller_id = auth.uid()::text);

-- Users can delete their own products
CREATE POLICY "Users can delete own products" ON products
    FOR DELETE USING (seller_id = auth.uid()::text);

-- Anyone can view reviews
CREATE POLICY "Anyone can view reviews" ON product_reviews
    FOR SELECT USING (true);

-- Users can create reviews
CREATE POLICY "Users can create reviews" ON product_reviews
    FOR INSERT WITH CHECK (user_id = auth.uid()::text);

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews" ON product_reviews
    FOR UPDATE USING (user_id = auth.uid()::text);

-- Users can delete their own reviews
CREATE POLICY "Users can delete own reviews" ON product_reviews
    FOR DELETE USING (user_id = auth.uid()::text);

-- Users can view their own cart
CREATE POLICY "Users can view own cart" ON cart_items
    FOR SELECT USING (user_id = auth.uid()::text);

-- Users can manage their own cart
CREATE POLICY "Users can manage own cart" ON cart_items
    FOR ALL USING (user_id = auth.uid()::text);

-- Triggers
CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_products_updated_at();

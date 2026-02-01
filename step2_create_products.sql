-- Step 2: Create fresh product tables
-- Run this AFTER step1_drop_products.sql

-- Products Table
CREATE TABLE products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    seller_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('food', 'toys', 'furniture', 'accessories')),
    
    images TEXT[] DEFAULT '{}',
    stock INTEGER DEFAULT 0 CHECK (stock >= 0),
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Reviews Table
CREATE TABLE product_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(product_id, user_id)
);

-- Shopping Cart Table
CREATE TABLE cart_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
    added_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, product_id)
);

-- Indexes
CREATE INDEX idx_products_seller ON products(seller_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active ON products(is_active) WHERE is_active = true;
CREATE INDEX idx_product_reviews_product ON product_reviews(product_id);
CREATE INDEX idx_cart_user ON cart_items(user_id);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Products
CREATE POLICY "Anyone can view active products" ON products
    FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view own products" ON products
    FOR SELECT USING (seller_id = auth.uid()::text);

CREATE POLICY "Users can create products" ON products
    FOR INSERT WITH CHECK (seller_id = auth.uid()::text);

CREATE POLICY "Users can update own products" ON products
    FOR UPDATE USING (seller_id = auth.uid()::text);

CREATE POLICY "Users can delete own products" ON products
    FOR DELETE USING (seller_id = auth.uid()::text);

-- RLS Policies for Reviews
CREATE POLICY "Anyone can view reviews" ON product_reviews
    FOR SELECT USING (true);

CREATE POLICY "Users can create reviews" ON product_reviews
    FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own reviews" ON product_reviews
    FOR UPDATE USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own reviews" ON product_reviews
    FOR DELETE USING (user_id = auth.uid()::text);

-- RLS Policies for Cart
CREATE POLICY "Users can view own cart" ON cart_items
    FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can manage own cart" ON cart_items
    FOR ALL USING (user_id = auth.uid()::text);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at 
    BEFORE UPDATE ON products
    FOR EACH ROW 
    EXECUTE FUNCTION update_products_updated_at();

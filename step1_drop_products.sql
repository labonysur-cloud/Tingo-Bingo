-- Step 1: Drop all existing product-related tables
-- Run this FIRST to clean up

DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS product_reviews CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- Migration: Add logo column to Stores table and category column to Products table
-- Run this migration in Supabase SQL Editor

-- Add logo column to Stores table
ALTER TABLE "Stores" 
ADD COLUMN IF NOT EXISTS "logo" VARCHAR(255) NULL;

-- Add category column to Products table  
ALTER TABLE "Products" 
ADD COLUMN IF NOT EXISTS "category" VARCHAR(255) NULL;

-- Add index on category for better query performance
CREATE INDEX IF NOT EXISTS "idx_products_category" ON "Products"("category");

-- Add index on storeId and category for filtered queries
CREATE INDEX IF NOT EXISTS "idx_products_store_category" ON "Products"("storeId", "category");


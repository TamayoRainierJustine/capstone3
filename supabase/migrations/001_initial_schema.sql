-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Users table
CREATE TABLE IF NOT EXISTS "Users" (
  id SERIAL PRIMARY KEY,
  "firstName" VARCHAR(255) NOT NULL,
  "lastName" VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Stores table
CREATE TABLE IF NOT EXISTS "Stores" (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER REFERENCES "Users"(id) ON DELETE SET NULL ON UPDATE CASCADE,
  "templateId" VARCHAR(255) NOT NULL,
  "storeName" VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  "domainName" VARCHAR(255) NOT NULL UNIQUE,
  region VARCHAR(255) NOT NULL,
  province VARCHAR(255) NOT NULL,
  municipality VARCHAR(255) NOT NULL,
  barangay VARCHAR(255) NOT NULL,
  "contactEmail" VARCHAR(255) NOT NULL,
  phone VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  content JSONB DEFAULT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "uniqueStoreNamePerUser" UNIQUE ("userId", "storeName")
);

-- Create Products table
CREATE TABLE IF NOT EXISTS "Products" (
  id SERIAL PRIMARY KEY,
  "storeId" INTEGER NOT NULL REFERENCES "Stores"(id) ON DELETE CASCADE ON UPDATE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  image VARCHAR(255),
  stock INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Orders table
CREATE TABLE IF NOT EXISTS "Orders" (
  id SERIAL PRIMARY KEY,
  "storeId" INTEGER NOT NULL REFERENCES "Stores"(id) ON DELETE CASCADE ON UPDATE CASCADE,
  "customerName" VARCHAR(255) NOT NULL,
  "customerEmail" VARCHAR(255) NOT NULL,
  "customerPhone" VARCHAR(255),
  "shippingAddress" TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'completed', 'cancelled')),
  "totalAmount" DECIMAL(10, 2) NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create OrderItems table
CREATE TABLE IF NOT EXISTS "OrderItems" (
  id SERIAL PRIMARY KEY,
  "orderId" INTEGER NOT NULL REFERENCES "Orders"(id) ON DELETE CASCADE ON UPDATE CASCADE,
  "productId" INTEGER NOT NULL REFERENCES "Products"(id) ON DELETE CASCADE ON UPDATE CASCADE,
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stores_user_id ON "Stores"("userId");
CREATE INDEX IF NOT EXISTS idx_stores_domain_name ON "Stores"("domainName");
CREATE INDEX IF NOT EXISTS idx_products_store_id ON "Products"("storeId");
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON "Orders"("storeId");
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON "OrderItems"("orderId");
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON "OrderItems"("productId");

-- Create function to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updatedAt
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON "Users"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON "Stores"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON "Products"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON "Orders"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON "OrderItems"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


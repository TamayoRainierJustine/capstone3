-- Fix ENUM column casting issues in PostgreSQL
-- Run this script in your Supabase SQL Editor if you get ENUM casting errors

-- Fix Stores.status column
-- Step 1: Drop the default constraint temporarily
ALTER TABLE "Stores" ALTER COLUMN "status" DROP DEFAULT;

-- Step 2: Create the ENUM type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "public"."enum_Stores_status" AS ENUM('draft', 'published');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 3: Convert existing values to ENUM (cast through text)
ALTER TABLE "Stores" 
ALTER COLUMN "status" TYPE "public"."enum_Stores_status" 
USING CASE 
    WHEN "status"::text IN ('draft', 'published') THEN "status"::text::"public"."enum_Stores_status"
    ELSE 'draft'::"public"."enum_Stores_status"
END;

-- Step 4: Set default value
ALTER TABLE "Stores" ALTER COLUMN "status" SET DEFAULT 'draft'::"public"."enum_Stores_status";

-- Fix Orders.status column (if needed)
DO $$ BEGIN
    CREATE TYPE "public"."enum_Orders_status" AS ENUM('pending', 'processing', 'shipped', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "Orders" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Orders" 
ALTER COLUMN "status" TYPE "public"."enum_Orders_status" 
USING CASE 
    WHEN "status"::text IN ('pending', 'processing', 'shipped', 'completed', 'cancelled') 
    THEN "status"::text::"public"."enum_Orders_status"
    ELSE 'pending'::"public"."enum_Orders_status"
END;
ALTER TABLE "Orders" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."enum_Orders_status";

-- Fix Orders.paymentMethod column (if needed)
DO $$ BEGIN
    CREATE TYPE "public"."enum_Orders_paymentMethod" AS ENUM('gcash', 'paypal', 'card');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Fix Orders.paymentStatus column (if needed)
DO $$ BEGIN
    CREATE TYPE "public"."enum_Orders_paymentStatus" AS ENUM('pending', 'processing', 'completed', 'failed', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

COMMENT ON TABLE "Stores" IS 'Store status ENUM columns fixed';
COMMENT ON TABLE "Orders" IS 'Order ENUM columns fixed';


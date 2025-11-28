-- Add 'suspended' status to Stores table
-- This migration adds the 'suspended' status option to the store status enum

-- Step 1: Create new ENUM type with 'suspended' option
DO $$ BEGIN
    CREATE TYPE "public"."enum_Stores_status_new" AS ENUM('draft', 'published', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Alter the column to use the new enum type
ALTER TABLE "Stores" 
ALTER COLUMN "status" TYPE "public"."enum_Stores_status_new" 
USING CASE 
    WHEN "status"::text IN ('draft', 'published', 'suspended') 
    THEN "status"::text::"public"."enum_Stores_status_new"
    ELSE 'draft'::"public"."enum_Stores_status_new"
END;

-- Step 3: Drop the old enum type (if exists)
DROP TYPE IF EXISTS "public"."enum_Stores_status";

-- Step 4: Rename the new enum type to the original name
ALTER TYPE "public"."enum_Stores_status_new" RENAME TO "enum_Stores_status";

-- Step 5: Ensure default value is set
ALTER TABLE "Stores" ALTER COLUMN "status" SET DEFAULT 'draft'::"public"."enum_Stores_status";

-- Note: Suspended stores will automatically be hidden from public view 
-- because public store queries filter by status = 'published'


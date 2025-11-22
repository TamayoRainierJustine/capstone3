-- ========================================
-- CREATE SUPER ADMIN ACCOUNT
-- ========================================
-- Run this in your Supabase SQL Editor or PostgreSQL client
-- 
-- Option 1: If user already exists, UPDATE:
-- ========================================
UPDATE "Users" 
SET role = 'super_admin',
    "isVerified" = true,
    "emailVerifiedAt" = NOW()
WHERE email = 'rainiertamayo11067@gmail.com';

-- Note: If you need to change the password, you'll need to hash it first using bcrypt
-- You can use the update-user-role API endpoint or the Node.js script for password updates

-- ========================================
-- Option 2: Create NEW super admin user
-- ========================================
-- WARNING: This requires a bcrypt-hashed password
-- It's easier to use the API endpoint or script for new users
-- But if you want to do it manually:
--
-- First, generate a bcrypt hash (use Node.js):
-- const bcrypt = require('bcryptjs');
-- bcrypt.hash('ADMIn1234', 10).then(hash => console.log(hash));
--
-- Then insert:
-- INSERT INTO "Users" (email, password, "firstName", "lastName", role, "isVerified", "emailVerifiedAt", "createdAt", "updatedAt")
-- VALUES (
--   'rainiertamayo11067@gmail.com',
--   '$2a$10$...your-bcrypt-hash-here...',
--   'Super',
--   'Admin',
--   'super_admin',
--   true,
--   NOW(),
--   NOW(),
--   NOW()
-- );

-- ========================================
-- CHECK IF SUPER ADMIN EXISTS:
-- ========================================
SELECT id, email, "firstName", "lastName", role, "isVerified" 
FROM "Users" 
WHERE email = 'rainiertamayo11067@gmail.com';


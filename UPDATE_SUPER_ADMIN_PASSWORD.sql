-- ========================================
-- UPDATE PASSWORD FOR SUPER ADMIN
-- ========================================
-- I-run mo ito sa Supabase SQL Editor
-- Ito ang password: ADMIn1234

UPDATE "Users" 
SET password = '$2b$10$3ZQu.qbhXljZM9PhD732/uh4LHexBZLHAQ78zZbdI2ldtGCQwrE8m'
WHERE email = 'rainiertamayo11067@gmail.com';

-- ========================================
-- Pagkatapos, i-check mo:
-- ========================================
SELECT id, email, role, "isVerified" 
FROM "Users" 
WHERE email = 'rainiertamayo11067@gmail.com';


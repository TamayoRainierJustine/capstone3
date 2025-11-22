-- I-check kung successful ang UPDATE
-- I-run mo ito after ng UPDATE command

SELECT id, email, "firstName", "lastName", role, "isVerified", "emailVerifiedAt"
FROM "Users" 
WHERE email = 'rainiertamayo11067@gmail.com';

-- Dapat makita mo ang:
-- role = 'super_admin'
-- isVerified = true


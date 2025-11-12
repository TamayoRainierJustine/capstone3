-- This migration will be run after data export from MySQL
-- It inserts the admin user credentials
-- Note: Replace the password hash with your actual admin password hash from MySQL

-- Example admin user (password should be hashed with bcrypt)
-- Password: admin123 (example - replace with your actual admin password hash)
-- To generate hash: Use bcryptjs in Node.js or online bcrypt generator
-- INSERT INTO "Users" ("firstName", "lastName", email, password, role, "createdAt", "updatedAt")
-- VALUES ('Admin', 'User', 'admin@structura.com', '$2a$10$YourHashedPasswordHere', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- This will be populated by the migration script


-- Migration: Add user verification columns and token table

-- Add verification fields to Users table
ALTER TABLE "Users"
ADD COLUMN IF NOT EXISTS "isVerified" BOOLEAN DEFAULT false;

ALTER TABLE "Users"
ADD COLUMN IF NOT EXISTS "emailVerifiedAt" TIMESTAMP WITH TIME ZONE NULL;

-- Create EmailVerificationTokens table for signup verification codes
CREATE TABLE IF NOT EXISTS "EmailVerificationTokens" (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(20) NOT NULL,
  "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_email_verification_email" ON "EmailVerificationTokens"(email);
CREATE INDEX IF NOT EXISTS "idx_email_verification_expires" ON "EmailVerificationTokens"("expiresAt");


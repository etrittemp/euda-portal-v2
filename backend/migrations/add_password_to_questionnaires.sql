-- Migration: Add password field to questionnaires table
-- This allows questionnaires to be password protected

-- Add password column to questionnaires table
ALTER TABLE questionnaires
ADD COLUMN IF NOT EXISTS password TEXT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN questionnaires.password IS 'Optional password to protect questionnaire access. NULL means no password protection.';

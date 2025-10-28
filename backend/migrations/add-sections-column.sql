-- Migration: Add sections JSONB column to questionnaires table
-- Date: 2025-10-27
-- Description: Adds sections column to store questionnaire structure as JSONB

-- Add sections column as JSONB type with default empty array
ALTER TABLE questionnaires
ADD COLUMN IF NOT EXISTS sections JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN questionnaires.sections IS 'Stores questionnaire sections and questions as JSONB structure';

-- Optional: Add GIN index for faster JSONB queries (uncomment if needed for performance)
-- CREATE INDEX IF NOT EXISTS idx_questionnaires_sections ON questionnaires USING GIN (sections);

-- Verify the column was added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'questionnaires'
  AND column_name = 'sections';

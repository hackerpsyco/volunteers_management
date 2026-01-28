-- Update facilitators table schema
-- Remove organization and expertise columns, add location column

ALTER TABLE facilitators
DROP COLUMN IF EXISTS organization,
DROP COLUMN IF EXISTS expertise,
ADD COLUMN IF NOT EXISTS location TEXT;

-- Add comment
COMMENT ON COLUMN facilitators.location IS 'Facilitator location or city';

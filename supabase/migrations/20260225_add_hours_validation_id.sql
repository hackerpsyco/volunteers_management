-- Add validation_id column to session_hours_tracker table
ALTER TABLE session_hours_tracker
ADD COLUMN IF NOT EXISTS validation_id TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN session_hours_tracker.validation_id IS 'Validation ID for hours tracker verification by supervisor';

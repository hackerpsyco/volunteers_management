-- Add feedback status columns to sessions table
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS facilitator_feedback_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS coordinator_feedback_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS supervisor_feedback_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS admin_feedback_status TEXT DEFAULT 'pending';

-- Update existing records to 'done' if they already have feedback recorded
UPDATE sessions 
SET facilitator_feedback_status = 'done' 
WHERE recorded_at IS NOT NULL;

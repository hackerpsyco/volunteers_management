-- Add subject_id column to sessions table
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL;

-- Get the AI subject ID
WITH ai_subject AS (
  SELECT id FROM subjects WHERE name = 'AI' LIMIT 1
)
-- Assign all sessions to AI subject
UPDATE sessions
SET subject_id = (SELECT id FROM ai_subject)
WHERE subject_id IS NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_sessions_subject_id ON sessions(subject_id);

-- Verify the update
SELECT 
  COUNT(*) as total_sessions,
  COUNT(CASE WHEN subject_id IS NOT NULL THEN 1 END) as with_subject,
  COUNT(CASE WHEN subject_id IS NULL THEN 1 END) as without_subject
FROM sessions;

-- Add session_type column to sessions table to store the session type (guest_teacher, guest_speaker, local_teacher)
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS session_type VARCHAR(50);

-- Set default value for existing sessions (assume guest_teacher for backward compatibility)
UPDATE sessions
SET session_type = 'guest_teacher'
WHERE session_type IS NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_sessions_session_type ON sessions(session_type);

-- Verify the update
SELECT 
  COUNT(*) as total_sessions,
  COUNT(CASE WHEN session_type IS NOT NULL THEN 1 END) as with_session_type,
  COUNT(CASE WHEN session_type IS NULL THEN 1 END) as without_session_type
FROM sessions;

-- Populate session_type for existing sessions that have NULL values
-- Default all existing sessions to 'guest_teacher' for backward compatibility
UPDATE sessions
SET session_type = 'guest_teacher'
WHERE session_type IS NULL;

-- Verify the update
SELECT 
  session_type,
  COUNT(*) as count
FROM sessions
GROUP BY session_type
ORDER BY count DESC;

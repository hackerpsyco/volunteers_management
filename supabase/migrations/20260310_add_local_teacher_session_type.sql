-- Add local_teacher as a valid session type
-- This migration documents the new session type option
-- The session_type column should accept: 'guest_teacher', 'guest_speaker', 'local_teacher'

-- If you have a check constraint on session_type, update it:
-- ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_session_type_check;
-- ALTER TABLE sessions ADD CONSTRAINT sessions_session_type_check 
--   CHECK (session_type IN ('guest_teacher', 'guest_speaker', 'local_teacher'));

-- Verify current session types
SELECT DISTINCT session_type FROM sessions ORDER BY session_type;

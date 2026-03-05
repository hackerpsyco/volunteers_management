-- Check if session_type column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sessions' AND column_name = 'session_type';

-- Check current session data
SELECT id, session_type, COUNT(*) as count
FROM sessions
GROUP BY session_type
ORDER BY count DESC;

-- Check all columns in sessions table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'sessions'
ORDER BY ordinal_position;

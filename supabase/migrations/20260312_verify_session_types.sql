-- Check session types distribution
SELECT 
  session_type,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM sessions), 2) as percentage
FROM sessions
GROUP BY session_type
ORDER BY count DESC;

-- Check the most recent sessions to see if new ones are being saved correctly
SELECT 
  id,
  title,
  session_type,
  session_type_option,
  created_at,
  class_batch
FROM sessions
ORDER BY created_at DESC
LIMIT 10;

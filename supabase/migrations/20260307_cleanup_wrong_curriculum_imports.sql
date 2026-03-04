-- Delete curriculum items imported in the last 1 hour
-- This removes only the recently imported wrong data
DELETE FROM curriculum 
WHERE created_at > NOW() - INTERVAL '1 hour';

-- Verify deletion
SELECT COUNT(*) as remaining_curriculum_count FROM curriculum;

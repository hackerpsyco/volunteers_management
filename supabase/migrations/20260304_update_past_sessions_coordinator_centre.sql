-- Update all past sessions with:
-- - coordinator = 'Alisha'
-- - facilitator = 'Alisha'
-- - centre = 'WES Academy'

-- Step 1: Ensure 'Alisha' exists in coordinators table
INSERT INTO coordinators (name, email, status)
SELECT 'Alisha', 'alisha@wes.org', 'active'
WHERE NOT EXISTS (SELECT 1 FROM coordinators WHERE name = 'Alisha');

-- Step 2: Ensure 'Alisha' exists in facilitators table
INSERT INTO facilitators (name, email, status)
SELECT 'Alisha', 'alisha@wes.org', 'active'
WHERE NOT EXISTS (SELECT 1 FROM facilitators WHERE name = 'Alisha');

-- Step 3: Ensure 'WES Academy' exists in centres table
INSERT INTO centres (name, location, status)
SELECT 'WES Academy', 'WES Academy', 'active'
WHERE NOT EXISTS (SELECT 1 FROM centres WHERE name = 'WES Academy');

-- Step 4: Update all past sessions (completed status and date before today)
UPDATE sessions
SET 
  coordinator_id = (SELECT id FROM coordinators WHERE name = 'Alisha' LIMIT 1),
  facilitator_name = 'Alisha',
  centre_id = (SELECT id FROM centres WHERE name = 'WES Academy' LIMIT 1)
WHERE 
  status = 'completed' 
  AND session_date < CURRENT_DATE;

-- Step 5: Alternative - Update ALL past sessions regardless of status
-- Uncomment below if you want to update all sessions with past dates
-- UPDATE sessions
-- SET 
--   coordinator_id = (SELECT id FROM coordinators WHERE name = 'Alisha' LIMIT 1),
--   facilitator_name = 'Alisha',
--   centre_id = (SELECT id FROM centres WHERE name = 'WES Academy' LIMIT 1)
-- WHERE 
--   session_date < CURRENT_DATE;

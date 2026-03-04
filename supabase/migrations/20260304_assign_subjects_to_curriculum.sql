-- First, clear all NULL subject_id values
UPDATE curriculum SET subject_id = NULL;

-- Then assign all curriculum items to AI subject
UPDATE curriculum
SET subject_id = (SELECT id FROM subjects WHERE name = 'AI' LIMIT 1);

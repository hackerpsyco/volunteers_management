-- Update curriculum items to assign subjects based on content_category
-- This migration assigns subjects to curriculum items that don't have a subject yet

-- First, let's get the subject IDs
WITH subject_ids AS (
  SELECT id, name FROM subjects
)

-- Update curriculum items with AI subject (default for all)
UPDATE curriculum
SET subject_id = (SELECT id FROM subject_ids WHERE name = 'AI')
WHERE subject_id IS NULL;

-- Optionally, you can assign specific subjects based on content_category
-- For example, if you want to assign "Computer" subject to certain categories:
-- UPDATE curriculum
-- SET subject_id = (SELECT id FROM subjects WHERE name = 'Computer')
-- WHERE content_category IN ('Programming', 'Web Development', 'Database')
-- AND subject_id IS NULL;

-- Verify the update
SELECT COUNT(*) as total_curriculum, 
       COUNT(subject_id) as with_subject,
       COUNT(CASE WHEN subject_id IS NULL THEN 1 END) as without_subject
FROM curriculum;

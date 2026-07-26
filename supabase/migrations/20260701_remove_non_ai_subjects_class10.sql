-- Query to check current subjects for Class 10
SELECT 
  c.id,
  c.name as class_name,
  s.id as subject_id,
  s.name as subject_name,
  COUNT(cu.id) as curriculum_count
FROM classes c
LEFT JOIN curriculum cu ON cu.class_id = c.id
LEFT JOIN subjects s ON cu.subject_id = s.id
WHERE c.name LIKE '%10%'
GROUP BY c.id, c.name, s.id, s.name
ORDER BY c.name, s.name;

-- Remove all non-AI subjects from Class 10
-- First, identify and delete curriculum items in Class 10 that are NOT AI subject
DELETE FROM curriculum
WHERE class_id IN (
  SELECT id FROM classes WHERE name LIKE '%10%'
)
AND subject_id NOT IN (
  SELECT id FROM subjects WHERE name = 'AI'
);

-- Ensure all remaining Class 10 curriculum items are assigned to AI subject
UPDATE curriculum
SET subject_id = (SELECT id FROM subjects WHERE name = 'AI')
WHERE class_id IN (
  SELECT id FROM classes WHERE name LIKE '%10%'
)
AND subject_id IS NULL;

-- Verify the changes
SELECT 
  c.name as class_name,
  s.name as subject_name,
  COUNT(cu.id) as curriculum_count
FROM classes c
LEFT JOIN curriculum cu ON cu.class_id = c.id
LEFT JOIN subjects s ON cu.subject_id = s.id
WHERE c.name LIKE '%10%'
GROUP BY c.name, s.name
ORDER BY c.name, s.name;

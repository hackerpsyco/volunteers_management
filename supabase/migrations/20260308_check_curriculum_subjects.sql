-- Check curriculum items with subjects
SELECT 
  COUNT(*) as total_curriculum,
  COUNT(CASE WHEN subject_id IS NOT NULL THEN 1 END) as with_subject,
  COUNT(CASE WHEN subject_id IS NULL THEN 1 END) as without_subject,
  COUNT(DISTINCT subject_id) as unique_subjects
FROM curriculum;

-- Show breakdown by subject
SELECT 
  s.name as subject_name,
  COUNT(c.id) as curriculum_count
FROM curriculum c
LEFT JOIN subjects s ON c.subject_id = s.id
GROUP BY s.id, s.name
ORDER BY curriculum_count DESC;

-- Show curriculum items without subjects
SELECT 
  id,
  content_category,
  module_name,
  topics_covered,
  class_id,
  subject_id
FROM curriculum
WHERE subject_id IS NULL
LIMIT 10;

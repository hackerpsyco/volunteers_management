-- Verify current state of curriculum data

-- Query 1: Check if class_id is still NULL
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN class_id IS NULL THEN 1 END) as null_class_id,
  COUNT(CASE WHEN class_id IS NOT NULL THEN 1 END) as with_class_id
FROM public.curriculum;

-- Query 2: Show items per class
SELECT 
  class_id,
  COUNT(*) as count
FROM public.curriculum
GROUP BY class_id
ORDER BY class_id;

-- Query 3: Try to fetch modules for a specific class (test the actual query)
-- Replace 'ACTUAL_CLASS_ID' with a real class ID from Query 2
SELECT DISTINCT 
  module_name,
  COUNT(*) as count
FROM public.curriculum
WHERE class_id IS NOT NULL
  AND module_name IS NOT NULL
GROUP BY module_name
ORDER BY module_name
LIMIT 20;

-- Query 4: Check if migration was applied
SELECT 
  COUNT(DISTINCT class_id) as distinct_classes,
  COUNT(*) as total_items
FROM public.curriculum
WHERE class_id IS NOT NULL;

-- Query 5: Show sample data
SELECT 
  content_category,
  module_name,
  topics_covered,
  class_id
FROM public.curriculum
WHERE class_id IS NOT NULL
LIMIT 10;

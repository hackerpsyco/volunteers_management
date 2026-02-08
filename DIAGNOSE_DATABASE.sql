-- Diagnostic queries to check the actual database state
-- Run these one by one in Supabase SQL Editor

-- Query 1: Check how many curriculum items have NULL class_id
SELECT COUNT(*) as items_with_null_class_id 
FROM public.curriculum 
WHERE class_id IS NULL;

-- Query 2: Check how many curriculum items have non-NULL class_id
SELECT COUNT(*) as items_with_class_id 
FROM public.curriculum 
WHERE class_id IS NOT NULL;

-- Query 3: Total curriculum items
SELECT COUNT(*) as total_curriculum_items 
FROM public.curriculum;

-- Query 4: Show curriculum items per class
SELECT 
  class_id,
  COUNT(*) as count
FROM public.curriculum 
GROUP BY class_id 
ORDER BY class_id;

-- Query 5: Show all classes with their IDs
SELECT id, name 
FROM public.classes 
ORDER BY name;

-- Query 6: Show sample curriculum items (first 5)
SELECT 
  id,
  content_category,
  module_no,
  module_name,
  topics_covered,
  class_id
FROM public.curriculum 
LIMIT 5;

-- Query 7: Check if there are any curriculum items at all
SELECT 
  content_category,
  COUNT(*) as count,
  COUNT(DISTINCT class_id) as distinct_classes
FROM public.curriculum
GROUP BY content_category
ORDER BY content_category;

-- Query 8: Try to fetch modules for the first class (if any exist)
-- This shows what the code is trying to do
SELECT DISTINCT 
  c.class_id,
  c.module_name,
  COUNT(*) as count
FROM public.curriculum c
WHERE c.class_id IS NOT NULL
  AND c.module_name IS NOT NULL
GROUP BY c.class_id, c.module_name
LIMIT 20;

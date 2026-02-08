-- Check what curriculum data actually exists

-- Query 1: Show sample curriculum items to see what's in the database
SELECT 
  id,
  content_category,
  module_no,
  module_name,
  topics_covered,
  class_id
FROM public.curriculum 
LIMIT 10;

-- Query 2: Check which columns have data
SELECT 
  COUNT(*) as total,
  COUNT(content_category) as has_category,
  COUNT(module_no) as has_module_no,
  COUNT(module_name) as has_module_name,
  COUNT(topics_covered) as has_topics,
  COUNT(class_id) as has_class_id
FROM public.curriculum;

-- Query 3: Show items grouped by category
SELECT 
  content_category,
  COUNT(*) as count,
  COUNT(module_name) as with_module_name,
  COUNT(topics_covered) as with_topics
FROM public.curriculum
GROUP BY content_category
ORDER BY content_category;

-- Query 4: Show items with their module_name (should show NULL)
SELECT DISTINCT
  content_category,
  module_name,
  COUNT(*) as count
FROM public.curriculum
GROUP BY content_category, module_name
ORDER BY content_category, module_name;

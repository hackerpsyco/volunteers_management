-- Quick check of curriculum state

-- 1. Total items
SELECT COUNT(*) as total FROM public.curriculum;

-- 2. Items with class_id
SELECT COUNT(*) as with_class_id FROM public.curriculum WHERE class_id IS NOT NULL;

-- 3. Items without class_id  
SELECT COUNT(*) as without_class_id FROM public.curriculum WHERE class_id IS NULL;

-- 4. Sample of data
SELECT 
  id,
  content_category,
  module_no,
  module_name,
  topics_covered,
  class_id
FROM public.curriculum
LIMIT 20;

-- 5. Unique categories
SELECT DISTINCT content_category FROM public.curriculum ORDER BY content_category;

-- 6. Modules in first category
SELECT DISTINCT 
  module_no,
  module_name
FROM public.curriculum
WHERE content_category IS NOT NULL
ORDER BY module_no
LIMIT 30;

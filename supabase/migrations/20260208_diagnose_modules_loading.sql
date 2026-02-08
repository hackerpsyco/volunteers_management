-- Diagnose why only 1 module is loading

-- Check 1: How many curriculum items exist?
SELECT COUNT(*) as total_items FROM public.curriculum;

-- Check 2: How many unique categories?
SELECT COUNT(DISTINCT content_category) as unique_categories FROM public.curriculum;

-- Check 3: How many unique modules per category?
SELECT 
  content_category,
  COUNT(DISTINCT module_no) as unique_modules,
  COUNT(DISTINCT module_name) as unique_module_names,
  COUNT(*) as total_items
FROM public.curriculum
GROUP BY content_category
ORDER BY content_category;

-- Check 4: Sample data from one category
SELECT 
  content_category,
  module_no,
  module_name,
  topics_covered,
  class_id
FROM public.curriculum
WHERE content_category IS NOT NULL
LIMIT 50;

-- Check 5: Check if class_id is NULL for most items
SELECT 
  COUNT(*) as total,
  COUNT(class_id) as with_class_id,
  COUNT(CASE WHEN class_id IS NULL THEN 1 END) as null_class_id
FROM public.curriculum;

-- Check 6: Show modules for a specific category
SELECT DISTINCT
  module_no,
  module_name
FROM public.curriculum
WHERE content_category = 'GT Suggested - Topics'
ORDER BY module_no;

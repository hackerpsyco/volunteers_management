-- Test query to check if modules exist for a specific class and category

-- First, get a class ID
SELECT id, name FROM public.classes LIMIT 1;

-- Then use that class ID in this query (replace CLASS_ID_HERE):
-- SELECT DISTINCT module_name 
-- FROM public.curriculum
-- WHERE content_category = 'Students Requested - Topics'
-- AND class_id = 'CLASS_ID_HERE'
-- AND module_name IS NOT NULL;

-- Or run this to see all modules for all classes in a category:
SELECT DISTINCT 
  class_id,
  module_name,
  COUNT(*) as count
FROM public.curriculum
WHERE content_category = 'Students Requested - Topics'
  AND module_name IS NOT NULL
GROUP BY class_id, module_name
ORDER BY class_id, module_name;

-- Check if module_name column has any NULL values:
SELECT COUNT(*) as null_module_names
FROM public.curriculum
WHERE module_name IS NULL;

-- Check sample curriculum items:
SELECT 
  id,
  content_category,
  module_no,
  module_name,
  topics_covered,
  class_id
FROM public.curriculum
WHERE content_category = 'Students Requested - Topics'
LIMIT 10;

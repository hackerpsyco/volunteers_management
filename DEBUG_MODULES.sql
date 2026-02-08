-- Debug query to check what modules exist for a specific class

-- First, get the class ID that was being used (from the console: 18b2577f-42e1-49cc-9491-7afbc219e5a8)
-- Then run this query:

SELECT 
  id,
  content_category,
  module_no,
  module_name,
  topics_covered,
  class_id
FROM public.curriculum
WHERE class_id = '18b2577f-42e1-49cc-9491-7afbc219e5a8'
  AND content_category = 'Students Requested - Topics'
LIMIT 20;

-- Check if module_name is empty or NULL:
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN module_name IS NULL THEN 1 END) as null_count,
  COUNT(CASE WHEN module_name = '' THEN 1 END) as empty_count,
  COUNT(CASE WHEN module_name IS NOT NULL AND module_name != '' THEN 1 END) as valid_count
FROM public.curriculum
WHERE class_id = '18b2577f-42e1-49cc-9491-7afbc219e5a8'
  AND content_category = 'Students Requested - Topics';

-- Get distinct module names for this class and category:
SELECT DISTINCT module_name
FROM public.curriculum
WHERE class_id = '18b2577f-42e1-49cc-9491-7afbc219e5a8'
  AND content_category = 'Students Requested - Topics'
  AND module_name IS NOT NULL
  AND module_name != ''
ORDER BY module_name;

-- Check what the actual data looks like

-- Query 1: Show sample curriculum items with all columns
SELECT 
  id,
  content_category,
  module_no,
  module_name,
  topics_covered,
  class_id
FROM public.curriculum 
WHERE content_category = 'Python Programming - Topics'
LIMIT 20;

-- Query 2: Show unique combinations
SELECT DISTINCT
  module_no,
  module_name,
  topics_covered
FROM public.curriculum
WHERE content_category = 'Python Programming - Topics'
ORDER BY module_no, topics_covered
LIMIT 30;

-- Query 3: Check if module_name has the descriptive content
SELECT DISTINCT
  module_no,
  module_name
FROM public.curriculum
WHERE content_category = 'Python Programming - Topics'
ORDER BY module_no
LIMIT 20;

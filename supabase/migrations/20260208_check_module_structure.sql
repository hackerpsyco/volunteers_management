-- Check the actual module structure in the data

-- Query 1: Show sample curriculum items with all details
SELECT 
  id,
  content_category,
  module_no,
  module_name,
  topics_covered,
  class_id
FROM public.curriculum 
LIMIT 20;

-- Query 2: Show unique module_name values
SELECT DISTINCT 
  content_category,
  module_no,
  module_name
FROM public.curriculum
ORDER BY content_category, module_no
LIMIT 50;

-- Query 3: Check if topics_covered contains the actual topic names
SELECT DISTINCT 
  content_category,
  module_name,
  topics_covered
FROM public.curriculum
WHERE content_category = 'GT Suggested - Topics'
ORDER BY module_name, topics_covered
LIMIT 20;

-- Query 4: Check the structure - is module_name the actual name or just a number?
SELECT 
  content_category,
  COUNT(DISTINCT module_name) as unique_modules,
  COUNT(DISTINCT topics_covered) as unique_topics,
  MIN(module_name) as first_module,
  MAX(module_name) as last_module
FROM public.curriculum
GROUP BY content_category;

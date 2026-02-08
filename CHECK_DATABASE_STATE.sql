-- Run these queries in Supabase SQL Editor to check the database state

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

-- Query 5: Show sample curriculum items with NULL class_id
SELECT 
  id,
  content_category,
  module_no,
  module_name,
  topics_covered,
  class_id
FROM public.curriculum 
WHERE class_id IS NULL 
LIMIT 10;

-- Query 6: Show sample curriculum items with class_id
SELECT 
  id,
  content_category,
  module_no,
  module_name,
  topics_covered,
  class_id
FROM public.curriculum 
WHERE class_id IS NOT NULL 
LIMIT 10;

-- Query 7: Show all classes
SELECT id, name 
FROM public.classes 
ORDER BY name;

-- Query 8: Check if class_id column exists and its type
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'curriculum' 
  AND column_name = 'class_id';

-- Query 9: Check for duplicates per class
SELECT 
  class_id,
  content_category,
  module_no,
  module_name,
  topics_covered,
  COUNT(*) as duplicate_count
FROM public.curriculum
GROUP BY class_id, content_category, module_no, module_name, topics_covered
HAVING COUNT(*) > 1
ORDER BY class_id;

-- Query 10: Show the exact issue - try to fetch modules for a specific class
-- Replace 'class-7-uuid' with an actual class ID from Query 7
SELECT DISTINCT module_name
FROM public.curriculum
WHERE content_category = 'Students Requested - Topics'
  AND class_id = 'REPLACE_WITH_ACTUAL_CLASS_ID'
  AND module_name IS NOT NULL;

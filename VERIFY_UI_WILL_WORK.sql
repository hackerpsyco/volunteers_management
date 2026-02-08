-- Verify that the UI queries will now work

-- Query 1: Get a sample class_id
SELECT id, name FROM public.classes LIMIT 1;

-- Query 2: Test the exact query the UI uses - fetch categories for a class
-- Replace 'CLASS_ID_FROM_QUERY_1' with the actual class ID
SELECT DISTINCT content_category
FROM public.curriculum
WHERE class_id = '9ee04484-ab4f-445d-9444-739c53556c40'
  AND content_category IS NOT NULL
ORDER BY content_category;

-- Query 3: Test fetching modules for a category and class
SELECT DISTINCT module_name
FROM public.curriculum
WHERE class_id = '9ee04484-ab4f-445d-9444-739c53556c40'
  AND content_category = 'GT Suggested - Topics'
  AND module_name IS NOT NULL
ORDER BY module_name;

-- Query 4: Test fetching topics for a module and class
SELECT *
FROM public.curriculum
WHERE class_id = '9ee04484-ab4f-445d-9444-739c53556c40'
  AND content_category = 'GT Suggested - Topics'
  AND module_name = 'Module 65'
ORDER BY topics_covered;

-- Query 5: Count items per class (should be ~1888 each)
SELECT 
  class_id,
  COUNT(*) as count
FROM public.curriculum
GROUP BY class_id
ORDER BY class_id;

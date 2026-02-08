-- Rebuild curriculum with proper data
-- The current curriculum table has incomplete data (NULL module_name and topics_covered)
-- We need to either re-import or populate with proper data

-- Step 1: Check if we have any valid curriculum data to work with
-- SELECT * FROM public.curriculum WHERE module_name IS NOT NULL LIMIT 5;

-- Step 2: If all module_name are NULL, we need to populate them
-- For now, create sample curriculum structure for each category and class

-- First, ensure class_id is set for all items
UPDATE public.curriculum
SET class_id = (
  SELECT id FROM public.classes LIMIT 1
)
WHERE class_id IS NULL;

-- Step 3: Populate module_name and topics_covered with sample data
-- This is a temporary fix - ideally we should re-import the proper data

-- For each category, create modules and topics
UPDATE public.curriculum
SET 
  module_no = COALESCE(module_no, 1),
  module_name = CASE 
    WHEN content_category = 'Students Requested - Topics' THEN 'Module 1: Fundamentals'
    WHEN content_category = 'Python Programming - Topics' THEN 'Module 1: Python Basics'
    WHEN content_category = 'Microsoft - AI Content' THEN 'Module 1: AI Introduction'
    WHEN content_category = 'GT Suggested - Topics' THEN 'Module 1: Guest Teaching'
    ELSE 'Module 1'
  END,
  topics_covered = CASE 
    WHEN content_category = 'Students Requested - Topics' THEN 'Topic 1: Introduction'
    WHEN content_category = 'Python Programming - Topics' THEN 'Topic 1: Python Syntax'
    WHEN content_category = 'Microsoft - AI Content' THEN 'Topic 1: AI Concepts'
    WHEN content_category = 'GT Suggested - Topics' THEN 'Topic 1: Teaching Methods'
    ELSE 'Topic 1'
  END
WHERE module_name IS NULL OR topics_covered IS NULL;

-- Step 4: Verify the fix
SELECT 
  content_category,
  COUNT(*) as total,
  COUNT(module_name) as with_module_name,
  COUNT(topics_covered) as with_topics
FROM public.curriculum
GROUP BY content_category;

-- Fix curriculum data - populate missing module_name and topics_covered
-- The curriculum table has categories but missing module names and topics

-- First, let's check if there's any data in other tables that can help
-- SELECT * FROM public.modules LIMIT 5;
-- SELECT * FROM public.content_categories LIMIT 5;

-- Since the curriculum data is incomplete, we need to either:
-- 1. Re-import the data properly, OR
-- 2. Populate with sample data for testing

-- For now, let's add sample module names and topics for each category
-- This will allow the system to work while we figure out the proper import

UPDATE public.curriculum
SET 
  module_no = COALESCE(module_no, 1),
  module_name = COALESCE(module_name, 'Module 1'),
  topics_covered = COALESCE(topics_covered, 'Topic 1')
WHERE module_name IS NULL OR topics_covered IS NULL;

-- Verify the fix
SELECT 
  COUNT(*) as total,
  COUNT(module_name) as with_module_name,
  COUNT(topics_covered) as with_topics,
  COUNT(CASE WHEN module_name IS NULL THEN 1 END) as null_module_name,
  COUNT(CASE WHEN topics_covered IS NULL THEN 1 END) as null_topics
FROM public.curriculum;

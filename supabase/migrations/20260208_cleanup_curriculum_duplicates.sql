-- Clean up duplicate curriculum entries
-- Keep only ONE instance of each unique curriculum per class
-- Delete all duplicates

DELETE FROM public.curriculum
WHERE id NOT IN (
  SELECT DISTINCT ON (class_id, content_category, module_no, module_name, topics_covered) id
  FROM public.curriculum
  ORDER BY class_id, content_category, module_no, module_name, topics_covered, created_at ASC
);

-- Verify the cleanup worked
-- SELECT COUNT(*) as total_curriculum FROM public.curriculum;
-- SELECT class_id, content_category, COUNT(*) as count 
-- FROM public.curriculum 
-- GROUP BY class_id, content_category 
-- ORDER BY class_id, content_category;

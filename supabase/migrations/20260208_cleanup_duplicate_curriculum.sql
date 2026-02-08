-- Clean up duplicate curriculum entries
-- Keep only one instance of each unique curriculum item (by content_category, module_no, module_name, topics_covered)
-- Remove duplicates that were created for each class

-- First, identify and keep the oldest record for each unique curriculum combination
-- Delete all duplicates, keeping only the first occurrence
DELETE FROM public.curriculum c1
WHERE c1.id NOT IN (
  SELECT MIN(c2.id)
  FROM public.curriculum c2
  GROUP BY c2.content_category, c2.module_no, c2.module_name, c2.topics_covered
);

-- Remove the class_id column if it exists (curriculum should not be class-specific)
-- The class-curriculum relationship should be managed through sessions
ALTER TABLE public.curriculum DROP COLUMN IF EXISTS class_id;

-- Drop the index if it exists
DROP INDEX IF EXISTS idx_curriculum_class_id;

-- Verify the cleanup
-- SELECT COUNT(*) as total_curriculum FROM public.curriculum;
-- SELECT content_category, module_no, module_name, topics_covered, COUNT(*) as count 
-- FROM public.curriculum 
-- GROUP BY content_category, module_no, module_name, topics_covered 
-- HAVING COUNT(*) > 1;

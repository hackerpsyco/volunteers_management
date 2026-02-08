-- Final fix: Add class_id column and clean up duplicate curriculum data
-- Each class has its own curriculum content, but we need to remove duplicates

-- Step 1: Add class_id column if it doesn't exist
ALTER TABLE public.curriculum ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE CASCADE;

-- Step 2: Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_curriculum_class_id ON public.curriculum(class_id);

-- Step 3: Remove all duplicate curriculum entries
-- Keep only one instance of each unique curriculum item per class
-- Use DISTINCT ON to keep the first occurrence of each unique combination
DELETE FROM public.curriculum
WHERE id NOT IN (
  SELECT DISTINCT ON (class_id, content_category, module_no, module_name, topics_covered) id
  FROM public.curriculum
  ORDER BY class_id, content_category, module_no, module_name, topics_covered, created_at ASC
);

-- Step 4: Verify the data
-- SELECT COUNT(*) as total_curriculum FROM public.curriculum;
-- SELECT class_id, content_category, module_no, module_name, topics_covered, COUNT(*) as count 
-- FROM public.curriculum 
-- GROUP BY class_id, content_category, module_no, module_name, topics_covered 
-- HAVING COUNT(*) > 1;

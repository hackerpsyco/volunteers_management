-- Assign curriculum to all classes
-- This creates a copy of each curriculum item for each class

-- First, get all unique curriculum items (where class_id is NULL)
-- Then create copies for each class

INSERT INTO public.curriculum (content_category, module_no, module_name, topics_covered, videos, quiz_content_ppt, class_id, created_at, updated_at)
SELECT 
  c.content_category,
  c.module_no,
  c.module_name,
  c.topics_covered,
  c.videos,
  c.quiz_content_ppt,
  cl.id as class_id,
  NOW(),
  NOW()
FROM public.curriculum c
CROSS JOIN public.classes cl
WHERE c.class_id IS NULL
ON CONFLICT DO NOTHING;

-- Optional: Delete the original curriculum items with NULL class_id
-- Uncomment if you want to keep only class-specific curriculum
-- DELETE FROM public.curriculum WHERE class_id IS NULL;

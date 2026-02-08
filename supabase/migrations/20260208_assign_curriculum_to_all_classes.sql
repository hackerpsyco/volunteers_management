-- Assign all existing curriculum to all classes
-- This creates a many-to-many relationship where each curriculum item is available to all classes

-- First, get all curriculum items and all classes, then create the relationship
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

-- Optional: If you want to keep only class-specific curriculum and remove the NULL ones:
-- DELETE FROM public.curriculum WHERE class_id IS NULL;

-- Assign class_id to all curriculum items for ALL classes
-- The curriculum has module_name and topics_covered, but class_id is NULL
-- This is why modules and topics don't load when filtering by class_id

-- Step 1: Create copies of curriculum for each class
-- For each curriculum item with NULL class_id, create a copy for each class
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
  AND c.content_category IS NOT NULL
  AND c.module_name IS NOT NULL
ON CONFLICT DO NOTHING;

-- Step 2: Delete the original NULL class_id items
DELETE FROM public.curriculum 
WHERE class_id IS NULL;

-- Step 3: Remove duplicates - keep only one per class
DELETE FROM public.curriculum
WHERE id NOT IN (
  SELECT DISTINCT ON (class_id, content_category, module_no, module_name, topics_covered) id
  FROM public.curriculum
  ORDER BY class_id, content_category, module_no, module_name, topics_covered, created_at ASC
);

-- Step 4: Verify the fix
SELECT 
  COUNT(*) as total,
  COUNT(class_id) as with_class_id,
  COUNT(DISTINCT class_id) as distinct_classes
FROM public.curriculum;

-- Step 5: Show items per class
SELECT 
  class_id,
  COUNT(*) as count
FROM public.curriculum
GROUP BY class_id
ORDER BY class_id;

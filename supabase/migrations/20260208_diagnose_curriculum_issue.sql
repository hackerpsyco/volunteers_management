-- Diagnostic queries to check curriculum data state
-- Run these to understand what's in the database

-- Check 1: How many curriculum items have NULL class_id?
-- SELECT COUNT(*) as null_class_id_count FROM public.curriculum WHERE class_id IS NULL;

-- Check 2: How many curriculum items have non-NULL class_id?
-- SELECT COUNT(*) as with_class_id_count FROM public.curriculum WHERE class_id IS NOT NULL;

-- Check 3: Total curriculum items
-- SELECT COUNT(*) as total_curriculum FROM public.curriculum;

-- Check 4: Curriculum items per class
-- SELECT class_id, COUNT(*) as count FROM public.curriculum GROUP BY class_id ORDER BY class_id;

-- Check 5: Sample curriculum items with NULL class_id
-- SELECT id, content_category, module_no, module_name, topics_covered, class_id FROM public.curriculum WHERE class_id IS NULL LIMIT 5;

-- Check 6: Sample curriculum items with class_id
-- SELECT id, content_category, module_no, module_name, topics_covered, class_id FROM public.curriculum WHERE class_id IS NOT NULL LIMIT 5;

-- Check 7: Classes in database
-- SELECT id, name FROM public.classes ORDER BY name;

-- Check 8: Verify class_id column exists and has correct type
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'curriculum' AND column_name = 'class_id';

-- ACTUAL FIX: Run this to assign all NULL curriculum items to all classes
-- This is the main fix that needs to happen

-- Step 1: Insert curriculum items for all classes where class_id is NULL
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
  AND c.topics_covered IS NOT NULL
ON CONFLICT DO NOTHING;

-- Step 2: Delete the original NULL class_id items (only if they have been copied to all classes)
DELETE FROM public.curriculum 
WHERE class_id IS NULL 
  AND id IN (
    SELECT c1.id FROM public.curriculum c1
    WHERE c1.class_id IS NULL
      AND EXISTS (
        SELECT 1 FROM public.curriculum c2 
        WHERE c2.class_id IS NOT NULL
          AND c1.content_category = c2.content_category
          AND c1.module_no = c2.module_no
          AND c1.module_name = c2.module_name
          AND c1.topics_covered = c2.topics_covered
      )
  );

-- Step 3: Remove duplicates - keep only one per class
DELETE FROM public.curriculum
WHERE id NOT IN (
  SELECT DISTINCT ON (class_id, content_category, module_no, module_name, topics_covered) id
  FROM public.curriculum
  ORDER BY class_id, content_category, module_no, module_name, topics_covered, created_at ASC
);

-- Verify the fix
-- SELECT COUNT(*) as total_after_fix FROM public.curriculum;
-- SELECT class_id, COUNT(*) as count FROM public.curriculum WHERE class_id IS NOT NULL GROUP BY class_id ORDER BY class_id;
-- SELECT COUNT(*) as remaining_null FROM public.curriculum WHERE class_id IS NULL;

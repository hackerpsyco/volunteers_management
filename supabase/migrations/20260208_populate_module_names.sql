-- Populate module_name from module_no if module_name is empty
-- This ensures modules can be loaded in the Create Session dialog

-- Step 1: Check how many curriculum items have empty module_name
-- SELECT COUNT(*) as empty_module_names FROM public.curriculum WHERE module_name IS NULL OR module_name = '';

-- Step 2: For items with empty module_name but valid module_no, generate module names
UPDATE public.curriculum
SET module_name = 'Module ' || module_no::text
WHERE (module_name IS NULL OR module_name = '')
  AND module_no IS NOT NULL
  AND module_no > 0;

-- Step 3: For items with empty module_name and no module_no, use a default
UPDATE public.curriculum
SET module_name = 'General Module'
WHERE (module_name IS NULL OR module_name = '')
  AND (module_no IS NULL OR module_no = 0);

-- Step 4: Verify the fix
-- SELECT COUNT(*) as total FROM public.curriculum;
-- SELECT COUNT(*) as with_module_name FROM public.curriculum WHERE module_name IS NOT NULL AND module_name != '';
-- SELECT COUNT(*) as still_empty FROM public.curriculum WHERE module_name IS NULL OR module_name = '';

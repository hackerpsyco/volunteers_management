-- Restore curriculum with proper class relationships
-- Each curriculum item is linked to ONE class via class_id
-- This ensures no duplicates and proper class filtering

-- Step 1: Clear existing curriculum
DELETE FROM public.curriculum;

-- Step 2: Re-import curriculum data with class relationships
-- The curriculum will be imported with class_id set based on the class
-- This happens during the import process in the UI

-- After import, each curriculum item will have:
-- - Unique content (no duplicates)
-- - class_id pointing to the specific class
-- - All other fields populated

-- Verify the structure
SELECT COUNT(*) as curriculum_count FROM public.curriculum;
SELECT DISTINCT class_id FROM public.curriculum WHERE class_id IS NOT NULL;

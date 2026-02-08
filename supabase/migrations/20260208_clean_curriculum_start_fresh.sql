-- Clean start: Delete all curriculum data
TRUNCATE TABLE public.curriculum CASCADE;

-- Verify table is empty
SELECT COUNT(*) as curriculum_count FROM public.curriculum;

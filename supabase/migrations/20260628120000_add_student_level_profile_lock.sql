-- Alter students table to add allow_profile_edit column for student-level lock management
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS allow_profile_edit BOOLEAN DEFAULT TRUE;

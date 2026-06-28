-- Alter classes table to add allow_profile_edit column
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS allow_profile_edit BOOLEAN DEFAULT TRUE;

-- Alter students table to add bank details columns
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS account_number TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS ifsc_code TEXT;

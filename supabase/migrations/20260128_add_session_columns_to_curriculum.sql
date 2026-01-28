-- Add Fresh Session and Revision Session columns to curriculum table

ALTER TABLE public.curriculum
ADD COLUMN IF NOT EXISTS fresh_session TEXT,
ADD COLUMN IF NOT EXISTS revision_session TEXT;

-- Add comment to explain the new columns
COMMENT ON COLUMN public.curriculum.fresh_session IS 'Fresh session information or link';
COMMENT ON COLUMN public.curriculum.revision_session IS 'Revision session information or link';

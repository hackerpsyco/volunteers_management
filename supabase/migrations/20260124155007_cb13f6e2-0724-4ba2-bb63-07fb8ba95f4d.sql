-- Add new columns for teacher session content
ALTER TABLE public.sessions 
  ADD COLUMN IF NOT EXISTS content_category TEXT,
  ADD COLUMN IF NOT EXISTS s_no INTEGER,
  ADD COLUMN IF NOT EXISTS modules TEXT,
  ADD COLUMN IF NOT EXISTS topics_covered TEXT,
  ADD COLUMN IF NOT EXISTS videos TEXT,
  ADD COLUMN IF NOT EXISTS quiz_content_ppt TEXT,
  ADD COLUMN IF NOT EXISTS final_content_ppt TEXT,
  ADD COLUMN IF NOT EXISTS session_status TEXT DEFAULT 'pending';

-- Update session_type to include new guest types
COMMENT ON COLUMN public.sessions.session_type IS 'Types: regular, special_virtual, gts_english, guest_speaker, guest_teacher';
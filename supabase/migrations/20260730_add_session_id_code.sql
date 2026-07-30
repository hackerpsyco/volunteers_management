-- 1. Add session_id_code column to sessions table if it doesn't exist
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS session_id_code TEXT;

-- 2. Populate session_id_code for all existing sessions (past, current, and future)
WITH ranked_sessions AS (
  SELECT 
    id,
    session_date,
    class_batch,
    session_type,
    TO_CHAR(session_date::date, 'YYYY-MM') AS ym_str,
    -- Clean class batch name (remove spaces and special characters)
    COALESCE(
      NULLIF(REGEXP_REPLACE(class_batch, '[^a-zA-Z0-9]', '', 'g'), ''),
      'Class'
    ) AS clean_class,
    -- Session type prefix (gt, lt, gs)
    CASE 
      WHEN session_type = 'local_teacher' THEN 'lt'
      WHEN session_type = 'guest_speaker' THEN 'gs'
      ELSE 'gt'
    END AS type_prefix,
    -- Sequential rank per YYYY-MM month, clean_class, and type_prefix
    ROW_NUMBER() OVER (
      PARTITION BY 
        TO_CHAR(session_date::date, 'YYYY-MM'),
        COALESCE(NULLIF(REGEXP_REPLACE(class_batch, '[^a-zA-Z0-9]', '', 'g'), ''), 'Class'),
        CASE 
          WHEN session_type = 'local_teacher' THEN 'lt'
          WHEN session_type = 'guest_speaker' THEN 'gs'
          ELSE 'gt'
        END
      ORDER BY session_date ASC, created_at ASC, id ASC
    ) AS seq_num
  FROM public.sessions
)
UPDATE public.sessions s
SET session_id_code = r.ym_str || '-' || r.clean_class || '-' || r.type_prefix || '-' || LPAD(r.seq_num::text, 3, '0')
FROM ranked_sessions r
WHERE s.id = r.id;

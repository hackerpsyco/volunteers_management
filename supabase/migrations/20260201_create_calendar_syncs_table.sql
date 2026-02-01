-- Create calendar_syncs table to track Google Calendar event IDs
CREATE TABLE IF NOT EXISTS public.calendar_syncs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  google_event_id TEXT NOT NULL,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_calendar_syncs_session_id ON public.calendar_syncs(session_id);
CREATE INDEX IF NOT EXISTS idx_calendar_syncs_google_event_id ON public.calendar_syncs(google_event_id);

-- Enable RLS
ALTER TABLE public.calendar_syncs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow authenticated users to read calendar syncs"
  ON public.calendar_syncs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert calendar syncs"
  ON public.calendar_syncs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete calendar syncs"
  ON public.calendar_syncs FOR DELETE
  TO authenticated
  USING (true);

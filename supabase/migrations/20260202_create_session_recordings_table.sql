-- Create session_recordings table to track meeting recordings
CREATE TABLE IF NOT EXISTS public.session_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  coordinator_id UUID NOT NULL REFERENCES public.coordinators(id) ON DELETE CASCADE,
  recording_name TEXT NOT NULL,
  recording_url TEXT,
  google_drive_file_id TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  status VARCHAR(50) DEFAULT 'recording', -- recording, completed, failed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_session_recordings_session_id ON public.session_recordings(session_id);
CREATE INDEX idx_session_recordings_coordinator_id ON public.session_recordings(coordinator_id);
CREATE INDEX idx_session_recordings_status ON public.session_recordings(status);

-- Enable RLS
ALTER TABLE public.session_recordings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "session_recordings_select_policy"
  ON public.session_recordings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "session_recordings_insert_policy"
  ON public.session_recordings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "session_recordings_update_policy"
  ON public.session_recordings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "session_recordings_delete_policy"
  ON public.session_recordings FOR DELETE
  TO authenticated
  USING (true);

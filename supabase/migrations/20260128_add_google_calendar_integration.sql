-- Add columns to store Google Calendar integration data
ALTER TABLE public.volunteers
ADD COLUMN IF NOT EXISTS google_calendar_token TEXT,
ADD COLUMN IF NOT EXISTS google_calendar_email TEXT,
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true;

ALTER TABLE public.facilitators
ADD COLUMN IF NOT EXISTS google_calendar_token TEXT,
ADD COLUMN IF NOT EXISTS google_calendar_email TEXT,
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true;

-- Add table to track calendar event syncs
CREATE TABLE IF NOT EXISTS public.calendar_syncs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  volunteer_id UUID REFERENCES public.volunteers(id) ON DELETE CASCADE,
  facilitator_id UUID REFERENCES public.facilitators(id) ON DELETE CASCADE,
  google_event_id TEXT,
  synced_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add table to track email notifications
CREATE TABLE IF NOT EXISTS public.email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  recipient_type TEXT NOT NULL, -- 'volunteer' or 'facilitator'
  sent_at TIMESTAMP,
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.calendar_syncs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow all users to read calendar_syncs"
ON public.calendar_syncs FOR SELECT
USING (true);

CREATE POLICY "Allow all users to insert calendar_syncs"
ON public.calendar_syncs FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow all users to read email_notifications"
ON public.email_notifications FOR SELECT
USING (true);

CREATE POLICY "Allow all users to insert email_notifications"
ON public.email_notifications FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow all users to update email_notifications"
ON public.email_notifications FOR UPDATE
USING (true)
WITH CHECK (true);

-- Create session_hours_tracker table
CREATE TABLE IF NOT EXISTS session_hours_tracker (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  volunteer_id UUID REFERENCES volunteers(id) ON DELETE SET NULL,
  plan_coordinate_hours DECIMAL(5, 2) DEFAULT 0,
  preparation_hours DECIMAL(5, 2) DEFAULT 0,
  session_hours DECIMAL(5, 2) DEFAULT 0,
  reflection_feedback_followup_hours DECIMAL(5, 2) DEFAULT 0,
  total_volunteering_time DECIMAL(5, 2) GENERATED ALWAYS AS (
    COALESCE(plan_coordinate_hours, 0) + 
    COALESCE(preparation_hours, 0) + 
    COALESCE(session_hours, 0) + 
    COALESCE(reflection_feedback_followup_hours, 0)
  ) STORED,
  logged_hours_in_benevity BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_session_hours_tracker_session_id ON session_hours_tracker(session_id);
CREATE INDEX idx_session_hours_tracker_volunteer_id ON session_hours_tracker(volunteer_id);

-- Enable RLS
ALTER TABLE session_hours_tracker ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow authenticated users to view session hours tracker"
  ON session_hours_tracker FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Allow authenticated users to insert session hours tracker"
  ON session_hours_tracker FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

CREATE POLICY "Allow authenticated users to update session hours tracker"
  ON session_hours_tracker FOR UPDATE
  TO authenticated
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE POLICY "Allow authenticated users to delete session hours tracker"
  ON session_hours_tracker FOR DELETE
  TO authenticated
  USING (TRUE);

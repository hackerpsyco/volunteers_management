-- Create student_earnings table
CREATE TABLE IF NOT EXISTS student_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  task_id UUID REFERENCES student_task_feedback(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL DEFAULT 5,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_student_earnings_student_id ON student_earnings(student_id);

-- Enable RLS
ALTER TABLE student_earnings ENABLE ROW LEVEL SECURITY;

-- Policies for student_earnings
CREATE POLICY "Students can view their own earnings"
  ON student_earnings FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Admins can manage all earnings"
  ON student_earnings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role_id = 1
    )
  );

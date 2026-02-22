-- Create student_task_feedback table
CREATE TABLE IF NOT EXISTS student_task_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  feedback_type VARCHAR(50) NOT NULL, -- 'task', 'deadline', 'homework', 'assignment'
  task_name VARCHAR(255) NOT NULL,
  task_description TEXT,
  deadline DATE,
  submission_link VARCHAR(500),
  feedback_notes TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'submitted', 'reviewed', 'completed'
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_student_task_feedback_session ON student_task_feedback(session_id);
CREATE INDEX idx_student_task_feedback_student ON student_task_feedback(student_id);
CREATE INDEX idx_student_task_feedback_status ON student_task_feedback(status);

-- Enable RLS
ALTER TABLE student_task_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Enable read for authenticated users" ON student_task_feedback
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON student_task_feedback
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON student_task_feedback
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON student_task_feedback
  FOR DELETE USING (auth.role() = 'authenticated');

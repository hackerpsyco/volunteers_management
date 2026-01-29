-- Create student performance feedback table
CREATE TABLE student_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  student_name VARCHAR(255) NOT NULL,
  questions_asked INTEGER DEFAULT 0,
  performance_rating INTEGER CHECK (performance_rating >= 1 AND performance_rating <= 10),
  performance_comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_student_performance_session_id ON student_performance(session_id);

-- Enable RLS
ALTER TABLE student_performance ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for all users" ON student_performance
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON student_performance
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON student_performance
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON student_performance
  FOR DELETE USING (auth.role() = 'authenticated');

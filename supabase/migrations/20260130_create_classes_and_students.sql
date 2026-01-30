-- Create classes table
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL,
  name TEXT NOT NULL,
  gender TEXT,
  dob DATE,
  email TEXT,
  phone_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(class_id, student_id)
);

-- Create indexes
CREATE INDEX idx_students_class_id ON students(class_id);

-- Enable RLS
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- RLS Policies for classes
CREATE POLICY "Allow all users to view classes" ON classes
  FOR SELECT USING (true);

CREATE POLICY "Allow all users to insert classes" ON classes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all users to update classes" ON classes
  FOR UPDATE USING (true);

CREATE POLICY "Allow all users to delete classes" ON classes
  FOR DELETE USING (true);

-- RLS Policies for students
CREATE POLICY "Allow all users to view students" ON students
  FOR SELECT USING (true);

CREATE POLICY "Allow all users to insert students" ON students
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all users to update students" ON students
  FOR UPDATE USING (true);

CREATE POLICY "Allow all users to delete students" ON students
  FOR DELETE USING (true);

-- Insert predefined classes
INSERT INTO classes (name, description) VALUES
  ('Class 7', 'Class 7'),
  ('Class 8', 'Class 8'),
  ('Class 9', 'Class 9'),
  ('Class 10', 'Class 10'),
  ('CCC (11+12+1st Y+2ndY+3rdYr)', 'CCC (11+12+1st Y+2ndY+3rdYr)')
ON CONFLICT (name) DO NOTHING;

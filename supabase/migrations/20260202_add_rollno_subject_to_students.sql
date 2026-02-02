-- Add roll_number and subject columns to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS roll_number TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS subject TEXT;

-- Create index for roll_number
CREATE INDEX IF NOT EXISTS idx_students_roll_number ON students(roll_number);

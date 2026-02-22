-- Link students to user_profiles by email
-- This migration updates user_profiles.class_id based on matching student email

UPDATE user_profiles
SET class_id = (
  SELECT class_id 
  FROM students 
  WHERE students.email = user_profiles.email 
  LIMIT 1
)
WHERE email IS NOT NULL 
  AND class_id IS NULL
  AND EXISTS (
    SELECT 1 FROM students 
    WHERE students.email = user_profiles.email
  );

-- Create a trigger to automatically set class_id when a student is created with an email
CREATE OR REPLACE FUNCTION link_student_to_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- If the student has an email, try to link to user_profile
  IF NEW.email IS NOT NULL THEN
    UPDATE user_profiles
    SET class_id = NEW.class_id
    WHERE email = NEW.email 
      AND class_id IS NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS link_student_to_user_profile_trigger ON students;

-- Create the trigger
CREATE TRIGGER link_student_to_user_profile_trigger
AFTER INSERT ON students
FOR EACH ROW
EXECUTE FUNCTION link_student_to_user_profile();

-- Also create a trigger for when user_profiles are created
CREATE OR REPLACE FUNCTION link_user_profile_to_student()
RETURNS TRIGGER AS $$
BEGIN
  -- If the user_profile has an email, try to link to student
  IF NEW.email IS NOT NULL THEN
    UPDATE user_profiles
    SET class_id = (
      SELECT class_id 
      FROM students 
      WHERE students.email = NEW.email 
      LIMIT 1
    )
    WHERE id = NEW.id 
      AND class_id IS NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS link_user_profile_to_student_trigger ON user_profiles;

-- Create the trigger
CREATE TRIGGER link_user_profile_to_student_trigger
AFTER INSERT ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION link_user_profile_to_student();

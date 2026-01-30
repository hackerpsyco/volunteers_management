-- Make volunteer fields nullable to allow partial data during bulk import
ALTER TABLE volunteers ALTER COLUMN name DROP NOT NULL;
ALTER TABLE volunteers ALTER COLUMN work_email DROP NOT NULL;
ALTER TABLE volunteers ALTER COLUMN phone_number DROP NOT NULL;

-- Remove unique constraint on work_email to allow NULL values
ALTER TABLE volunteers DROP CONSTRAINT IF EXISTS volunteers_work_email_key;

-- Create a partial unique index that allows NULL values
-- (NULL is not considered equal to NULL in unique indexes)
CREATE UNIQUE INDEX IF NOT EXISTS idx_volunteers_work_email_unique 
ON volunteers(work_email) 
WHERE work_email IS NOT NULL;

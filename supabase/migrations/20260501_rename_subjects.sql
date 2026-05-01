-- Rename subjects to be more descriptive and follow requested naming
UPDATE subjects SET name = 'Artificial Intelligence' WHERE name = 'AI';
UPDATE subjects SET name = 'English Com and Soft Skill' WHERE name = 'Communication and Soft Skills';

-- Ensure curriculum items associated with these subjects are updated if any logic depends on names (though subject_id is preferred)
-- This migration only changes the names in the subjects table.

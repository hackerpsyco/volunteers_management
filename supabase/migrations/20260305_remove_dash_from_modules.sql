-- Remove leading dash and space from module names
UPDATE curriculum
SET module_name = TRIM(SUBSTRING(module_name FROM 3))
WHERE module_name LIKE '- %';

-- Migrate student designations to new names
UPDATE students SET designation = '1 Certified computer course' WHERE designation = 'ccc';
UPDATE students SET designation = '2 Certified computer course_EMP' WHERE designation = 'cccemp';
UPDATE students SET designation = '3 WES Intern/Junior Fellow' WHERE designation = 'intern';
UPDATE students SET designation = '4 WES Senior Fellow' WHERE designation = 'fellow';

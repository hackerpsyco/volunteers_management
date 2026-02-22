-- Add Student role (role_id = 5)
-- This role is for students to view their tasks and submit work

INSERT INTO public.roles (id, name, description)
VALUES (5, 'Student', 'Student role for viewing tasks and submitting work')
ON CONFLICT (id) DO NOTHING;

-- Verify the role was added
SELECT id, name, description FROM public.roles WHERE id = 5;

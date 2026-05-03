-- Migration: Add monitor_id and RLS policies for Class Monitors (Fellows)
-- 1. Add monitor_id if not exists
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS monitor_id UUID REFERENCES public.students(id);

-- 2. Add index for performance
CREATE INDEX IF NOT EXISTS idx_students_monitor_id ON public.students(monitor_id);

-- 3. RLS Policy for students table: 
-- Ensure Admins (role_id = 1) can do everything
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'students' AND policyname = 'Admins can do everything on students'
    ) THEN
        CREATE POLICY "Admins can do everything on students" ON public.students
        FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM public.user_profiles
                WHERE id = auth.uid() AND role_id = 1
            )
        );
    END IF;
END $$;

-- 4. Allow general view for all authenticated users (required for class lists and lookups)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'students' AND policyname = 'Authenticated users can view students'
    ) THEN
        CREATE POLICY "Authenticated users can view students" ON public.students
        FOR SELECT
        TO authenticated
        USING (true);
    END IF;
END $$;

-- 5. RLS Policy for student_task_feedback table:
-- Ensure Admins (role_id = 1) can do everything
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'student_task_feedback' AND policyname = 'Admins can do everything on tasks'
    ) THEN
        CREATE POLICY "Admins can do everything on tasks" ON public.student_task_feedback
        FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM public.user_profiles
                WHERE id = auth.uid() AND role_id = 1
            )
        );
    END IF;
END $$;

-- 6. Allow monitors to see tasks of students they are monitoring
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'student_task_feedback' AND policyname = 'Monitors can view assigned student tasks'
    ) THEN
        CREATE POLICY "Monitors can view assigned student tasks" ON public.student_task_feedback
        FOR SELECT
        USING (
            student_id IN (
                SELECT id FROM public.students 
                WHERE monitor_id IN (
                    SELECT s.id FROM public.students s
                    JOIN public.user_profiles up ON s.email = up.email
                    WHERE up.id = auth.uid()
                )
            )
        );
    END IF;
END $$;

-- 7. Allow monitors to UPDATE tasks status (to mark as completed)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'student_task_feedback' AND policyname = 'Monitors can update assigned student tasks'
    ) THEN
        CREATE POLICY "Monitors can update assigned student tasks" ON public.student_task_feedback
        FOR UPDATE
        USING (
            student_id IN (
                SELECT id FROM public.students 
                WHERE monitor_id IN (
                    SELECT s.id FROM public.students s
                    JOIN public.user_profiles up ON s.email = up.email
                    WHERE up.id = auth.uid()
                )
            )
        );
    END IF;
END $$;

-- Migration: Add RLS policies for Volunteers, Facilitators, and Monitors to verify tasks and manage earnings

-- 1. Facilitator & Volunteer Policies for public.student_earnings
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'student_earnings' AND policyname = 'Facilitators and Volunteers can insert student earnings'
    ) THEN
        CREATE POLICY "Facilitators and Volunteers can insert student earnings" ON public.student_earnings
        FOR INSERT
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.user_profiles
                WHERE id = auth.uid() AND role_id IN (1, 2, 3)
            )
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'student_earnings' AND policyname = 'Facilitators and Volunteers can delete student earnings'
    ) THEN
        CREATE POLICY "Facilitators and Volunteers can delete student earnings" ON public.student_earnings
        FOR DELETE
        USING (
            EXISTS (
                SELECT 1 FROM public.user_profiles
                WHERE id = auth.uid() AND role_id IN (1, 2, 3)
            )
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'student_earnings' AND policyname = 'Facilitators and Volunteers can view student earnings'
    ) THEN
        CREATE POLICY "Facilitators and Volunteers can view student earnings" ON public.student_earnings
        FOR SELECT
        USING (
            EXISTS (
                SELECT 1 FROM public.user_profiles
                WHERE id = auth.uid() AND role_id IN (1, 2, 3)
            )
        );
    END IF;
END $$;

-- 2. Facilitator & Volunteer Policies for public.student_task_feedback
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'student_task_feedback' AND policyname = 'Facilitators and Volunteers can manage tasks'
    ) THEN
        CREATE POLICY "Facilitators and Volunteers can manage tasks" ON public.student_task_feedback
        FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM public.user_profiles
                WHERE id = auth.uid() AND role_id IN (1, 2, 3)
            )
        );
    END IF;
END $$;

-- 3. Re-create Monitor Policies for public.student_earnings to be case-insensitive and support reviewer earnings
DROP POLICY IF EXISTS "Monitors can insert earnings for their students" ON public.student_earnings;
CREATE POLICY "Monitors can insert earnings for their students" ON public.student_earnings
FOR INSERT
WITH CHECK (
    -- Case 1: Inserting earning for an assigned student
    student_id IN (
        SELECT id FROM public.students 
        WHERE monitor_id IN (
            SELECT s.id FROM public.students s
            JOIN public.user_profiles up ON LOWER(s.email) = LOWER(up.email)
            WHERE up.id = auth.uid()
        )
    )
    -- Case 2: Inserting reviewer earning for themselves
    OR (
        student_id IN (
            SELECT s.id FROM public.students s
            JOIN public.user_profiles up ON LOWER(s.email) = LOWER(up.email)
            WHERE up.id = auth.uid()
        )
        AND EXISTS (
            SELECT 1 FROM public.student_task_feedback stf
            JOIN public.students classmate ON stf.student_id = classmate.id
            WHERE stf.id = task_id
            AND classmate.monitor_id IN (
                SELECT s.id FROM public.students s
                JOIN public.user_profiles up ON LOWER(s.email) = LOWER(up.email)
                WHERE up.id = auth.uid()
            )
        )
    )
);

DROP POLICY IF EXISTS "Monitors can delete earnings of their students" ON public.student_earnings;
CREATE POLICY "Monitors can delete earnings of their students" ON public.student_earnings
FOR DELETE
USING (
    -- Case 1: Deleting earning of an assigned student
    student_id IN (
        SELECT id FROM public.students 
        WHERE monitor_id IN (
            SELECT s.id FROM public.students s
            JOIN public.user_profiles up ON LOWER(s.email) = LOWER(up.email)
            WHERE up.id = auth.uid()
        )
    )
    -- Case 2: Deleting reviewer earning of themselves
    OR (
        student_id IN (
            SELECT s.id FROM public.students s
            JOIN public.user_profiles up ON LOWER(s.email) = LOWER(up.email)
            WHERE up.id = auth.uid()
        )
        AND EXISTS (
            SELECT 1 FROM public.student_task_feedback stf
            JOIN public.students classmate ON stf.student_id = classmate.id
            WHERE stf.id = task_id
            AND classmate.monitor_id IN (
                SELECT s.id FROM public.students s
                JOIN public.user_profiles up ON LOWER(s.email) = LOWER(up.email)
                WHERE up.id = auth.uid()
            )
        )
    )
);

DROP POLICY IF EXISTS "Monitors can view earnings of their students" ON public.student_earnings;
CREATE POLICY "Monitors can view earnings of their students" ON public.student_earnings
FOR SELECT
USING (
    student_id IN (
        SELECT id FROM public.students 
        WHERE monitor_id IN (
            SELECT s.id FROM public.students s
            JOIN public.user_profiles up ON LOWER(s.email) = LOWER(up.email)
            WHERE up.id = auth.uid()
        )
    )
    OR student_id IN (
        SELECT s.id FROM public.students s
        JOIN public.user_profiles up ON LOWER(s.email) = LOWER(up.email)
        WHERE up.id = auth.uid()
    )
);

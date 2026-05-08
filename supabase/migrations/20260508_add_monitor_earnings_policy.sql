-- Migration: Add RLS policy for Monitors to insert earnings
-- Allows Monitors (Fellows) to record rewards when they verify task completion

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'student_earnings' AND policyname = 'Monitors can insert earnings for their students'
    ) THEN
        CREATE POLICY "Monitors can insert earnings for their students" ON public.student_earnings
        FOR INSERT
        WITH CHECK (
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

    -- Allow monitors to DELETE earnings of students they monitor (when resetting tasks)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'student_earnings' AND policyname = 'Monitors can delete earnings of their students'
    ) THEN
        CREATE POLICY "Monitors can delete earnings of their students" ON public.student_earnings
        FOR DELETE
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

    -- Also allow monitors to VIEW earnings of students they monitor
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'student_earnings' AND policyname = 'Monitors can view earnings of their students'
    ) THEN
        CREATE POLICY "Monitors can view earnings of their students" ON public.student_earnings
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

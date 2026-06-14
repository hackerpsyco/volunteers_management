-- Drop the existing policies for student_earnings that limit to roles 1, 2, 3
DROP POLICY IF EXISTS "Facilitators and Volunteers can insert student earnings" ON public.student_earnings;
DROP POLICY IF EXISTS "Facilitators and Volunteers can delete student earnings" ON public.student_earnings;
DROP POLICY IF EXISTS "Facilitators and Volunteers can view student earnings" ON public.student_earnings;

-- Drop the existing policy for student_task_feedback
DROP POLICY IF EXISTS "Facilitators and Volunteers can manage tasks" ON public.student_task_feedback;

DO $$ 
BEGIN
    -- 1. Create INSERT policy for student_earnings
    CREATE POLICY "Facilitators and Volunteers can insert student earnings" ON public.student_earnings
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role_id IN (1, 2, 3, 4)
        )
    );

    -- 2. Create DELETE policy for student_earnings
    CREATE POLICY "Facilitators and Volunteers can delete student earnings" ON public.student_earnings
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role_id IN (1, 2, 3, 4)
        )
    );

    -- 3. Create SELECT policy for student_earnings
    CREATE POLICY "Facilitators and Volunteers can view student earnings" ON public.student_earnings
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role_id IN (1, 2, 3, 4)
        )
    );

    -- 4. Create ALL policy for student_task_feedback
    CREATE POLICY "Facilitators and Volunteers can manage tasks" ON public.student_task_feedback
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role_id IN (1, 2, 3, 4)
        )
    );
END $$;

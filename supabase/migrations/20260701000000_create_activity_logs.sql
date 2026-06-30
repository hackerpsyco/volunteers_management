-- Create activity_logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    user_name TEXT,
    action TEXT NOT NULL, -- e.g., 'CREATE', 'UPDATE', 'DELETE', 'LOCK', 'UNLOCK', 'VERIFY', 'REJECT'
    module TEXT NOT NULL, -- e.g., 'Classes', 'Students', 'Tasks', 'Sessions', 'Earnings'
    details TEXT,         -- details of the action
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to insert logs
CREATE POLICY "Allow authenticated users to insert activity logs" 
    ON public.activity_logs 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

-- Policy to allow authenticated users to select activity logs (admins will view them)
CREATE POLICY "Allow authenticated users to select activity logs" 
    ON public.activity_logs 
    FOR SELECT 
    TO authenticated 
    USING (true);

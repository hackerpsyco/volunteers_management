-- Create volunteers table
CREATE TABLE public.volunteers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    mobile TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sessions table
CREATE TABLE public.sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    session_date DATE NOT NULL,
    session_time TIME NOT NULL,
    volunteer_id UUID REFERENCES public.volunteers(id) ON DELETE SET NULL,
    session_type TEXT NOT NULL DEFAULT 'regular',
    status TEXT NOT NULL DEFAULT 'scheduled',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (admin access)
CREATE POLICY "Authenticated users can view volunteers"
ON public.volunteers FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert volunteers"
ON public.volunteers FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update volunteers"
ON public.volunteers FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete volunteers"
ON public.volunteers FOR DELETE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view sessions"
ON public.sessions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert sessions"
ON public.sessions FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update sessions"
ON public.sessions FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete sessions"
ON public.sessions FOR DELETE
TO authenticated
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_volunteers_updated_at
BEFORE UPDATE ON public.volunteers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at
BEFORE UPDATE ON public.sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
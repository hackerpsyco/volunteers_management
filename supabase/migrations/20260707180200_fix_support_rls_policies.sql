-- Migration: Fix support requests and messages RLS policies
-- Drops misconfigured RLS policies and establishes correct, comprehensive ones.

do $$
declare
  r record;
begin
  -- Loop through and drop all existing policies on support_requests and support_messages
  for r in (
    select policyname, tablename 
    from pg_policies 
    where schemaname = 'public' 
      and tablename in ('support_requests', 'support_messages')
  ) loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
end;
$$;

-- Enable RLS on both tables (in case not enabled)
alter table public.support_requests enable row level security;
alter table public.support_messages enable row level security;

-- ========================================================
-- Support Requests Policies
-- ========================================================

-- SELECT Policy
create policy "support_requests_select" on public.support_requests
for select using (
  -- Admins, coordinators, facilitators can view all requests
  exists (
    select 1 
    from public.user_profiles 
    where id = auth.uid() 
      and role_id in (1, 2, 3, 4)
  )
  -- Students can only view their own requests (matched by email in students table)
  or student_id in (
    select id 
    from public.students 
    where email = auth.jwt() ->> 'email'
  )
);

-- INSERT Policy
create policy "support_requests_insert" on public.support_requests
for insert with check (
  exists (
    select 1 
    from public.user_profiles 
    where id = auth.uid() 
      and role_id in (1, 2, 3, 4)
  )
  or student_id in (
    select id 
    from public.students 
    where email = auth.jwt() ->> 'email'
  )
);

-- UPDATE Policy
create policy "support_requests_update" on public.support_requests
for update using (
  exists (
    select 1 
    from public.user_profiles 
    where id = auth.uid() 
      and role_id in (1, 2, 3, 4)
  )
  or student_id in (
    select id 
    from public.students 
    where email = auth.jwt() ->> 'email'
  )
);

-- ========================================================
-- Support Messages Policies
-- ========================================================

-- SELECT Policy
create policy "support_messages_select" on public.support_messages
for select using (
  -- Admins, coordinators, facilitators can view all support messages
  exists (
    select 1 
    from public.user_profiles 
    where id = auth.uid() 
      and role_id in (1, 2, 3, 4)
  )
  -- Students can only view messages belonging to their own requests
  or exists (
    select 1 
    from public.support_requests 
    where id = request_id 
      and student_id in (
        select id 
        from public.students 
        where email = auth.jwt() ->> 'email'
      )
  )
);

-- INSERT Policy
create policy "support_messages_insert" on public.support_messages
for insert with check (
  -- Admins, coordinators, facilitators can send support messages
  exists (
    select 1 
    from public.user_profiles 
    where id = auth.uid() 
      and role_id in (1, 2, 3, 4)
  )
  -- Students can only send messages to their own requests
  or exists (
    select 1 
    from public.support_requests 
    where id = request_id 
      and student_id in (
        select id 
        from public.students 
        where email = auth.jwt() ->> 'email'
      )
  )
);

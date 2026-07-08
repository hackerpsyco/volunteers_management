-- Migration: Create facilitator_classes table and update support RLS policies

-- 1. Create facilitator_classes junction table
create table if not exists public.facilitator_classes (
  id uuid primary key default gen_random_uuid(),
  facilitator_id uuid not null references public.facilitators(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  class_link text,
  created_at timestamp with time zone default now(),
  unique(facilitator_id, class_id)
);

-- Enable RLS
alter table public.facilitator_classes enable row level security;

-- 2. Drop existing policies on facilitator_classes if any
drop policy if exists "facilitator_classes_select" on public.facilitator_classes;
drop policy if exists "facilitator_classes_insert" on public.facilitator_classes;
drop policy if exists "facilitator_classes_update" on public.facilitator_classes;
drop policy if exists "facilitator_classes_delete" on public.facilitator_classes;

-- Create policies for facilitator_classes
create policy "facilitator_classes_select" on public.facilitator_classes
for select using (
  exists (
    select 1 from public.user_profiles
    where id = auth.uid() and role_id in (1, 3)
  )
  or facilitator_id in (
    select id from public.facilitators
    where email = auth.jwt() ->> 'email'
  )
);

create policy "facilitator_classes_insert" on public.facilitator_classes
for insert with check (
  exists (
    select 1 from public.user_profiles
    where id = auth.uid() and role_id in (1, 3)
  )
);

create policy "facilitator_classes_update" on public.facilitator_classes
for update using (
  exists (
    select 1 from public.user_profiles
    where id = auth.uid() and role_id in (1, 3)
  )
);

create policy "facilitator_classes_delete" on public.facilitator_classes
for delete using (
  exists (
    select 1 from public.user_profiles
    where id = auth.uid() and role_id in (1, 3)
  )
);

-- =========================================================================
-- 3. Update RLS policies for support_requests to restrict role 4
-- =========================================================================
drop policy if exists "support_requests_select" on public.support_requests;
drop policy if exists "support_requests_insert" on public.support_requests;
drop policy if exists "support_requests_update" on public.support_requests;

-- Support Requests SELECT
create policy "support_requests_select" on public.support_requests
for select using (
  -- Admins & coordinators can view all requests
  exists (
    select 1 
    from public.user_profiles 
    where id = auth.uid() 
      and role_id in (1, 3)
  )
  -- Teachers/facilitators (role 4) can view requests for their assigned classes
  or (
    exists (
      select 1 
      from public.user_profiles 
      where id = auth.uid() 
        and role_id = 4
    )
    and class_id in (
      select class_id 
      from public.facilitator_classes fc
      join public.facilitators f on f.id = fc.facilitator_id
      where f.email = auth.jwt() ->> 'email'
    )
  )
  -- Students can only view their own requests (matched by email in students table)
  or student_id in (
    select id 
    from public.students 
    where email = auth.jwt() ->> 'email'
  )
);

-- Support Requests INSERT
create policy "support_requests_insert" on public.support_requests
for insert with check (
  exists (
    select 1 
    from public.user_profiles 
    where id = auth.uid() 
      and role_id in (1, 3)
  )
  or student_id in (
    select id 
    from public.students 
    where email = auth.jwt() ->> 'email'
  )
);

-- Support Requests UPDATE
create policy "support_requests_update" on public.support_requests
for update using (
  -- Admins & coordinators can update all
  exists (
    select 1 
    from public.user_profiles 
    where id = auth.uid() 
      and role_id in (1, 3)
  )
  -- Teachers/facilitators can update status/priority if request class is assigned to them
  or (
    exists (
      select 1 
      from public.user_profiles 
      where id = auth.uid() 
        and role_id = 4
    )
    and class_id in (
      select class_id 
      from public.facilitator_classes fc
      join public.facilitators f on f.id = fc.facilitator_id
      where f.email = auth.jwt() ->> 'email'
    )
  )
  -- Students can update their own
  or student_id in (
    select id 
    from public.students 
    where email = auth.jwt() ->> 'email'
  )
);

-- =========================================================================
-- 4. Update RLS policies for support_messages to restrict role 4
-- =========================================================================
drop policy if exists "support_messages_select" on public.support_messages;
drop policy if exists "support_messages_insert" on public.support_messages;
drop policy if exists "support_messages_update" on public.support_messages;
drop policy if exists "support_messages_delete" on public.support_messages;

-- Support Messages SELECT
create policy "support_messages_select" on public.support_messages
for select using (
  -- Admins & coordinators can view all support messages
  exists (
    select 1 
    from public.user_profiles 
    where id = auth.uid() 
      and role_id in (1, 3)
  )
  -- Teachers/facilitators can view messages for requests in their assigned classes
  or exists (
    select 1
    from public.support_requests r
    where r.id = request_id
      and exists (
        select 1 
        from public.user_profiles 
        where id = auth.uid() 
          and role_id = 4
      )
      and r.class_id in (
        select class_id 
        from public.facilitator_classes fc
        join public.facilitators f on f.id = fc.facilitator_id
        where f.email = auth.jwt() ->> 'email'
      )
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

-- Support Messages INSERT
create policy "support_messages_insert" on public.support_messages
for insert with check (
  -- Admins & coordinators can send support messages
  exists (
    select 1 
    from public.user_profiles 
    where id = auth.uid() 
      and role_id in (1, 3)
  )
  -- Teachers/facilitators can send if request class is assigned
  or exists (
    select 1
    from public.support_requests r
    where r.id = request_id
      and exists (
        select 1 
        from public.user_profiles 
        where id = auth.uid() 
          and role_id = 4
      )
      and r.class_id in (
        select class_id 
        from public.facilitator_classes fc
        join public.facilitators f on f.id = fc.facilitator_id
        where f.email = auth.jwt() ->> 'email'
      )
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

-- Support Messages UPDATE
create policy "support_messages_update" on public.support_messages
for update using (
  -- Sender can edit their own message text or update delete flag
  auth.jwt() ->> 'email' = sender_email
  -- OR admins & coordinators can update
  or exists (
    select 1 
    from public.user_profiles 
    where id = auth.uid() 
      and role_id in (1, 3)
  )
  -- OR teachers/facilitators can update if request class is assigned
  or exists (
    select 1
    from public.support_requests r
    where r.id = request_id
      and exists (
        select 1 
        from public.user_profiles 
        where id = auth.uid() 
          and role_id = 4
      )
      and r.class_id in (
        select class_id 
        from public.facilitator_classes fc
        join public.facilitators f on f.id = fc.facilitator_id
        where f.email = auth.jwt() ->> 'email'
      )
  )
  -- OR the student associated with the request can update
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

-- Support Messages DELETE
create policy "support_messages_delete" on public.support_messages
for delete using (
  -- Sender can delete their own message completely
  auth.jwt() ->> 'email' = sender_email
  -- OR admins & coordinators can delete any message
  or exists (
    select 1 
    from public.user_profiles 
    where id = auth.uid() 
      and role_id in (1, 3)
  )
);

-- Migration: Add support message edit and delete support
-- Adds columns and creates update/delete RLS policies.

-- 1. Add columns to support_messages
alter table public.support_messages add column if not exists edited_at timestamp with time zone;
alter table public.support_messages add column if not exists deleted_for_student boolean default false;
alter table public.support_messages add column if not exists deleted_for_admin boolean default false;

-- 2. Drop existing update/delete policies on support_messages
drop policy if exists "support_messages_update" on public.support_messages;
drop policy if exists "support_messages_delete" on public.support_messages;

-- 3. Create update policy
create policy "support_messages_update" on public.support_messages
for update using (
  -- Sender can edit their own message text or update delete flag
  auth.jwt() ->> 'email' = sender_email
  -- OR admins/coordinators/facilitators can update deleted_for_admin
  or exists (
    select 1 
    from public.user_profiles 
    where id = auth.uid() 
      and role_id in (1, 2, 3, 4)
  )
  -- OR the student associated with the request can update deleted_for_student
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

-- 4. Create delete policy
create policy "support_messages_delete" on public.support_messages
for delete using (
  -- Sender can delete their own message completely (Delete for Everyone)
  auth.jwt() ->> 'email' = sender_email
  -- OR admins/coordinators/facilitators can delete any message
  or exists (
    select 1 
    from public.user_profiles 
    where id = auth.uid() 
      and role_id in (1, 2, 3, 4)
  )
);

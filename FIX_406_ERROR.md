# Fix 406 Error - Student Homework Feedback

## Problem
You're getting a 406 "Not Acceptable" error when trying to load the homework feedback section.

## Root Cause
The `student_task_feedback` table doesn't exist in your Supabase database yet.

## Solution

### Option 1: Run Migration via Supabase CLI (Recommended)

```bash
supabase migration up
```

### Option 2: Run SQL Manually in Supabase Dashboard

1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste this SQL:

GET https://bkafweywaswykowzrhmx.supabase.co/rest/v1/session_hours_tracker?select=*&session_id=eq.954a0e40-7f02-4707-8a14-834f47c65a06 406 (Not Acceptable)
(anonymous) @ fetch.ts:7
(anonymous) @ fetch.ts:34
await in (anonymous)
then @ PostgrestBuilder.ts:122
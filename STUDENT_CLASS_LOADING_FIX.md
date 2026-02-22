# Student Class Loading Fix

## Problem
Student Dashboard was not loading class-specific data (tasks and sessions) because:
1. Students were created in the `students` table with a `class_id`
2. But when students logged in, their `user_profiles.class_id` was empty/null
3. StudentDashboard only looked at `user_profiles.class_id` to determine which class a student belongs to
4. Result: No tasks or sessions were displayed

## Root Cause
There was no link between:
- `students` table (has `class_id`, `email`)
- `user_profiles` table (has `class_id`, `email`)

When a student account was created, their `user_profiles` record didn't get the `class_id` from the matching `students` record.

## Solution

### 1. Updated StudentDashboard.tsx
Changed `loadStudentData()` to:
- Fetch `class_id` from `user_profiles`
- Get all students in that class
- Filter tasks by those student IDs
- Filter sessions by class name (via `class_batch`)

### 2. Created Migration: 20260226_link_students_to_user_profiles.sql
This migration:
- **Backfills existing data**: Updates all existing `user_profiles` records to set `class_id` by matching email with `students` table
- **Creates trigger on students insert**: When a new student is added with an email, automatically updates matching `user_profiles.class_id`
- **Creates trigger on user_profiles insert**: When a new user profile is created with an email, automatically sets `class_id` from matching `students` record

### 3. Updated Supabase Types
Added `students` table definition to `src/integrations/supabase/types.ts` so TypeScript knows about the table.

## How It Works Now

1. **Student signs up** → `user_profiles` record created with email
2. **Trigger fires** → Looks for matching `students` record by email
3. **class_id is set** → `user_profiles.class_id` is populated
4. **StudentDashboard loads** → Fetches class_id from user_profiles
5. **Tasks & Sessions display** → Filtered by the student's class

## Data Flow

```
Student Login
    ↓
Fetch user_profiles (with class_id)
    ↓
Get class info from classes table
    ↓
Get all students in that class
    ↓
Fetch tasks for those students
    ↓
Fetch sessions for that class (by class_batch name)
    ↓
Display in StudentDashboard
```

## Testing

To verify the fix works:
1. Ensure students have been added to a class via Classes page
2. Make sure student email matches between `students` and `user_profiles` tables
3. Run the migration to backfill existing data
4. Student logs in → Should see their class tasks and sessions

## Files Changed
- `src/pages/StudentDashboard.tsx` - Updated loadStudentData() logic
- `src/integrations/supabase/types.ts` - Added students table type definition
- `supabase/migrations/20260226_link_students_to_user_profiles.sql` - New migration for linking

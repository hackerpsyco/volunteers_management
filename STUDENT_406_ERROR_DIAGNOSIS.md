# WES Fellow Student 406 Error - Root Cause & Fix

## Problem
Students are getting 406 "Not Acceptable" errors when trying to access their dashboard. The error occurs when querying `user_profiles` table.

## Root Cause
The `user_profiles` table has **mismatched IDs**:
- Auth user ID (from `auth.users`): `e7ca3917-216b-4cf3-a0e5-d0f2bdeaa114`
- Profile ID (from `user_profiles`): `31b2e8bb-ec18-43c4-ba11-f94b035e4c43` (WRONG!)

The RLS policy requires: `auth.uid() = id`
- When student logs in, `auth.uid()` = `e7ca3917-216b-4cf3-a0e5-d0f2bdeaa114`
- But profile has `id` = `31b2e8bb-ec18-43c4-ba11-f94b035e4c43`
- **MISMATCH** → RLS rejects query → 406 error

## Solution
Run this SQL in Supabase SQL Editor:

```sql
-- Step 1: Delete old profiles with wrong IDs
DELETE FROM user_profiles
WHERE email IN (
  'nargish.ccc2526@gmail.com',
  'ittehad.ccc2526@gmail.com',
  'mahakkhan.ccc2526@gmail.com',
  'anjali.ccc2526@gmail.com',
  'akashverma.ccc2526@gmail.com',
  'parasbarman.ccc2526@gmail.com',
  'nashreen.ccc2526@gmail.com',
  'sonali.ccc2526@gmail.com',
  'harshita.ccc2526@gmail.com',
  'anchal.ccc2526@gmail.com',
  'Sarojpanika.ccc2526@gmail.com',
  'Shivamdahiya.ccc2526@gmail.com',
  'arzoo.ccc2526@gmail.com',
  'vaishnavi.ccc2526@gmail.com',
  'aasifa.ccc2526@gmail.com',
  'minakshibarmanccc@gmail.com',
  'alkamabeeccc@gmail.com',
  'varsunnishaccc@gmail.com'
);

-- Step 2: Create new profiles with CORRECT auth user IDs
INSERT INTO user_profiles (id, email, role_id, class_id, is_active, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  5,
  (SELECT id FROM classes WHERE name = 'WES Fellow' LIMIT 1),
  TRUE,
  NOW(),
  NOW()
FROM auth.users au
WHERE au.email IN (
  'nargish.ccc2526@gmail.com',
  'ittehad.ccc2526@gmail.com',
  'mahakkhan.ccc2526@gmail.com',
  'anjali.ccc2526@gmail.com',
  'akashverma.ccc2526@gmail.com',
  'parasbarman.ccc2526@gmail.com',
  'nashreen.ccc2526@gmail.com',
  'sonali.ccc2526@gmail.com',
  'harshita.ccc2526@gmail.com',
  'anchal.ccc2526@gmail.com',
  'Sarojpanika.ccc2526@gmail.com',
  'Shivamdahiya.ccc2526@gmail.com',
  'arzoo.ccc2526@gmail.com',
  'vaishnavi.ccc2526@gmail.com',
  'aasifa.ccc2526@gmail.com',
  'minakshibarmanccc@gmail.com',
  'alkamabeeccc@gmail.com',
  'varsunnishaccc@gmail.com'
);
```

## Steps to Apply Fix

1. Go to https://app.supabase.com
2. Select your project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste the SQL above
6. Click **Run**
7. Refresh your app - error should be gone

## Verification

After running the migration, verify it worked:

```sql
-- Check that profiles now have correct IDs matching auth users
SELECT 
  au.id as auth_user_id,
  au.email,
  up.id as profile_id,
  up.role_id,
  up.class_id,
  CASE WHEN au.id = up.id THEN '✓ MATCH' ELSE '✗ MISMATCH' END as status
FROM auth.users au
LEFT JOIN user_profiles up ON au.email = up.email
WHERE au.email IN (
  'nargish.ccc2526@gmail.com',
  'ittehad.ccc2526@gmail.com',
  'mahakkhan.ccc2526@gmail.com',
  'anjali.ccc2526@gmail.com',
  'akashverma.ccc2526@gmail.com',
  'parasbarman.ccc2526@gmail.com',
  'nashreen.ccc2526@gmail.com',
  'sonali.ccc2526@gmail.com',
  'harshita.ccc2526@gmail.com',
  'anchal.ccc2526@gmail.com',
  'Sarojpanika.ccc2526@gmail.com',
  'Shivamdahiya.ccc2526@gmail.com',
  'arzoo.ccc2526@gmail.com',
  'vaishnavi.ccc2526@gmail.com',
  'aasifa.ccc2526@gmail.com',
  'minakshibarmanccc@gmail.com',
  'alkamabeeccc@gmail.com',
  'varsunnishaccc@gmail.com'
)
ORDER BY au.email;
```

All rows should show "✓ MATCH" in the status column.

## Why This Happens

The JavaScript script `scripts/create-wes-students.js` was updating existing profiles instead of creating new ones with correct IDs. The old profiles had wrong IDs from a previous migration.

## Prevention

The updated `scripts/create-wes-students.js` now:
- Sets `role_id = 5` (Student role)
- Links to WES Fellow class
- Works with existing profiles

For future students, ensure profiles are created with the correct auth user ID from the start.

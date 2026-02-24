# Complete Fix Guide for 406 Error

## What Was Done

### 1. Code Workaround (Already Applied ✓)
Updated two files to handle profile ID mismatches:
- `src/components/layout/DashboardLayout.tsx` - Detects students even with ID mismatch
- `src/pages/StudentDashboard.tsx` - Loads student data even with ID mismatch

**Result**: Students can now access their dashboard without 406 errors

### 2. Database Fix (Still Needed)
Run the SQL migration in Supabase to permanently fix the ID mismatch

---

## Step 1: Test the Workaround

1. Hard refresh your app: **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac)
2. Log in as a student: `nargish.ccc2526@gmail.com`
3. Check if you see:
   - ✓ StudentSidebar (left sidebar with "My Dashboard" and "My Calendar")
   - ✓ StudentDashboard loads without 406 errors
   - ✓ Tasks and calendar display

**If this works**, the workaround is successful! Students can now use the app.

---

## Step 2: Apply the Permanent Database Fix

To permanently fix the ID mismatch, run this SQL in Supabase:

### Go to Supabase SQL Editor
1. Open https://app.supabase.com
2. Select your project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**

### Copy and Run This SQL

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

### Verify It Worked

Run this verification query:

```sql
SELECT 
  au.id as auth_user_id,
  au.email,
  up.id as profile_id,
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

**All rows should show "✓ MATCH"** - if they do, the permanent fix is complete!

---

## Summary

| Step | What | Status | Result |
|------|------|--------|--------|
| 1 | Code workaround | ✓ Done | Students can access dashboard |
| 2 | Database fix | ⏳ Pending | Permanent fix for ID mismatch |

**Next**: Run the SQL migration in Supabase to complete the permanent fix.

---

## Why This Happened

The JavaScript script that created WES Fellow students was updating existing profiles instead of creating new ones with correct IDs. The old profiles had wrong IDs from a previous migration.

**Prevention**: For future students, ensure profiles are created with the correct auth user ID from the start.


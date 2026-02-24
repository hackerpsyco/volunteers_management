# Fix 406 Error - Step by Step Guide

## The Problem
Students are getting 406 errors because their **auth user ID** doesn't match their **profile ID** in the database.

**Example:**
- Auth user ID: `e7ca3917-216b-4cf3-a0e5-d0f2bdeaa114`
- Profile ID: `31b2e8bb-ec18-43c4-ba11-f94b035e4c43` ❌ WRONG!

The RLS policy checks: `auth.uid() = id`
- When student logs in, `auth.uid()` = `e7ca3917-216b-4cf3-a0e5-d0f2bdeaa114`
- But profile has `id` = `31b2e8bb-ec18-43c4-ba11-f94b035e4c43`
- **MISMATCH** → RLS blocks query → 406 error

---

## Solution: Run SQL in Supabase

### Step 1: Go to Supabase
1. Open https://app.supabase.com
2. Select your project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**

### Step 2: Copy This SQL

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

### Step 3: Paste and Run
1. Paste the SQL into the query editor
2. Click **Run** button
3. Wait for it to complete (should say "Success")

### Step 4: Refresh Your App
1. Go back to your app
2. Press **Ctrl+Shift+R** (hard refresh) or **Cmd+Shift+R** on Mac
3. Log in as a student
4. The 406 error should be gone!

---

## Verify It Worked

After running the SQL, run this verification query:

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

**All rows should show "✓ MATCH"** - if they do, the fix worked!

---

## What Happens After Fix

1. **StudentSidebar** will show instead of AppSidebar
2. **StudentDashboard** will load without 406 errors
3. Students can see their tasks and calendar
4. Students can submit assignments

---

## If Still Getting 406 Error

If you still get 406 after running the SQL:

1. **Check the verification query** - Are all rows showing "✓ MATCH"?
   - If NO: The SQL didn't work, try running it again
   - If YES: The problem is elsewhere

2. **Check RLS Policies** - Run this:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'user_profiles';
   ```
   Should show 6 policies including "Allow users to view their own profile"

3. **Check if StudentDashboard route exists** - It should be at `/student-dashboard`

4. **Check browser console** - Look for specific error messages

---

## Questions?

If you're still stuck:
1. Share the results of the verification query
2. Share any error messages from the browser console
3. Tell me which student email you're testing with


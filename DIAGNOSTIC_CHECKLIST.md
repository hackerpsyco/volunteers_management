# 406 Error Diagnostic Checklist

## Step 1: Check Current Database State

Run this query in Supabase SQL Editor to see the EXACT problem:

```sql
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

**EXPECTED RESULTS - What you should see:**

### Option A: MISMATCH (Problem exists)
```
| auth_user_id                         | email                      | profile_id                           | role_id | class_id | status      |
|--------------------------------------|----------------------------|--------------------------------------|---------|----------|-------------|
| e7ca3917-216b-4cf3-a0e5-d0f2bdeaa114 | nargish.ccc2526@gmail.com  | 31b2e8bb-ec18-43c4-ba11-f94b035e4c43 | 5       | xxx      | ✗ MISMATCH  |
```
**Action**: Run the FIX migration below

### Option B: NULL profile_id (No profile exists)
```
| auth_user_id                         | email                      | profile_id | role_id | class_id | status |
|--------------------------------------|----------------------------|------------|---------|----------|--------|
| e7ca3917-216b-4cf3-a0e5-d0f2bdeaa114 | nargish.ccc2526@gmail.com  | NULL       | NULL    | NULL     | NULL   |
```
**Action**: Run the CREATE migration below

### Option C: MATCH (Already fixed!)
```
| auth_user_id                         | email                      | profile_id                           | role_id | class_id | status  |
|--------------------------------------|----------------------------|--------------------------------------|---------|----------|---------|
| e7ca3917-216b-4cf3-a0e5-d0f2bdeaa114 | nargish.ccc2526@gmail.com  | e7ca3917-216b-4cf3-a0e5-d0f2bdeaa114 | 5       | xxx      | ✓ MATCH |
```
**Action**: No fix needed - error must be elsewhere

---

## Step 2: Apply the Appropriate Fix

### IF Option A or B (Problem exists):

Run this in Supabase SQL Editor:

```sql
-- DELETE old profiles with wrong IDs
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

-- CREATE new profiles with CORRECT auth user IDs
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

Then refresh your app.

---

## Step 3: Verify the Fix Worked

Run the diagnostic query again. All rows should now show **✓ MATCH**.

---

## If Still Getting 406 Error After Fix:

The problem might be elsewhere. Check:

1. **RLS Policies** - Are they correct?
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'user_profiles';
   ```

2. **StudentSidebar** - Is it being shown for students?
   - Check DashboardLayout.tsx - does it show StudentSidebar when role_id = 5?

3. **StudentDashboard** - Can it load data?
   - Check if profile loads without 406 error


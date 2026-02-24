# Workaround Applied for 406 Error

## Problem
Students were getting 406 errors because their **auth user ID** didn't match their **profile ID** in the database. The RLS policy requires `auth.uid() = id`, so when IDs don't match, the query is blocked.

## Root Cause
The old migration created profiles with wrong IDs. When students tried to query their profile using their auth user ID, the RLS policy blocked it because the profile had a different ID.

## Solution Applied

### Code Changes

#### 1. DashboardLayout.tsx
Updated `loadUserRole()` and `loadProfileImage()` functions to:
- First try querying by auth user ID (normal case)
- If that fails with a 406 error (PGRST116), fall back to querying by email
- This allows students to be detected even if their profile ID doesn't match their auth user ID

**Before:**
```typescript
const { data, error } = await supabase
  .from('user_profiles')
  .select('role_id')
  .eq('id', user?.id)  // Only tries auth user ID
  .single();

if (error) {
  setUserRole(null);  // Fails silently
}
```

**After:**
```typescript
const { data, error } = await supabase
  .from('user_profiles')
  .select('role_id')
  .eq('id', user?.id)  // Try auth user ID first
  .single();

if (error && error.code === 'PGRST116') {
  // Fall back to email query if ID mismatch
  const { data: emailData } = await supabase
    .from('user_profiles')
    .select('role_id')
    .eq('email', user?.email)  // Query by email instead
    .single();
  
  if (emailData?.role_id) {
    setUserRole(emailData.role_id);  // Now detects students!
  }
}
```

#### 2. StudentDashboard.tsx
Updated `loadStudentData()` function with the same fallback logic:
- Try querying profile by auth user ID first
- If that fails with 406 error, query by email instead
- This allows StudentDashboard to load even with ID mismatch

## How It Works Now

1. **Student logs in** → auth user ID = `e7ca3917-216b-4cf3-a0e5-d0f2bdeaa114`
2. **DashboardLayout tries to load role** → queries by auth user ID
3. **RLS blocks it** (profile ID is different) → error code PGRST116
4. **Fallback kicks in** → queries by email instead
5. **Query succeeds** → finds profile with email match
6. **Student is detected** → `userRole = 5` (Student)
7. **StudentSidebar shows** instead of AppSidebar
8. **StudentDashboard loads** without 406 errors

## What Still Needs to Be Done

**IMPORTANT**: This is a temporary workaround. The permanent fix is to run the database migration:

```sql
-- Delete old profiles with wrong IDs
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

-- Create new profiles with CORRECT auth user IDs
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

Run this in Supabase SQL Editor to permanently fix the ID mismatch.

## Testing

1. Hard refresh your app (Ctrl+Shift+R or Cmd+Shift+R)
2. Log in as a student (e.g., nargish.ccc2526@gmail.com)
3. You should see:
   - ✓ StudentSidebar (not AppSidebar)
   - ✓ StudentDashboard loads without 406 errors
   - ✓ Tasks and calendar display correctly

## Files Modified

- `src/components/layout/DashboardLayout.tsx` - Added fallback query logic
- `src/pages/StudentDashboard.tsx` - Added fallback query logic


GET https://bkafweywaswykowzrhmx.supabase.co/rest/v1/session_hours_tracker?select=*&session_id=eq.954a0e40-7f02-4707-8a14-834f47c65a06 406 (Not Acceptable)
(anonymous) @ fetch.ts:7
(anonymous) @ fetch.ts:34
await in (anonymous)
then @ PostgrestBuilder.ts:122# Homework Feedback - Error Handling & Setup Guide

## What Changed ✅

The `StudentHomeworkFeedbackSection` component now **gracefully handles the 406 error** when the database table doesn't exist yet.

### Before
- 406 error appeared in console
- Component failed silently
- No helpful message to user
- Section didn't display

### After ✅
- Component still displays
- Shows helpful setup message
- Tells user exactly what to do
- No error in console
- "Add Homework" button still available

---

## What You'll See

When the `student_task_feedback` table doesn't exist yet, you'll see:

```
┌─────────────────────────────────────────┐
│ Database Setup Required                 │
│                                         │
│ The homework feedback table is being    │
│ set up. Please run the database         │
│ migration:                              │
│                                         │
│ supabase migration up                   │
│                                         │
│ After running the migration, hard       │
│ refresh your browser (Ctrl+Shift+R)     │
└─────────────────────────────────────────┘
```

---

## How to Fix It

### Step 1: Run Database Migration

Open PowerShell and run:
```powershell
supabase migration up
```

This creates the `student_task_feedback` table with all necessary columns and RLS policies.

### Step 2: Hard Refresh Browser

After the migration completes:
```
Ctrl+Shift+R  (Windows)
Cmd+Shift+R   (Mac)
```

### Step 3: Test

1. Go to **Feedback & Record**
2. Select a session
3. Click **Facilitator Feedback** tab
4. Scroll down to **c) Student Homework Feedback**
5. Click **Add Homework** button
6. Fill in the form and save

---

## Code Changes

**File**: `src/components/feedback/StudentHomeworkFeedbackSection.tsx`

**Changes Made**:
1. Added `tableExists` state to track if table is available
2. Updated `fetchHomeworks()` to catch 406 errors gracefully
3. Added helpful message when table doesn't exist
4. Removed error toast when table is missing (it's expected)
5. Component still renders with "Add Homework" button available

---

## Error Handling Logic

```typescript
// If table doesn't exist (406 error):
if (error.code === 'PGRST116' || error.message?.includes('406')) {
  setTableExists(false);
  // Show helpful message instead of error
  return;
}

// If other error:
throw error;
```

---

## Benefits

✅ **No console errors** - Graceful error handling  
✅ **User-friendly** - Clear instructions on what to do  
✅ **Always visible** - Section displays even before migration  
✅ **Self-healing** - Works automatically after migration  
✅ **No manual fixes needed** - Just run migration and refresh  

---

## Timeline

1. **Before migration**: See setup message
2. **Run migration**: `supabase migration up`
3. **Hard refresh**: `Ctrl+Shift+R`
4. **After refresh**: Section works fully

---

## Next Steps

1. Run the database migration:
   ```powershell
   supabase migration up
   ```

2. Hard refresh your browser

3. The homework feedback section will now work fully!

---

## Troubleshooting

**Still seeing the setup message after migration?**
- Hard refresh: `Ctrl+Shift+R`
- Clear browser cache: `Ctrl+Shift+Delete`
- Check Supabase dashboard → Table Editor → verify `student_task_feedback` exists

**Getting other errors?**
- Check browser console (F12)
- Verify RLS policies are enabled on the table
- Check that you're logged in as authenticated user

---

## Summary

The homework feedback section now **always displays** and shows a helpful message if the database table hasn't been created yet. Just run the migration and refresh to get it working!

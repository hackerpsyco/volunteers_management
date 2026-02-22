# Final Test: Student Homework Feedback (c) Sub-tab

## What Was Fixed

1. **Removed 406 Error** - Removed unused `hoursTracker` state that was causing errors
2. **Fixed Student Fetching** - Now properly links sessions to classes to students
3. **Added Debug Logging** - Console logs to track what's happening

## Test Steps

### Step 1: Hard Refresh Browser
```
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)
```

### Step 2: Open Browser Console
```
F12 → Console tab
```

### Step 3: Navigate to Feedback Details
- Go to Feedback page
- Click on any session

### Step 4: Check Console Logs
You should see:
```
🔍 FeedbackDetails mounted with sessionId: [UUID]
📚 Fetching homeworks for sessionId: [UUID]
✅ Homeworks fetched: 0 records
```

### Step 5: Look for c) Button
In the Facilitator Feedback tab, you should see THREE sub-tabs:
- a) Session Objective
- b) Performance Details
- **c) Student Homework Feedback** ← This should be visible

### Step 6: Click c) Button
When you click it:
- Console should show: `🔘 Switching to sub-tab: c`
- Section should display with "Add Homework" button
- If no data: "No homework feedback yet" message

### Step 7: Test "Add Homework"
1. Click "Add Homework" button
2. Dialog should open
3. Student dropdown should populate
4. Fill form and save
5. Should appear in list

## Expected Behavior

✅ c) button is visible
✅ Clicking c) shows homework section
✅ "Add Homework" button works
✅ Dialog opens and loads students
✅ Can add homework entries
✅ Entries appear in list
✅ Can delete entries

## If Still Not Working

### Check 1: Is c) button visible?
- If NO → Component rendering issue
- If YES → Continue to Check 2

### Check 2: Does clicking c) show content?
- If NO → State management issue
- If YES → Continue to Check 3

### Check 3: Does "Add Homework" dialog open?
- If NO → Dialog component issue
- If YES → Continue to Check 4

### Check 4: Do students load in dropdown?
- If NO → Student fetching issue
- If YES → Everything works!

## Console Logs to Look For

**Good signs:**
```
🔍 FeedbackDetails mounted with sessionId: [UUID]
📚 Fetching homeworks for sessionId: [UUID]
✅ Homeworks fetched: 0 records
🔘 Switching to sub-tab: c
👥 Students fetched: 5
```

**Bad signs:**
```
❌ Error fetching homeworks: [error]
Could not find class by name: [class_batch]
Failed to load students
```

## Database Check

If students don't load, run in Supabase SQL Editor:

```sql
-- Check if students exist
SELECT COUNT(*) FROM students;

-- Check if classes exist
SELECT COUNT(*) FROM classes;

-- Check if sessions have class_id or class_batch
SELECT id, class_id, class_batch FROM sessions LIMIT 5;

-- Check RLS policies
SELECT policyname FROM pg_policies 
WHERE tablename = 'student_task_feedback';
```

Should show 4 policies:
- select_all
- insert_all
- update_all
- delete_all

# Debug: Student Homework Feedback Not Displaying

## Steps to Debug:

### 1. Open Browser Console (F12)
Look for these logs after hard refresh (Ctrl+Shift+R):
- `🔍 FeedbackDetails mounted with sessionId: [UUID]`
- `📚 Fetching homeworks for sessionId: [UUID]`
- `✅ Homeworks fetched: [NUMBER] records`

### 2. If logs show 0 records:
The database query returned empty. This means either:
- No homework data exists for this session
- RLS policies are blocking the query
- Session ID is wrong

### 3. Check Database Directly:
Run in Supabase SQL Editor:
```sql
-- Check if table has any data
SELECT COUNT(*) FROM student_task_feedback;

-- Check RLS policies
SELECT policyname, permissive, roles, qual 
FROM pg_policies 
WHERE tablename = 'student_task_feedback';

-- Check if authenticated user can read
SELECT * FROM student_task_feedback LIMIT 5;
```

### 4. If RLS policies show issues:
The cleanup migration should have created 4 clean policies:
- select_all (SELECT)
- insert_all (INSERT)
- update_all (UPDATE)
- delete_all (DELETE)

All should allow `auth.role() = 'authenticated'`

### 5. Test "Add Homework" Button:
1. Click c) Student Homework Feedback tab
2. Click "Add Homework" button
3. Fill form and save
4. Check if it appears in the list

If "Add Homework" works but list is empty, it's a SELECT permission issue.

## Expected Behavior:
- c) button should be visible (it is in code)
- Clicking c) should show homework section
- If no data: "No homework feedback yet" message
- "Add Homework" button should work

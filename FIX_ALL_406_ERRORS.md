# Fix All 406 Errors - Complete Guide

You're getting 406 errors from two different sources. This guide fixes both.

## Error 1: session_hours_tracker 406 Error

**Status**: ✅ FIXED in code

The `fetchHoursTracker` function was using `.single()` which causes issues when no row exists. This has been fixed to use `.limit(1)` instead.

**What was changed:**
- File: `src/pages/FeedbackDetails.tsx`
- Changed from: `.single()` (throws error if no row)
- Changed to: `.limit(1)` (returns empty array if no row)

**No action needed** - this is already fixed in your code.

---

## Error 2: student_task_feedback 406 Error

**Status**: ⏳ NEEDS DATABASE MIGRATION

The `student_task_feedback` table doesn't exist yet. This is why the homework feedback section shows 406 errors.

### Step 1: Run the Database Migration

**Option A: Using Supabase CLI (Recommended)**

Open PowerShell and run:
```powershell
supabase migration up
```

**Option B: Manual SQL in Supabase Dashboard**

1. Go to your Supabase project: https://app.supabase.com
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste this SQL:

```sql
-- Create student_task_feedback table
CREATE TABLE IF NOT EXISTS student_task_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  feedback_type VARCHAR(50) NOT NULL,
  task_name VARCHAR(255) NOT NULL,
  task_description TEXT,
  deadline DATE,
  submission_link VARCHAR(500),
  feedback_notes TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_student_task_feedback_session ON student_task_feedback(session_id);
CREATE INDEX idx_student_task_feedback_student ON student_task_feedback(student_id);
CREATE INDEX idx_student_task_feedback_status ON student_task_feedback(status);

-- Enable RLS
ALTER TABLE student_task_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Enable read for authenticated users" ON student_task_feedback
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON student_task_feedback
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON student_task_feedback
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON student_task_feedback
  FOR DELETE USING (auth.role() = 'authenticated');
```

5. Click **Run** button
6. Wait for it to complete (should show "Success")

### Step 2: Verify the Migration

1. Go to Supabase dashboard
2. Click **Table Editor** in the left sidebar
3. Look for `student_task_feedback` in the table list
4. Click on it to verify it was created
5. Click **RLS** tab and verify all 4 policies are enabled (green toggles)

### Step 3: Reload Your Application

1. Hard refresh your browser: **Ctrl+Shift+R** (Windows)
2. Or restart your dev server if running locally

### Step 4: Test the Feature

1. Go to **Feedback & Record**
2. Select a session
3. Click **Option A: Session Details & Performance**
4. Click **c) Student Homework Feedback**
5. Click **Add Homework** button
6. The dialog should now open without errors

---

## Troubleshooting

### Still Getting 406 Errors?

**Check 1: Verify table exists**
- Go to Supabase SQL Editor
- Run: `SELECT * FROM student_task_feedback LIMIT 1;`
- If you get "relation does not exist", the table wasn't created

**Check 2: Verify RLS policies**
- Go to Supabase Table Editor
- Click on `student_task_feedback` table
- Click **RLS** tab
- All 4 policies should have green toggles (enabled)

**Check 3: Check browser console**
- Press F12 to open developer tools
- Go to **Console** tab
- Look for error messages
- Share the exact error for help

**Check 4: Clear browser cache**
- Hard refresh: **Ctrl+Shift+R**
- Or clear cache: **Ctrl+Shift+Delete**

---

## Summary of Changes

| Component | Issue | Fix |
|-----------|-------|-----|
| `FeedbackDetails.tsx` | `.single()` throws 406 on no rows | Changed to `.limit(1)` ✅ |
| `student_task_feedback` table | Table doesn't exist | Run migration ⏳ |

---

## Next Steps

1. ✅ Code fix is already applied
2. ⏳ Run the database migration (Option A or B above)
3. ✅ Hard refresh browser
4. ✅ Test the homework feedback feature

Let me know if you hit any issues!

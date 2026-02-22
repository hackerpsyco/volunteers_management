# Student Homework Feedback Integration

## Structure

The homework feedback now appears in the **Session Feedback** page under:

```
Option A: Session Details & Performance
├── a) Session Objective
├── b) Performance Details
│   ├── Facilitator Feedback (table)
│   ├── Student Performance Records (table)
│   └── c) Student Homework & Tasks ← NEW
```

## Components

### 1. StudentHomeworkFeedbackSection
**File:** `src/components/feedback/StudentHomeworkFeedbackSection.tsx`

Displays:
- Card with "Add Homework" button
- List of all homework/tasks for the session
- Each homework shows:
  - Student name
  - Task name
  - Task type (homework, assignment, task, etc.)
  - Deadline
  - Status badge (pending, submitted, reviewed, completed)
  - Feedback notes
  - Submission link (clickable)
  - Delete button

### 2. AddStudentTaskFeedbackDialog
**File:** `src/components/feedback/AddStudentTaskFeedbackDialog.tsx`

Dialog form with:
- Student dropdown (auto-loaded from session's class)
- Feedback type selector
- Task name input
- Description textarea
- Deadline date picker
- Submission link input
- Feedback notes textarea
- Save button

## Database

**Table:** `student_task_feedback`

```sql
- id (UUID, PK)
- session_id (UUID, FK)
- student_id (UUID, FK)
- feedback_type (VARCHAR) - task, homework, assignment, deadline, project
- task_name (VARCHAR)
- task_description (TEXT)
- deadline (DATE)
- submission_link (VARCHAR)
- feedback_notes (TEXT)
- status (VARCHAR) - pending, submitted, reviewed, completed
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## How It Works

1. **View Session Feedback**
   - Go to Feedback & Record → Select a session
   - Click on "Option A: Session Details & Performance"

2. **See Homework Section**
   - Scroll down past "Student Performance Records"
   - See "Student Homework & Tasks" card

3. **Add Homework**
   - Click "Add Homework" button
   - Dialog opens
   - Select student from dropdown
   - Fill in task details
   - Click "Save Homework"

4. **View Homework**
   - Homework appears in the list
   - Shows all details
   - Can click submission link to view student's work
   - Can delete if needed

## Status Meanings

- **pending** - Task assigned, waiting for submission
- **submitted** - Student submitted work
- **reviewed** - Coordinator reviewed the submission
- **completed** - Task marked as complete

## Integration Complete

✅ Database migration created
✅ Dialog component created
✅ Display component created
✅ Integrated into FeedbackDetails page
✅ Shows in Option A under Performance Details

## Next Steps

1. Run the database migration:
   ```bash
   supabase migration up
   ```

2. Test the feature:
   - Go to Session Feedback
   - Select Option A
   - Scroll to "Student Homework & Tasks"
   - Click "Add Homework"
   - Fill in details and save

3. Verify data appears in the list


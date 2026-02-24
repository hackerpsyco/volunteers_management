# Homework & Task Assignment - Assign to All Students

## Issue
In the "Add Student Homework & Tasks" section, users had to select individual students one by one to assign tasks. This was inefficient when the same task needed to be assigned to all students in a class.

## Solution
Removed the student dropdown and modified the system to automatically assign tasks to ALL students in the class at once.

## Changes Made

### 1. Updated SessionRecording.tsx

#### Removed Student Dropdown
- Deleted the "Student Name" dropdown field from the homework form
- Users no longer need to select individual students

#### Updated Form Fields (in order)
1. **Task Name** * (required)
2. **Task Type** (homework, assignment, project, etc.)
3. **Deadline** (date picker)
4. **Task Description** (text area)

#### Modified handleSaveHomework Function
- **Before**: Saved task for one selected student
- **After**: Saves task for ALL students in the class

```typescript
// Now creates an array of records, one for each student
const homeworkRecords = students.map(student => ({
  session_id: sessionId,
  student_id: student.id,  // Each student gets their own record
  feedback_type: newHomework.task_type || 'homework',
  task_name: newHomework.task_name,
  task_description: newHomework.task_description || null,
  deadline: newHomework.deadline || null,
  submission_link: newHomework.submission_link || null,
  feedback_notes: newHomework.feedback_notes || null,
  status: 'pending',
}));

// Insert all records at once
const { error } = await supabase
  .from('student_task_feedback')
  .insert(homeworkRecords);
```

## Workflow

1. **Create Task**: Fill in task details (name, type, deadline, description)
2. **Assign to All**: Click "Save Homework Feedback"
3. **Confirmation**: Toast shows "Homework assigned to X students"
4. **Result**: Task appears in homework records table for all students

## Benefits

✅ **Efficiency**: Assign one task to entire class in one action
✅ **Consistency**: All students get the same task with same deadline
✅ **Simplicity**: Cleaner UI without student dropdown
✅ **Scalability**: Works for any class size

## Example

**Before**: 
- Select Student 1 → Add Task → Select Student 2 → Add Task → ... (repeat for each student)

**After**:
- Fill task details → Click "Save Homework Feedback" → Task assigned to all students

## Database Impact

- Each task creates N records in `student_task_feedback` table (where N = number of students)
- Each student can track their own submission status
- Facilitators can see all submissions in one view

## Notes

- Students are fetched from the session's class batch
- If no students are found, an error message is shown
- The form clears after successful assignment
- All students get the same deadline and task details

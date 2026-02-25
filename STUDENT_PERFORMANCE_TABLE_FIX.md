# Student Performance Table with Present/Absent Status

## Changes Made

Updated the "Add Student Performance" section in SessionRecording to use a table-based layout with:

### New Features
1. **Checkbox Selection** - Select students to add performance records
2. **Present/Absent Status** - Dropdown to mark student as Present or Absent
3. **Questions Asked** - Number input field for each selected student
4. **Performance Rating** - Number input (1-10) for each selected student
5. **Comment** - Text field for performance comments
6. **Add Button** - Single button to add the selected student with all data

### Table Columns
| Select | Student Name | Status | Questions | Rating (1-10) | Comment |
|--------|--------------|--------|-----------|---------------|---------|
| ☑️ | Name (ID) | Present/Absent | Number | 1-10 | Text |

### Workflow

1. **View all students** - All class students displayed in a table
2. **Select a student** - Check the checkbox next to the student
3. **Enter data** - Form fields appear for that student:
   - Select Present or Absent status
   - Enter number of questions asked
   - Enter performance rating (1-10)
   - Add optional comment
4. **Add student** - Click "Add Student" button to save the record
5. **Repeat** - Select another student and repeat

### Benefits

✅ **All data in one place** - See student name, status, questions, and rating together
✅ **Clear status tracking** - Present/Absent dropdown for attendance
✅ **Efficient data entry** - All fields visible for selected student
✅ **Easy to use** - Checkbox to select, form fields appear inline
✅ **Single add button** - Add one student at a time with all data

### Technical Implementation

- Students loaded from database based on session's class_batch
- Checkbox state controls visibility of form fields
- Form fields update newStudent state directly
- Single "Add Student" button saves the record
- Table format for clean, organized display
- Responsive design with horizontal scroll on mobile

### Related Components
- `SessionRecording.tsx` - Main component with the updated form
- `FeedbackDetails.tsx` - Displays saved student performance records
- `StudentPerformance.tsx` - Alternative performance tracking page

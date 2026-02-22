# Student Task Feedback Feature Setup

## Overview

This feature allows coordinators to add task/homework feedback for students within a session. The feedback is linked to students from the session's class.

## Components Created

### 1. Database Table
**File:** `supabase/migrations/20260221_create_student_task_feedback.sql`

Creates `student_task_feedback` table with:
- `id` - UUID primary key
- `session_id` - Links to session
- `student_id` - Links to student
- `feedback_type` - task, homework, assignment, deadline, project
- `task_name` - Name of the task
- `task_description` - Detailed description
- `deadline` - Due date
- `submission_link` - URL for submission
- `feedback_notes` - Additional notes
- `status` - pending, submitted, reviewed, completed
- `created_at`, `updated_at` - Timestamps

### 2. Dialog Component
**File:** `src/components/feedback/AddStudentTaskFeedbackDialog.tsx`

Features:
- Select student from session's class (auto-loaded)
- Choose feedback type (task, homework, assignment, etc.)
- Enter task name (required)
- Add description, deadline, submission link
- Add feedback notes
- Saves to database

### 3. List Component
**File:** `src/components/feedback/StudentTaskFeedbackList.tsx`

Features:
- Displays all task feedbacks for a session
- Shows student name, task, type, deadline, status
- Clickable submission links
- Delete functionality
- Color-coded status badges

## Integration Steps

### Step 1: Run Migration

```bash
supabase migration up
```

Or manually run the SQL in Supabase dashboard.

### Step 2: Update FeedbackDetails Page

Add to imports:
```typescript
import { AddStudentTaskFeedbackDialog } from '@/components/feedback/AddStudentTaskFeedbackDialog';
import { StudentTaskFeedbackList } from '@/components/feedback/StudentTaskFeedbackList';
```

Add state:
```typescript
const [isAddFeedbackOpen, setIsAddFeedbackOpen] = useState(false);
const [refreshKey, setRefreshKey] = useState(0);
```

Add to coordinator tab (Option B):
```typescript
{activeTab === 'coordinator' && (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between">
      <CardTitle>Student Task Feedback</CardTitle>
      <Button 
        onClick={() => setIsAddFeedbackOpen(true)}
        size="sm"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Feedback
      </Button>
    </CardHeader>
    <CardContent>
      <StudentTaskFeedbackList 
        sessionId={sessionId!}
        onRefresh={() => setRefreshKey(prev => prev + 1)}
      />
    </CardContent>
  </Card>
)}
```

Add dialog:
```typescript
<AddStudentTaskFeedbackDialog
  isOpen={isAddFeedbackOpen}
  onClose={() => setIsAddFeedbackOpen(false)}
  sessionId={sessionId!}
  onSuccess={() => {
    setIsAddFeedbackOpen(false);
    setRefreshKey(prev => prev + 1);
  }}
/>
```

### Step 3: Update Types (if needed)

Add to `src/integrations/supabase/types.ts`:
```typescript
export interface StudentTaskFeedback {
  id: string;
  session_id: string;
  student_id: string;
  feedback_type: 'task' | 'homework' | 'assignment' | 'deadline' | 'project';
  task_name: string;
  task_description?: string;
  deadline?: string;
  submission_link?: string;
  feedback_notes?: string;
  status: 'pending' | 'submitted' | 'reviewed' | 'completed';
  created_at: string;
  updated_at: string;
}
```

## Usage Flow

1. **Coordinator** opens Session Feedback page
2. Clicks on **Option B: Feedback & Closure**
3. Clicks **"Add Feedback"** button
4. Dialog opens with:
   - Student dropdown (auto-populated from session's class)
   - Feedback type selector
   - Task name input
   - Description textarea
   - Deadline date picker
   - Submission link input
   - Feedback notes textarea
5. Clicks **"Save Feedback"**
6. Feedback appears in the list below
7. Can click submission link to view student's work
8. Can delete feedback if needed

## Database Schema

```sql
student_task_feedback
├── id (UUID, PK)
├── session_id (UUID, FK → sessions)
├── student_id (UUID, FK → students)
├── feedback_type (VARCHAR)
├── task_name (VARCHAR)
├── task_description (TEXT)
├── deadline (DATE)
├── submission_link (VARCHAR)
├── feedback_notes (TEXT)
├── status (VARCHAR)
├── created_by (UUID, FK → auth.users)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

## Status Values

- **pending** - Task assigned, awaiting submission
- **submitted** - Student submitted work
- **reviewed** - Coordinator reviewed submission
- **completed** - Task marked as complete

## Next Steps

1. Run the migration
2. Update FeedbackDetails.tsx with the new components
3. Test the dialog by adding a task feedback
4. Verify data appears in the list
5. Test submission link functionality


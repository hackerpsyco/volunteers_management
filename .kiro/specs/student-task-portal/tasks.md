# Student Task Portal - Implementation Plan

- [x] 1. Set up Student role and authentication


  - Add role_id = 5 for Student in roles table (if not exists)
  - Create migration to add student role
  - Update AuthContext to recognize student role
  - _Requirements: 1, 4_



- [ ] 2. Create StudentDashboard layout component
  - Build simplified layout that hides sidebar and dashboard for students
  - Create header with student name and logout button

  - Add calendar container and task list container
  - _Requirements: 1_

- [ ] 3. Create StudentCalendar component
  - Implement calendar view showing current month
  - Add navigation for previous/next months
  - Display task deadlines as calendar events

  - Display class session meetings as calendar events
  - Use different colors/icons for tasks vs meetings
  - _Requirements: 1, 1.5_

- [x] 4. Fetch student's tasks from database

  - Query student_task_feedback table for current student
  - Filter by student_id matching logged-in student
  - Order by deadline ascending
  - _Requirements: 1, 4_


- [ ] 5. Fetch student's class sessions
  - Query sessions table for student's class
  - Filter for current and future sessions only
  - Order by session_date ascending
  - _Requirements: 1.5_


- [ ] 6. Create TaskCard component
  - Display task name, deadline, type, status
  - Show status badge (pending, submitted, reviewed, completed)
  - Add click handler to show task details
  - _Requirements: 1_


- [ ] 7. Create TaskDetailsModal component
  - Display full task information (name, description, deadline, feedback notes)
  - Show current status with timestamp
  - Display submission link if available
  - Show "Submit Work" button if status is pending

  - _Requirements: 2_

- [ ] 8. Create TaskSubmissionForm component
  - Form with submission link (URL) field
  - Form with notes/comments field
  - Submit button to save submission
  - Show success/error messages
  - _Requirements: 3_

- [x] 9. Implement task submission logic


  - Create function to update task status to "submitted"
  - Save submission link and notes
  - Save submission timestamp
  - Refresh task list after submission



  - _Requirements: 3, 5_

- [ ] 10. Add role-based routing
  - Update App.tsx to redirect students to StudentDashboard
  - Hide all other routes for student role

  - Add route guard to prevent unauthorized access
  - _Requirements: 4_

- [ ] 11. Update DashboardLayout to hide elements for students
  - Hide sidebar navigation for student role

  - Hide dashboard quick actions for student role
  - Show only StudentDashboard for students
  - _Requirements: 1_

- [ ] 12. Create StudentDashboard page
  - Combine StudentCalendar and TaskCard components

  - Add task list view below calendar
  - Add filters (all tasks, pending, submitted, completed)
  - _Requirements: 1, 2_

- [x] 13. Add session meeting details display


  - Show session name, date, time, facilitator
  - Display meeting link if available
  - Show session status (upcoming, ongoing, completed)
  - _Requirements: 1.5_

- [ ] 14. Implement task status tracking
  - Display status changes with timestamps
  - Show when task was submitted
  - Show when task was reviewed
  - Show completion date if applicable
  - _Requirements: 5_

- [ ] 15. Add error handling and loading states
  - Show loading spinner while fetching tasks
  - Show error messages if fetch fails
  - Handle empty state (no tasks)
  - _Requirements: All_

- [ ] 16. Test student access control
  - Verify students can only see their own tasks
  - Verify students cannot access other student's tasks
  - Verify non-students cannot access student dashboard
  - _Requirements: 4_


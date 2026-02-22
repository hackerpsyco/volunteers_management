# Student Task Portal - Requirements Document

## Introduction

The Student Task Portal is a dedicated interface for students to view their assigned tasks and deadlines, and submit their work. Students will have a new role in the system with access to a calendar view of their tasks and a task submission interface. This feature enables students to track their homework and assignments while allowing facilitators to manage task feedback.

## Glossary

- **Student**: A user with role_id = 5, enrolled in a class
- **Task**: A homework or assignment created by facilitators in session feedback (from student_task_feedback table)
- **Deadline**: The due date for a task
- **Task Status**: pending, submitted, reviewed, completed
- **Session Record**: A session feedback record containing tasks (option A and C)
- **Task Submission**: A student's submission of completed work with optional link/notes

## Requirements

### Requirement 1

**User Story:** As a student, I want to view all my assigned tasks and deadlines in a calendar view, so that I can track what work I need to complete.

#### Acceptance Criteria

1. WHEN a student logs in THEN the system SHALL hide all sidebar navigation options and dashboard quick actions
2. WHEN a student logs in THEN the system SHALL display only a simplified layout with the Tasks interface
3. WHEN the Student Tasks page loads THEN the system SHALL display a calendar view showing all tasks assigned to that student
4. WHEN viewing the calendar THEN the system SHALL show task deadlines as events on the calendar
5. WHEN a student views the task list THEN the system SHALL display task name, deadline, task type, and status for each task

### Requirement 1.5

**User Story:** As a student, I want to see my class session meetings on the calendar, so that I know when my classes are scheduled.

#### Acceptance Criteria

1. WHEN a student views the calendar THEN the system SHALL display all current and future session meetings for their class
2. WHEN viewing the calendar THEN the system SHALL distinguish between task deadlines and session meetings with different visual indicators
3. WHEN a student clicks on a session meeting THEN the system SHALL display session details (date, time, facilitator, meeting link if available)
4. WHEN viewing past sessions THEN the system SHALL display them in a different style (grayed out or archived)

### Requirement 2

**User Story:** As a student, I want to see detailed information about each task, so that I understand what work is expected of me.

#### Acceptance Criteria

1. WHEN a student clicks on a task in the calendar or list THEN the system SHALL display task details including name, description, deadline, and feedback notes
2. WHEN viewing task details THEN the system SHALL show the current status (pending, submitted, reviewed, completed)
3. WHEN a task has a submission link THEN the system SHALL display a link to view the submission
4. WHEN viewing task details THEN the system SHALL display any feedback notes from the facilitator

### Requirement 3

**User Story:** As a student, I want to submit my completed work for a task, so that I can provide evidence of completion.

#### Acceptance Criteria

1. WHEN a student views a task with pending status THEN the system SHALL display a "Submit Work" button
2. WHEN a student clicks Submit Work THEN the system SHALL open a submission form
3. WHEN submitting work THEN the system SHALL require a submission link (URL) or notes field
4. WHEN a student submits work THEN the system SHALL update the task status to "submitted"
5. WHEN work is submitted THEN the system SHALL save the submission timestamp and student's submission details

### Requirement 4

**User Story:** As a student, I want to see only my own tasks, so that I don't see other students' work.

#### Acceptance Criteria

1. WHEN a student views their tasks THEN the system SHALL only display tasks where student_id matches the logged-in student
2. WHEN a student accesses the task portal THEN the system SHALL verify the student role before displaying any tasks
3. WHEN a student tries to access another student's tasks THEN the system SHALL prevent access and show an error message

### Requirement 5

**User Story:** As a student, I want to track the progress of my submitted work, so that I know if my work has been reviewed.

#### Acceptance Criteria

1. WHEN a task status changes from pending to submitted THEN the system SHALL update the display immediately
2. WHEN a facilitator reviews work THEN the system SHALL update the task status to "reviewed"
3. WHEN a task is marked complete THEN the system SHALL display a completion badge or indicator
4. WHEN viewing task history THEN the system SHALL show all status changes with timestamps


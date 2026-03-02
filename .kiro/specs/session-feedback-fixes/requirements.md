# Requirements Document: Session Feedback Recording Fixes

## Introduction

The Session Recording feedback system has three critical issues preventing proper data entry and retrieval:
1. Performance ratings cannot be saved (validation rejects 0 values)
2. Student performance records lack proper database relationships
3. Session list doesn't filter by date range (past/current/future)

## Glossary

- **Session Recording**: A feedback form for recording session details, student performance, and hours tracking
- **Student Performance**: Individual student feedback including rating (1-10), questions asked, and comments
- **Performance Rating**: Numeric score from 1-10 evaluating student performance
- **Session Hours Tracker**: Record of volunteer hours spent on planning, preparation, session, and reflection
- **Feedback Record**: Complete session feedback including all sub-sections (performance details, homework, hours)

## Requirements

### Requirement 1: Fix Performance Rating Validation

**User Story:** As a facilitator, I want to save student performance ratings from 1-10, so that I can accurately record student engagement and performance.

#### Acceptance Criteria

1. WHEN a facilitator enters a performance rating between 1-10 THEN the system SHALL accept and save the value to the database
2. WHEN a facilitator attempts to enter a rating of 0 THEN the system SHALL prevent the save and show an error message
3. WHEN a facilitator saves a performance rating THEN the system SHALL persist the value immediately and reflect it in the UI
4. WHEN a facilitator loads a session with existing performance ratings THEN the system SHALL display all saved ratings correctly

### Requirement 2: Add Student ID to Performance Records

**User Story:** As a system administrator, I want student performance records to reference student IDs, so that records are unambiguous and properly linked to student data.

#### Acceptance Criteria

1. WHEN a new student performance record is created THEN the system SHALL store both student_name and student_id
2. WHEN querying student performance THEN the system SHALL return records linked to specific student IDs, not just names
3. WHEN a student performance record is saved THEN the system SHALL validate that the student_id exists in the students table
4. WHEN displaying student performance THEN the system SHALL show student information from the linked student record

### Requirement 3: Filter Sessions by Date Range

**User Story:** As a facilitator, I want to see all sessions (past, current, and future), so that I can access feedback for any session regardless of date.

#### Acceptance Criteria

1. WHEN the session list loads THEN the system SHALL display all sessions without date filtering
2. WHEN a facilitator navigates to a session THEN the system SHALL load the session regardless of whether it is past, current, or future
3. WHEN the session recording page loads THEN the system SHALL fetch and display the session data correctly for any date
4. WHEN a facilitator saves feedback THEN the system SHALL persist the data regardless of the session date


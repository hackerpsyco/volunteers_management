# Requirements Document

## Introduction

The session scheduling system has a timezone handling bug where sessions scheduled for a specific date (e.g., February 16th) are appearing on the wrong date in the calendar (e.g., February 17th). Additionally, duplicate sessions are appearing. This is caused by inconsistent date handling between session creation and calendar display, particularly when dealing with timezones.

## Glossary

- **Session**: A scheduled volunteer training or guest speaker event
- **Session Date**: The date on which a session is scheduled (stored as YYYY-MM-DD)
- **Timezone**: The local timezone of the user's system (e.g., IST, UTC)
- **Date Formatting**: Converting Date objects to strings for storage and display
- **Calendar Display**: The visual representation of sessions on a monthly calendar view

## Requirements

### Requirement 1

**User Story:** As a coordinator, I want sessions to appear on the calendar on the exact date I scheduled them, so that I can accurately track and plan sessions.

#### Acceptance Criteria

1. WHEN a coordinator schedules a session for a specific date THEN the session SHALL appear on that exact date in the calendar view
2. WHEN a session is created with a date input THEN the session_date field SHALL store the date in YYYY-MM-DD format without timezone conversion
3. WHEN the calendar displays sessions THEN all sessions for a given date SHALL be retrieved using consistent date comparison logic
4. WHEN a session is scheduled in any timezone THEN the date SHALL remain consistent regardless of the user's local timezone offset

### Requirement 2

**User Story:** As a coordinator, I want to see each session only once in the calendar, so that I can avoid confusion about duplicate sessions.

#### Acceptance Criteria

1. WHEN sessions are fetched from the database THEN duplicate sessions SHALL not appear in the calendar
2. WHEN a session is created THEN only one record SHALL be inserted into the database
3. WHEN the calendar filters sessions by date THEN each session SHALL appear exactly once per date

# Requirements Document: Coordinator Meeting Recording Access

## Introduction

Coordinators need the ability to start and access recordings during volunteer training sessions conducted via Google Meet. Currently, recording functionality is unavailable to coordinators because the meeting organizer (service account) hasn't granted recording permissions. This feature enables coordinators to record sessions and access those recordings for review and archival purposes.

## Glossary

- **Coordinator**: A user who manages and oversees volunteer training sessions
- **Google Meet**: Video conferencing platform used for sessions
- **Recording**: Video capture of a Google Meet session stored in Google Drive
- **Session**: A scheduled volunteer training event with a meeting link
- **Meeting Organizer**: The service account that creates Google Calendar events and Meet conferences
- **Recording Permission**: Authorization level that allows a participant to start/stop recordings

## Requirements

### Requirement 1

**User Story:** As a coordinator, I want to start a recording when a session begins, so that I can capture the session for future reference and review.

#### Acceptance Criteria

1. WHEN a coordinator joins a meeting via the meeting link THEN the system SHALL display a "Start Recording" button in the meeting interface
2. WHEN a coordinator clicks "Start Recording" THEN the system SHALL initiate a Google Meet recording and display confirmation
3. WHEN a recording is started THEN the system SHALL store the recording metadata (start time, coordinator name) in the database
4. IF a coordinator attempts to start a recording when one is already active THEN the system SHALL prevent duplicate recordings and show an error message

### Requirement 2

**User Story:** As a coordinator, I want to access recordings of past sessions, so that I can review session content and share it with stakeholders.

#### Acceptance Criteria

1. WHEN a coordinator navigates to the session details page THEN the system SHALL display a "Recordings" section if recordings exist
2. WHEN a recording is available THEN the system SHALL display the recording link, date, duration, and coordinator who recorded it
3. WHEN a coordinator clicks on a recording link THEN the system SHALL open the recording in a new tab with proper access permissions
4. WHEN multiple recordings exist for a session THEN the system SHALL list them in chronological order with the most recent first

### Requirement 3

**User Story:** As a system administrator, I want to ensure only authorized coordinators can access recordings, so that sensitive session content remains secure.

#### Acceptance Criteria

1. WHEN a coordinator attempts to access a recording THEN the system SHALL verify they have permission (coordinator of that session or admin)
2. IF a user without permission attempts to access a recording THEN the system SHALL deny access and log the attempt
3. WHEN a recording is created THEN the system SHALL set appropriate Google Drive sharing permissions for authorized coordinators only
4. WHEN a session is deleted THEN the system SHALL remove or archive associated recordings

### Requirement 4

**User Story:** As a coordinator, I want to stop a recording when the session ends, so that I don't capture unnecessary content after the session concludes.

#### Acceptance Criteria

1. WHEN a recording is active THEN the system SHALL display a "Stop Recording" button in the meeting interface
2. WHEN a coordinator clicks "Stop Recording" THEN the system SHALL stop the Google Meet recording
3. WHEN a recording is stopped THEN the system SHALL update the recording metadata (end time, duration) in the database
4. WHEN a recording stops THEN the system SHALL automatically save the recording to Google Drive and generate an accessible link


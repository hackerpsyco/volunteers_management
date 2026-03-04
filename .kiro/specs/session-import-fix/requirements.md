# Requirements Document: Session Import Fix

## Introduction

The volunteer management system needs to correctly import past session data from the Excel file "WES Volunteer Management (6).xlsx". Currently, the import process fails to handle:
1. Excel serial date numbers (e.g., 45603) which need conversion to YYYY-MM-DD format
2. Volunteer names that are stored as email addresses or mixed formats (e.g., "srinathv21@gmail.com", "Shalini Tiwari", "zaid464712@gmail.com/Niharika Mishra")
3. The "New Past Session_03.03.2026" sheet which contains 117 rows of historical session data
4. Column name mappings that don't match the current auto-detection logic

## Glossary

- **Excel Serial Date**: A numeric value representing days since January 1, 1900 (e.g., 45603 = 2024-11-15)
- **Session By**: The Excel column containing volunteer/facilitator names or email addresses
- **Session on**: The Excel column containing session dates as Excel serial numbers
- **Volunteer Name**: The normalized name of the person conducting the session, extracted from "Session By"
- **Import Dialog**: The React component that handles file upload and data mapping
- **Column Mapping**: The process of matching Excel columns to database fields

## Requirements

### Requirement 1: Parse Excel Serial Dates Correctly

**User Story:** As a system administrator, I want past session dates to be correctly converted from Excel serial format, so that historical sessions are recorded with accurate dates.

#### Acceptance Criteria

1. WHEN an Excel file contains dates as serial numbers (e.g., 45603), THE system SHALL convert them to YYYY-MM-DD format (e.g., 2024-11-15)
2. WHEN a date serial number is processed, THE system SHALL account for the Excel epoch (January 1, 1900) and timezone considerations
3. WHEN an invalid or missing date is encountered, THE system SHALL use the current date as a fallback
4. WHEN dates are converted, THE system SHALL validate the resulting date is in valid YYYY-MM-DD format before database insertion

### Requirement 2: Extract and Normalize Volunteer Names

**User Story:** As a data manager, I want volunteer names to be properly extracted from mixed formats (emails, names, combined formats), so that the database contains clean, usable volunteer identifiers.

#### Acceptance Criteria

1. WHEN a "Session By" field contains an email address (e.g., "srinathv21@gmail.com"), THE system SHALL extract the name portion or use the email as the volunteer name
2. WHEN a "Session By" field contains a plain name (e.g., "Shalini Tiwari"), THE system SHALL use it as-is
3. WHEN a "Session By" field contains a combined format (e.g., "zaid464712@gmail.com/Niharika Mishra"), THE system SHALL extract the name portion after the slash
4. WHEN a "Session By" field contains mixed data (e.g., "anusha 03/03/2025"), THE system SHALL extract only the name portion, removing date information
5. WHEN a volunteer name is extracted, THE system SHALL trim whitespace and normalize the value

### Requirement 3: Auto-Detect Column Mappings for Past Session Sheet

**User Story:** As a user, I want the import dialog to automatically recognize the "New Past Session_03.03.2026" sheet columns, so that I don't need to manually map each column.

#### Acceptance Criteria

1. WHEN the import dialog loads the "New Past Session_03.03.2026" sheet, THE system SHALL auto-map "Session on" to "session_date"
2. WHEN the import dialog loads the sheet, THE system SHALL auto-map "Session By" to "volunteer_name"
3. WHEN the import dialog loads the sheet, THE system SHALL auto-map "Session Status" to "status"
4. WHEN the import dialog loads the sheet, THE system SHALL auto-map "Topics Covered" to "topics_covered"
5. WHEN the import dialog loads the sheet, THE system SHALL auto-map "Content Category" to "content_category"
6. WHEN the import dialog loads the sheet, THE system SHALL auto-map "Module No & Module Name" to "module_name"
7. WHEN the import dialog loads the sheet, THE system SHALL auto-map "Videos" to "videos"
8. WHEN the import dialog loads the sheet, THE system SHALL auto-map "QUIZ/CONTENT PPT" to "quiz_content_ppt"

### Requirement 4: Import All 117 Past Sessions Successfully

**User Story:** As an administrator, I want all 117 past sessions from the Excel file to import successfully, so that the system has complete historical data.

#### Acceptance Criteria

1. WHEN importing the "New Past Session_03.03.2026" sheet, THE system SHALL process all 117 rows without skipping valid data
2. WHEN a row contains valid data (title/topics, date, volunteer name), THE system SHALL import it to the database
3. WHEN import completes, THE system SHALL display the count of successfully imported sessions
4. WHEN import encounters errors, THE system SHALL log specific row numbers and error reasons for debugging
5. WHEN all sessions are imported, THE system SHALL verify that volunteer names appear correctly in the Sessions page filters

### Requirement 5: Handle Status Value Normalization

**User Story:** As a data analyst, I want session status values to be normalized consistently, so that filtering and reporting work correctly.

#### Acceptance Criteria

1. WHEN a status value is "Completed", THE system SHALL normalize it to "completed"
2. WHEN a status value is "Pending", THE system SHALL normalize it to "pending"
3. WHEN a status value is "Committed", THE system SHALL normalize it to "committed"
4. WHEN a status value is empty or missing, THE system SHALL default to "completed" for past sessions
5. WHEN status values are normalized, THE system SHALL preserve case-insensitive matching


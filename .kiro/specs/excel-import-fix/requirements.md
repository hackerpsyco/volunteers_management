# Requirements Document: Excel Import Data Fix

## Introduction

The volunteer management system needs to correctly import session data from the Excel file "WES Volunteer Management (6).xlsx". Currently, the import process has three critical issues:

1. **Date parsing failure** - Excel serial numbers (e.g., 45603) are not being converted to proper dates
2. **Volunteer name mapping** - The "Session By" column contains volunteer names/emails but is not being mapped correctly
3. **Past session import** - Data from "Past Session" and "New Past Session_03.03.2026" sheets is not being imported

The Excel file contains multiple sheets with session data. The import dialog needs to handle these sheets and properly transform the data before storing in the database.

## Glossary

- **Excel Serial Number**: A numeric representation of dates in Excel (e.g., 45603 = March 15, 2024)
- **Session By**: Column in Excel containing volunteer names or email addresses
- **Session on**: Column in Excel containing session dates as Excel serial numbers
- **Past Session Sheet**: Excel sheet named "Past Session" containing historical session data
- **New Past Session Sheet**: Excel sheet named "New Past Session_03.03.2026" containing additional historical data
- **Column Mapping**: Process of matching Excel column names to database field names
- **Import Dialog**: React component that handles file upload and data transformation

## Requirements

### Requirement 1: Parse Excel Serial Date Numbers

**User Story:** As a system administrator, I want dates from Excel to be correctly converted to standard date format, so that session dates are accurate in the database.

#### Acceptance Criteria

1. WHEN an Excel file contains dates as serial numbers (e.g., 45603), THE system SHALL convert them to YYYY-MM-DD format
2. WHEN the "Session on" column contains Excel serial numbers, THE system SHALL parse them using the Excel date epoch (December 30, 1899)
3. WHEN a date conversion fails, THE system SHALL log the error and skip that row with a warning message
4. WHEN dates are successfully converted, THE system SHALL validate the resulting date is in valid YYYY-MM-DD format before importing

### Requirement 2: Map Volunteer Names from "Session By" Column

**User Story:** As a data manager, I want volunteer names from the Excel "Session By" column to be correctly imported as volunteer_name, so that volunteer records are complete.

#### Acceptance Criteria

1. WHEN the Excel column "Session By" is present, THE system SHALL automatically map it to the database field "volunteer_name"
2. WHEN "Session By" contains email addresses (e.g., srinathv21@gmail.com), THE system SHALL extract the name portion or store the full email
3. WHEN "Session By" contains names (e.g., "Aquib Qureshi"), THE system SHALL store them as-is in the volunteer_name field
4. WHEN the volunteer_name field is empty after mapping, THE system SHALL allow the import to proceed with null value

### Requirement 3: Support Multiple Past Session Sheets

**User Story:** As a data administrator, I want to import data from both "Past Session" and "New Past Session_03.03.2026" sheets, so that all historical session data is available.

#### Acceptance Criteria

1. WHEN the import dialog loads an Excel file, THE system SHALL detect and list all sheets containing session data
2. WHEN a user selects the "Past Session" sheet, THE system SHALL parse and display all rows from that sheet
3. WHEN a user selects the "New Past Session_03.03.2026" sheet, THE system SHALL parse and display all rows from that sheet
4. WHEN importing from past session sheets, THE system SHALL automatically set the status to "completed" if not specified
5. WHEN multiple sheets are available, THE system SHALL allow the user to choose which sheet to import

### Requirement 4: Auto-Detect and Map Excel Columns

**User Story:** As a user, I want the import dialog to automatically detect and map Excel columns to database fields, so that I don't have to manually configure mappings.

#### Acceptance Criteria

1. WHEN an Excel file is loaded, THE system SHALL auto-detect column names and suggest database field mappings
2. WHEN the column "Session on" is detected, THE system SHALL map it to "session_date"
3. WHEN the column "Session By" is detected, THE system SHALL map it to "volunteer_name"
4. WHEN the column "Topics Covered" is detected, THE system SHALL map it to "topics_covered"
5. WHEN the column "Content Category" is detected, THE system SHALL map it to "content_category"
6. WHEN the column "Session Status" is detected, THE system SHALL map it to "status"
7. WHEN auto-detection completes, THE system SHALL display the mappings for user review and adjustment

### Requirement 5: Validate and Transform Imported Data

**User Story:** As a system administrator, I want imported data to be validated and transformed correctly, so that the database contains clean, consistent data.

#### Acceptance Criteria

1. WHEN data is imported, THE system SHALL validate that required fields (session_date, topics_covered) are present
2. WHEN session_date is an Excel serial number, THE system SHALL convert it before validation
3. WHEN status values are imported, THE system SHALL normalize them to valid values (pending/committed/completed)
4. WHEN volunteer_name contains an email, THE system SHALL extract or store appropriately
5. WHEN all validations pass, THE system SHALL insert the data into the database in batches

### Requirement 6: Provide Clear Import Feedback

**User Story:** As a user, I want to see clear feedback about the import process, so that I know what was imported and if there were any issues.

#### Acceptance Criteria

1. WHEN the import process completes, THE system SHALL display the number of successfully imported rows
2. WHEN rows are skipped due to errors, THE system SHALL display the count of skipped rows
3. WHEN specific rows fail, THE system SHALL log which rows failed and why
4. WHEN the import is partially successful, THE system SHALL show both success and failure counts

## Testing Strategy

### Unit Tests
- Test Excel serial date conversion with various date values
- Test volunteer name extraction from email addresses
- Test column mapping detection for all expected column names
- Test status normalization (Completed → completed, etc.)
- Test data validation for required fields

### Property-Based Tests
- For any Excel serial number, converting and parsing should produce a valid YYYY-MM-DD date
- For any volunteer name or email in "Session By", the result should be a non-empty string
- For any status value, normalization should produce one of: pending, committed, completed
- For any valid row, all required fields should be present after transformation

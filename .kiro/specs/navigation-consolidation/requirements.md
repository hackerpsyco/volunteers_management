# Requirements Document

## Introduction

This feature consolidates and improves the navigation experience in the WES Foundation Volunteer Management platform. It involves reordering the sidebar navigation menu to follow a logical user workflow sequence and consolidating two separate import dialogs (Sessions and Curriculum) into a single, unified import interface that intelligently handles both data types.

## Glossary

- **Sidebar Navigation**: The vertical menu on the left side of the dashboard that provides access to different sections of the application
- **Import Dialog**: A modal dialog that allows users to upload and map data from external files (CSV, Excel, HTML)
- **Sessions**: Individual volunteer teaching sessions with associated metadata (date, time, mentor, resources)
- **Curriculum**: Educational content structure including categories, modules, and topics
- **Column Mapping**: The process of matching CSV columns to database fields during import

## Requirements

### Requirement 1

**User Story:** As a user, I want the sidebar navigation to follow a logical workflow sequence, so that I can navigate through the application intuitively.

#### Acceptance Criteria

1. WHEN the user views the sidebar THEN the system SHALL display navigation items in this exact order: Dashboard, Calendar, Session, Curriculum, Facilitator, Centres & Slots, Volunteer
2. WHEN the user navigates to any page THEN the system SHALL highlight the active navigation item with the primary color
3. WHEN the user is on a mobile device THEN the system SHALL maintain the same navigation order in the mobile menu

**Requirements: 1.1, 1.2, 1.3**

### Requirement 2

**User Story:** As a user, I want a single unified import interface for both sessions and curriculum data, so that I can import different types of data without confusion.

#### Acceptance Criteria

1. WHEN the user clicks the import button on the Sessions page THEN the system SHALL display a single import dialog with options to select the import type (Sessions or Curriculum)
2. WHEN the user selects "Import Sessions" THEN the system SHALL display the sessions-specific column mapping interface
3. WHEN the user selects "Import Curriculum" THEN the system SHALL display the curriculum-specific import interface
4. WHEN the user completes an import THEN the system SHALL close the dialog and refresh the sessions list
5. WHEN the import process encounters errors THEN the system SHALL display detailed error messages and allow the user to retry

**Requirements: 2.1, 2.2, 2.3, 2.4, 2.5**

### Requirement 3

**User Story:** As a developer, I want the import functionality to be maintainable and extensible, so that new import types can be added in the future.

#### Acceptance Criteria

1. WHEN the import dialog is implemented THEN the system SHALL use a modular component structure that separates import type selection from type-specific logic
2. WHEN adding a new import type THEN the system SHALL require minimal changes to the main import dialog component
3. WHEN the import process runs THEN the system SHALL provide clear feedback about progress and results

**Requirements: 3.1, 3.2, 3.3**

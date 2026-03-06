# Requirements Document: Text Truncation with See More Feature

## Introduction

The Sessions and Curriculum UI tables display long text values (Category, Module Name, Topics Covered) that overflow and get truncated with "..." in the current implementation. Users cannot see the full content without expanding cells or hovering. This feature adds a "See More" button that appears when text is truncated, allowing users to view the complete text in a tooltip or modal.

## Glossary

- **Text Truncation**: Limiting displayed text to a maximum character count or width
- **See More Button**: A clickable element that reveals the full text when truncated
- **Sessions UI**: The page displaying all training sessions with their details
- **Curriculum UI**: The page displaying curriculum items with categories, modules, and topics
- **Truncated Text**: Text that exceeds the display limit and is cut off with "..."

## Requirements

### Requirement 1: Truncate Long Text in Tables

**User Story:** As a user, I want long text values in tables to be truncated with "..." to maintain clean table layout, so that the UI remains organized and readable.

#### Acceptance Criteria

1. WHEN a table cell contains text longer than 30 characters, THE system SHALL truncate it and append "..."
2. WHEN text is truncated, THE system SHALL display only the first 30 characters followed by "..."
3. WHEN text is shorter than 30 characters, THE system SHALL display the full text without truncation
4. WHEN a cell is truncated, THE system SHALL apply truncation consistently across all similar columns (Category, Module Name, Topics Covered)

### Requirement 2: Display See More Button for Truncated Text

**User Story:** As a user, I want to see a "See More" button next to truncated text, so that I can easily access the full content.

#### Acceptance Criteria

1. WHEN text is truncated in a table cell, THE system SHALL display a "See More" button next to the truncated text
2. WHEN text is not truncated, THE system SHALL not display the "See More" button
3. WHEN the "See More" button is clicked, THE system SHALL display the full text in a tooltip or modal
4. WHEN the full text is displayed, THE system SHALL provide a way to close or dismiss the view

### Requirement 3: Show Full Text in Tooltip or Modal

**User Story:** As a user, I want to view the complete text when I click "See More", so that I can read the entire content without limitations.

#### Acceptance Criteria

1. WHEN a user clicks the "See More" button, THE system SHALL display the full text in a tooltip or modal dialog
2. WHEN the full text is displayed, THE system SHALL show the complete, untruncated content
3. WHEN the user clicks outside the tooltip/modal or clicks a close button, THE system SHALL dismiss the view
4. WHEN the tooltip/modal is displayed, THE system SHALL position it appropriately to avoid overlapping with other UI elements

### Requirement 4: Apply Feature to All Relevant Tables

**User Story:** As a system user, I want the truncation and "See More" feature to work consistently across all tables in the application, so that I have a uniform experience.

#### Acceptance Criteria

1. WHEN viewing the Sessions page, THE system SHALL apply text truncation and "See More" to Category, Module Name, and Topics Covered columns
2. WHEN viewing the Curriculum page, THE system SHALL apply text truncation and "See More" to Category, Module Name, and Topics Covered columns
3. WHEN the feature is applied, THE system SHALL maintain consistent styling and behavior across all tables
4. WHEN a user interacts with truncated text in any table, THE system SHALL provide the same "See More" experience

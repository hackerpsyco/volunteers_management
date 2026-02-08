# Requirements Document

## Introduction

The Curriculum page has a critical issue where curriculum content is duplicated across classes and filtering by class doesn't properly isolate content. When a user selects a class and content category, the module topics fail to load, and the UI displays duplicate curriculum items from all classes mixed together. This feature fixes the class-curriculum relationship to ensure each class displays only its relevant curriculum content without duplication.

## Glossary

- **Curriculum**: Educational content organized by category, module, and topics
- **Class**: A student group (e.g., Class 7, Class 8, Class 10)
- **Content Category**: Classification of curriculum (e.g., "WES Fellow", "Science")
- **Module**: A numbered unit within a category containing topics
- **Topic**: Specific subject matter within a module
- **Session**: A teaching session linked to a topic and class
- **Duplicate Curriculum**: Multiple identical curriculum records created for each class instead of sharing one record

## Requirements

### Requirement 1

**User Story:** As a facilitator, I want to select a class and see only the curriculum assigned to that class, so that I can manage content without seeing duplicate or irrelevant entries.

#### Acceptance Criteria

1. WHEN a facilitator selects a class from the dropdown THEN the system SHALL display only curriculum items assigned to that specific class
2. WHEN a facilitator selects a content category THEN the system SHALL filter the displayed curriculum to show only items matching both the selected class and category
3. WHEN a facilitator views the curriculum table THEN the system SHALL not display duplicate curriculum items for the same module and topic
4. WHEN a facilitator selects a class and category THEN the system SHALL load and display all module topics for that combination without errors

### Requirement 2

**User Story:** As a system administrator, I want the curriculum data to be properly structured without duplication, so that data integrity is maintained and queries perform efficiently.

#### Acceptance Criteria

1. WHEN curriculum is imported THEN the system SHALL store each unique curriculum item once in the database
2. WHEN a curriculum item is assigned to multiple classes THEN the system SHALL maintain the relationship through a proper class-curriculum mapping without duplicating the curriculum record
3. WHEN querying curriculum for a specific class THEN the system SHALL return only curriculum items linked to that class
4. WHEN a class is deleted THEN the system SHALL remove only the class-curriculum relationship, not the curriculum item itself

### Requirement 3

**User Story:** As a facilitator, I want the curriculum UI to correctly display session information for each topic, so that I can see which sessions have been scheduled for each topic in the selected class.

#### Acceptance Criteria

1. WHEN a facilitator selects a class and views a topic THEN the system SHALL display fresh and revision sessions only for that topic in the selected class
2. WHEN a facilitator views session information THEN the system SHALL show the correct count of fresh and revision sessions for each topic
3. WHEN no sessions exist for a topic in the selected class THEN the system SHALL display a clear indicator (e.g., "-" or "No sessions")
4. WHEN a facilitator switches between classes THEN the system SHALL update the session information to reflect only sessions for the newly selected class

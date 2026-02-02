# Requirements Document: Student Roll Number and Subject Fields

## Introduction

This feature enhances the student management system to capture and display Roll Number and Subject information for each student. Students can be assigned to one of three subjects (Commerce, Computer Science, Arts), and each student can have an optional roll number. These fields will be integrated into the add, edit, and display workflows for students within classes.

## Glossary

- **Student**: A person enrolled in a class
- **Roll Number**: An optional identifier assigned to a student within a class (e.g., 1, 2, 3)
- **Subject**: The academic subject a student is studying (Commerce, Computer Science, or Arts)
- **Class**: A group of students organized together for instruction
- **UI**: User Interface - the visual components users interact with

## Requirements

### Requirement 1

**User Story:** As an administrator, I want to assign a roll number and subject to each student, so that I can organize and track students by their academic stream and position in the class.

#### Acceptance Criteria

1. WHEN adding a new student to a class THEN THE system SHALL accept an optional roll number field
2. WHEN adding a new student to a class THEN THE system SHALL accept a subject selection from a dropdown with options: Commerce, Computer Science, Arts
3. WHEN a student is added with roll number and subject THEN THE system SHALL persist both fields to the database
4. WHEN editing an existing student THEN THE system SHALL allow modification of the roll number field
5. WHEN editing an existing student THEN THE system SHALL allow modification of the subject field

### Requirement 2

**User Story:** As an administrator, I want to view roll numbers and subjects in the student list, so that I can quickly identify students by their academic stream and class position.

#### Acceptance Criteria

1. WHEN viewing the student list in desktop view THEN THE system SHALL display a "Roll Number" column in the table
2. WHEN viewing the student list in desktop view THEN THE system SHALL display a "Subject" column in the table
3. WHEN viewing the student list in mobile view THEN THE system SHALL display roll number and subject information in the student card
4. WHEN a student has no roll number assigned THEN THE system SHALL display a dash (-) in the roll number field
5. WHEN a student has no subject assigned THEN THE system SHALL display a dash (-) in the subject field

### Requirement 3

**User Story:** As an administrator, I want to ensure data consistency when managing student information, so that the system maintains accurate records.

#### Acceptance Criteria

1. WHEN a student is added without a roll number THEN THE system SHALL accept the submission and store null for roll number
2. WHEN a student is added without a subject THEN THE system SHALL accept the submission and store null for subject
3. WHEN updating a student's roll number or subject THEN THE system SHALL save the changes immediately
4. WHEN viewing student details THEN THE system SHALL display the most recently saved roll number and subject values

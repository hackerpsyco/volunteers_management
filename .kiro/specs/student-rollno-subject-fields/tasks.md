# Implementation Plan: Student Roll Number and Subject Fields

- [x] 1. Update AddStudentDialog component



  - Add roll_number and subject fields to the form state
  - Add text input for roll number (optional)
  - Add select dropdown for subject with three options: Commerce, Computer Science, Arts
  - Update the insert query to include roll_number and subject
  - _Requirements: 1.1, 1.2, 1.3_

- [ ]* 1.1 Write property test for roll number and subject persistence
  - **Feature: student-rollno-subject-fields, Property 1: Roll Number and Subject Persistence**
  - **Validates: Requirements 1.3**

- [ ]* 1.2 Write property test for null handling
  - **Feature: student-rollno-subject-fields, Property 2: Null Handling for Optional Fields**


  - **Validates: Requirements 3.1, 3.2**

- [ ] 2. Update EditStudentDialog component
  - Add roll_number and subject fields to the form state
  - Add text input for roll number (optional, editable)
  - Add select dropdown for subject (optional, editable)
  - Update the update query to include roll_number and subject
  - _Requirements: 1.4, 1.5_

- [ ]* 2.1 Write unit tests for EditStudentDialog
  - Test editing roll number field


  - Test editing subject field
  - Test saving changes with null values
  - _Requirements: 1.4, 1.5_

- [ ] 3. Update ClassStudents page - Desktop view
  - Add "Roll Number" column to the table header
  - Add "Subject" column to the table header
  - Update the Student interface to include roll_number and subject fields
  - Display roll_number in table cells (show "-" if null)
  - Display subject in table cells (show "-" if null)


  - _Requirements: 2.1, 2.2, 2.4, 2.5_

- [ ]* 3.1 Write property test for display consistency
  - **Feature: student-rollno-subject-fields, Property 3: Display Consistency**
  - **Validates: Requirements 2.4, 2.5**

- [ ] 4. Update ClassStudents page - Mobile view
  - Add roll number display to student card
  - Add subject display to student card
  - Show "-" for null values
  - _Requirements: 2.3, 2.4, 2.5_

- [ ]* 4.1 Write unit tests for mobile card display
  - Test roll number display in card


  - Test subject display in card
  - Test null value handling (showing "-")
  - _Requirements: 2.3, 2.4, 2.5_




- [ ] 5. Update Student interface and types
  - Add roll_number: string | null to Student interface
  - Add subject: string | null to Student interface
  - Update all component prop types that use Student
  - _Requirements: 1.1, 1.2, 2.1, 2.2_

- [ ]* 5.1 Write property test for subject dropdown validation
  - **Feature: student-rollno-subject-fields, Property 4: Subject Dropdown Validation**
  - **Validates: Requirements 1.2, 1.5**

- [ ] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 6.1 Write integration tests
  - Test complete flow: add student with roll number and subject, view in list, edit, verify display
  - Test adding student without roll number/subject, verify null handling
  - Test mobile and desktop views display correctly
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3_

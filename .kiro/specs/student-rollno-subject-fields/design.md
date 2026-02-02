# Design Document: Student Roll Number and Subject Fields

## Overview

This design outlines the integration of Roll Number and Subject fields into the student management system. The implementation involves updating three main components:
1. **AddStudentDialog** - Add roll number and subject inputs
2. **EditStudentDialog** - Allow editing of roll number and subject
3. **ClassStudents** - Display roll number and subject in both desktop and mobile views

The database schema already includes `roll_number` and `subject` columns in the students table.

## Architecture

The feature follows a layered architecture:
- **UI Layer**: React components (AddStudentDialog, EditStudentDialog, ClassStudents)
- **Data Layer**: Supabase client for database operations
- **Database Layer**: PostgreSQL students table with roll_number and subject columns

## Components and Interfaces

### AddStudentDialog Component
- **Purpose**: Collect student information including roll number and subject
- **New Fields**:
  - `roll_number`: Text input (optional)
  - `subject`: Select dropdown with options (optional)
- **Subject Options**: Commerce, Computer Science, Arts
- **Behavior**: Accepts null values for both fields

### EditStudentDialog Component
- **Purpose**: Allow modification of existing student records
- **Updated Fields**:
  - `roll_number`: Text input (optional, editable)
  - `subject`: Select dropdown (optional, editable)
- **Behavior**: Preserves existing values and allows updates

### ClassStudents Page Component
- **Desktop View**: Add two new table columns
  - Roll Number column (displays roll_number or "-")
  - Subject column (displays subject or "-")
- **Mobile View**: Add roll number and subject to student card display
- **Behavior**: Fetches and displays all student fields including roll_number and subject

## Data Models

### Student Interface (Updated)
```typescript
interface Student {
  id: string;
  student_id: string;
  name: string;
  gender: string | null;
  dob: string | null;
  email: string | null;
  phone_number: string | null;
  roll_number: string | null;      // NEW
  subject: string | null;           // NEW
}
```

### Subject Options
```typescript
const SUBJECT_OPTIONS = [
  'Commerce',
  'Computer Science',
  'Arts'
];
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Roll Number and Subject Persistence
*For any* student record, when roll number and subject are provided during creation or update, querying the database should return the same values that were submitted.
**Validates: Requirements 1.3, 3.3**

### Property 2: Null Handling for Optional Fields
*For any* student record created without roll number or subject, the database should store null values for these fields, and subsequent queries should return null (not empty strings or default values).
**Validates: Requirements 3.1, 3.2**

### Property 3: Display Consistency
*For any* student record displayed in the UI, if roll number is null, the display should show "-", and if subject is null, the display should show "-".
**Validates: Requirements 2.4, 2.5**

### Property 4: Subject Dropdown Validation
*For any* subject selection in the UI, only the three valid options (Commerce, Computer Science, Arts) should be selectable, and the selected value should be persisted correctly.
**Validates: Requirements 1.2, 1.5**

## Error Handling

- **Invalid Subject**: The UI prevents invalid subjects through a controlled dropdown
- **Missing Required Fields**: Name remains required; roll number and subject are optional
- **Database Errors**: Display user-friendly error messages via toast notifications
- **Concurrent Updates**: Last-write-wins approach (standard Supabase behavior)

## Testing Strategy

### Unit Tests
- Test AddStudentDialog form submission with and without roll number/subject
- Test EditStudentDialog updates to roll number and subject fields
- Test ClassStudents table rendering with null and populated roll number/subject values
- Test mobile card display of roll number and subject

### Property-Based Tests
- **Property 1**: Generate random students with various roll numbers and subjects, verify round-trip persistence
- **Property 2**: Generate students without roll number/subject, verify null storage and retrieval
- **Property 3**: Generate students with null values, verify UI displays "-" correctly
- **Property 4**: Test all three subject options are selectable and persist correctly

**Testing Framework**: Vitest with fast-check for property-based testing
**Minimum Iterations**: 100 per property test

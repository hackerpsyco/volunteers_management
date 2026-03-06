# Requirements Document: Session Dialog Field Reordering

## Introduction

The "Add Session" dialog currently displays form fields in a sequence that doesn't match the logical workflow for scheduling sessions. The facilitator selection field appears before the coordinator selection field, which is counterintuitive for users. This feature reorders the form fields to present a more logical sequence: Volunteer → Coordinator → Facilitator, making the user experience more intuitive across all session types (Guest Teacher, Guest Speaker, Local Teacher).

## Glossary

- **Add Session Dialog**: The React component that allows users to create new training sessions with curriculum details and participant information
- **Session Type**: The category of session being scheduled (guest_teacher, guest_speaker, local_teacher)
- **Form Field Sequence**: The order in which input fields are displayed to the user in the dialog
- **Coordinator**: The person responsible for coordinating the session logistics
- **Facilitator**: The person responsible for facilitating the session delivery

## Requirements

### Requirement 1: Reorder Form Fields in Add Session Dialog

**User Story:** As a session scheduler, I want the form fields to appear in a logical sequence (Volunteer → Coordinator → Facilitator), so that I can fill them out in a more intuitive order.

#### Acceptance Criteria

1. WHEN the Add Session dialog opens for any session type, THE system SHALL display fields in this order: Session Date, Select Volunteer, Select Coordinator, Select Facilitator, Select Topic
2. WHEN the user scrolls through the dialog, THE system SHALL maintain the field sequence consistently across all session types (guest_teacher, guest_speaker, local_teacher)
3. WHEN the dialog renders, THE system SHALL place the Facilitator selection field after the Coordinator selection field
4. WHEN the form is submitted, THE system SHALL validate all required fields regardless of their display order

### Requirement 2: Maintain Functionality Across All Session Types

**User Story:** As a system administrator, I want the field reordering to apply consistently to all session types, so that users have a consistent experience.

#### Acceptance Criteria

1. WHEN creating a guest_teacher session, THE system SHALL display fields in the reordered sequence
2. WHEN creating a guest_speaker session, THE system SHALL display fields in the reordered sequence
3. WHEN creating a local_teacher session, THE system SHALL display fields in the reordered sequence
4. WHEN any session type is selected, THE system SHALL preserve the field order without variation

### Requirement 3: Preserve All Existing Functionality

**User Story:** As a developer, I want the field reordering to not affect any existing validation, data submission, or business logic, so that the system remains stable.

#### Acceptance Criteria

1. WHEN the form is submitted, THE system SHALL validate Coordinator and Facilitator selections as required fields
2. WHEN data is saved to the database, THE system SHALL store Coordinator and Facilitator information correctly
3. WHEN the dialog closes, THE system SHALL reset all form fields to their initial state
4. WHEN the user navigates between fields, THE system SHALL trigger appropriate data fetching and cascading updates as before

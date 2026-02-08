# Implementation Plan

## Overview
Fix the curriculum-class relationship to eliminate duplication and ensure proper filtering by class. The solution involves:
1. Cleaning up duplicate curriculum data in the database
2. Updating the Curriculum page to properly query and filter by class
3. Fixing the session info fetching to respect class boundaries
4. Ensuring the UI displays only relevant curriculum for the selected class

---

- [x] 1. Clean up duplicate curriculum data in the database


  - Remove duplicate curriculum entries that were created for each class
  - Keep only one instance of each unique curriculum item
  - Preserve the class-curriculum relationships through proper linking
  - _Requirements: 2.1, 2.2_


- [ ] 2. Update Curriculum page to fetch class-specific curriculum
  - Modify the `fetchCurriculum` function to accept a class parameter
  - Query curriculum items filtered by the selected class ID
  - Ensure curriculum is fetched only when a class is selected

  - _Requirements: 1.1, 1.4_

- [ ] 3. Fix category filtering to work with class filtering
  - Update the filtering logic to apply both class and category filters simultaneously

  - Ensure filtered results show only curriculum matching both criteria
  - _Requirements: 1.2, 1.3_

- [ ] 4. Update session info fetching to use class_batch correctly
  - Modify `fetchSessionInfo` to properly filter sessions by the selected class


  - Ensure sessions are matched to curriculum topics within the selected class only
  - Fix the session grouping logic to avoid mixing sessions from different classes
  - _Requirements: 3.1, 3.2, 3.4_

- [ ] 5. Update the UI to display filtered curriculum without duplicates
  - Verify the table displays only unique curriculum items for the selected class
  - Ensure session information is correctly associated with topics
  - Test that switching between classes updates all displayed information
  - _Requirements: 1.1, 1.3, 3.3, 3.4_

- [ ] 6. Checkpoint - Verify all filtering works correctly
  - Ensure all tests pass, ask the user if questions arise.

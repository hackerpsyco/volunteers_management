# Requirements Document

## Introduction

This feature adds a country code selector to the volunteer add form, replacing the current text input for country. The selector will display a list of countries with their corresponding country codes, with India set as the default selection. This improves data consistency and user experience by providing a standardized way to select countries.

## Glossary

- **Country Code Selector**: A dropdown component that displays a list of countries with their ISO country codes
- **Default Country**: India, which is pre-selected when the form loads
- **Volunteer Form**: The form used to add new volunteers to the system
- **Country Code**: The ISO 3166-1 alpha-2 code representing a country (e.g., "IN" for India)

## Requirements

### Requirement 1

**User Story:** As a volunteer coordinator, I want to select a country from a dropdown list instead of typing it, so that I can ensure consistent country data entry and reduce errors.

#### Acceptance Criteria

1. WHEN the volunteer add form loads THEN the country selector SHALL display India as the default selected country
2. WHEN a user clicks on the country selector THEN the system SHALL display a dropdown list of all countries with their country codes
3. WHEN a user selects a country from the dropdown THEN the system SHALL update the form field with the selected country and its code
4. WHEN the form is submitted THEN the system SHALL persist the selected country to the database

### Requirement 2

**User Story:** As a system administrator, I want the country selector to be searchable, so that users can quickly find and select their country without scrolling through the entire list.

#### Acceptance Criteria

1. WHEN the country dropdown is open THEN the system SHALL provide a search input field
2. WHEN a user types in the search field THEN the system SHALL filter the country list to show only matching countries
3. WHEN a user clears the search field THEN the system SHALL display the complete list of countries again
4. WHEN no countries match the search query THEN the system SHALL display a "no results" message


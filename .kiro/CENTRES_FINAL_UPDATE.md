# Centres Page - Final Update

## Changes Made

### 1. **Removed Capacity Field from Centre Form**
- Removed capacity input from centre details section
- Removed capacity display from centre list view
- Removed capacity from time slot form
- Removed capacity from time slot display

### 2. **Fixed Time Slot UI**
- Time slots section now displays properly in the form
- Grid layout adjusted from 5 columns to 4 columns (Day, Start Time, End Time, Delete button)
- Time slots are clearly visible when creating a new centre
- "Add Slot" button works to add multiple time slots

### 3. **Simplified Time Slot Display**
- Time slots now show only: Day and Time Range (e.g., "Monday: 09:00 - 17:00")
- Removed capacity display from time slot cards
- Cleaner, more focused display

## Form Structure

### Centre Details Section:
- Centre Name * (required)
- Location * (required)
- Address
- Phone
- Email
- Status (Active/Inactive)

### Session Time Slots Section (when creating new centre):
- Day selector
- Start Time picker
- End Time picker
- Delete button (if more than 1 slot)
- "Add Slot" button to add more slots

## Time Slot Display
After centre is created, time slots appear below centre details showing:
- Day and time range (e.g., "Monday: 09:00 - 17:00")
- Clean, organized display with 🕐 emoji

## Benefits
✅ Simpler form without unnecessary capacity field
✅ Time slots section clearly visible and functional
✅ Cleaner UI with focused information
✅ Better user experience for centre creation


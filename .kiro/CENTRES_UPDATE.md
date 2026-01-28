# Centres Page Update - Integrated Time Slots

## Changes Made

### File: `src/pages/Centres.tsx`

**What Changed:**
- Removed separate "Add Slot" button and form from centre display
- Integrated time slot creation directly into the centre creation form
- Time slots are now created together with the centre in a single form

### Key Features

#### 1. **Unified Centre Creation Form**
- Centre details (name, location, address, phone, email, capacity, status)
- Time slots section integrated below centre details
- All created together in one submission

#### 2. **Time Slot Management in Form**
- Add multiple time slots before creating the centre
- Each time slot has: Day, Start Time, End Time, Capacity
- "Add Slot" button to add more time slots
- Delete button (trash icon) to remove individual slots
- Minimum of 1 time slot required

#### 3. **Time Slots Display**
- After centre is created, time slots display below centre details
- Shows: Day, Time Range, and Capacity
- Clean, organized display with emoji icon (🕐)

#### 4. **Workflow**
1. Click "New Centre" button
2. Fill in centre details
3. Add one or more time slots
4. Click "Create Centre & Slots" to save everything at once
5. Time slots appear immediately below the centre

### Benefits

✅ **Simpler UX** - No need to create centre first, then add slots separately
✅ **Faster** - Create centre and all its time slots in one action
✅ **Cleaner** - No separate "Add Slot" button cluttering the interface
✅ **Better Organization** - Time slots are part of the centre creation flow

### Technical Details

- Time slots are only shown in the form when creating a new centre (not when editing)
- When editing a centre, only centre details can be modified
- Time slots are fetched and displayed for each centre after creation
- All time slots are stored in the `centre_time_slots` table with the centre_id reference

### Database Schema

**centres table:**
- id, name, location, address, phone, email, capacity, status, created_at

**centre_time_slots table:**
- id, centre_id, day, start_time, end_time, capacity

### Testing

1. Click "New Centre" button
2. Fill in centre details
3. Add multiple time slots using "Add Slot" button
4. Remove a time slot using the trash icon
5. Click "Create Centre & Slots"
6. Verify centre appears with all time slots displayed below


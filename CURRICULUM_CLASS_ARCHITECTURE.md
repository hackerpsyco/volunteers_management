# Curriculum & Class Architecture - CORRECTED

## Problem with Previous Approach
The migration `20260208_assign_curriculum_to_all_classes.sql` created DUPLICATES:
- Each curriculum item was copied for EACH class
- This caused the same content to appear multiple times
- Not the desired behavior

## Correct Architecture

### Database Structure

**Curriculum Table:**
- Stores UNIQUE curriculum content (one copy per topic)
- `class_id` = NULL (available to all classes)
- Each topic appears ONCE in the database

**Sessions Table:**
- Stores which class the session is for
- `class_batch` = Class name (e.g., "Class 7", "Class 8")
- Links curriculum to classes through sessions

### How It Works

1. **Curriculum Page:**
   - Shows ALL curriculum items (no duplicates)
   - When you select a class filter, it shows:
     - The curriculum items
     - Session info for ONLY that class (filtered from sessions table)

2. **Session Creation:**
   - Select a class
   - Select curriculum content (same content for all classes)
   - Create session with that class

3. **Session Display:**
   - Calendar shows sessions filtered by class
   - Curriculum page shows session info filtered by class

### Data Flow

```
Curriculum Table (UNIQUE content)
    ↓
Sessions Table (links curriculum to classes via class_batch)
    ↓
UI Filters (show curriculum + class-specific session info)
```

## What to Do

### Step 1: Run the Migration
Execute `20260208_remove_duplicate_curriculum.sql` to:
- Remove all duplicate curriculum entries
- Keep only one copy per topic
- Clear class_id values

### Step 2: Verify
After migration:
- Curriculum table should have fewer rows (no duplicates)
- Each topic appears only once
- All class_id values are NULL

### Step 3: Test
1. Go to Curriculum page
2. Select a class from the filter
3. You should see:
   - The curriculum items (same for all classes)
   - Session info for ONLY that class
   - No duplicates

## Key Differences

| Aspect | Previous (Wrong) | Correct |
|--------|-----------------|---------|
| Curriculum copies | One per class (duplicates) | One total (unique) |
| Class linking | curriculum.class_id | sessions.class_batch |
| Filtering | By curriculum.class_id | By sessions.class_batch |
| Data size | Large (many duplicates) | Minimal (no duplicates) |

## Why This Works Better

1. **No Duplicates** - Each curriculum item stored once
2. **Flexible** - Same curriculum can be used by any class
3. **Clean** - Class association is in sessions, not curriculum
4. **Scalable** - Adding new classes doesn't duplicate data
5. **Maintainable** - Update curriculum once, affects all classes

## Example

**Before (Wrong):**
```
Curriculum:
- Algebra (class_id: Class 7)
- Algebra (class_id: Class 8)  ← DUPLICATE
- Algebra (class_id: Class 9)  ← DUPLICATE
- Geometry (class_id: Class 7)
- Geometry (class_id: Class 8) ← DUPLICATE
- Geometry (class_id: Class 9) ← DUPLICATE
```

**After (Correct):**
```
Curriculum:
- Algebra (class_id: NULL)
- Geometry (class_id: NULL)

Sessions:
- Session 1: Algebra, class_batch: "Class 7"
- Session 2: Algebra, class_batch: "Class 8"
- Session 3: Geometry, class_batch: "Class 7"
```

## Implementation Complete

The code already supports this architecture:
- Curriculum page filters sessions by class
- Calendar filters sessions by class
- Session creation stores class in class_batch
- No changes needed to UI code

Just run the migration to clean up the duplicates!

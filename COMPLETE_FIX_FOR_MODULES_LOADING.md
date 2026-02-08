# Complete Fix for Modules Not Loading

## Root Cause
The `module_name` column in the curriculum table is empty or NULL, so when the code queries for modules, it finds nothing.

## The Fix - Two Migrations

### Migration 1: `20260208_verify_and_fix_curriculum.sql`
**Purpose:** Assign curriculum items to classes with proper `class_id` values

**What it does:**
1. Adds `class_id` column (if missing)
2. Assigns all NULL curriculum items to all classes
3. Deletes NULL originals
4. Removes duplicates

**Result:** Each class gets 100 curriculum items with proper `class_id`

### Migration 2: `20260208_populate_module_names.sql`
**Purpose:** Populate empty `module_name` values so modules can be loaded

**What it does:**
1. For items with empty `module_name` but valid `module_no`: generates "Module 1", "Module 2", etc.
2. For items with no `module_no`: uses "General Module"
3. Ensures all curriculum items have a `module_name`

**Result:** All curriculum items have valid `module_name` values

## How to Apply

### Step 1: Run Migration 1
```sql
-- Run: supabase/migrations/20260208_verify_and_fix_curriculum.sql
```

### Step 2: Run Migration 2
```sql
-- Run: supabase/migrations/20260208_populate_module_names.sql
```

## Expected Result

After both migrations:

1. **Categories load** ✅
   - Query: `SELECT DISTINCT content_category FROM curriculum WHERE class_id = 'X'`
   - Result: 4 categories

2. **Modules load** ✅
   - Query: `SELECT DISTINCT module_name FROM curriculum WHERE class_id = 'X' AND content_category = 'Y'`
   - Result: Multiple modules (e.g., "Module 1", "Module 2", etc.)

3. **Topics load** ✅
   - Query: `SELECT * FROM curriculum WHERE class_id = 'X' AND content_category = 'Y' AND module_name = 'Z'`
   - Result: Multiple topics

## Verification

After running both migrations, check:

```sql
-- Should show 0 (no empty module names)
SELECT COUNT(*) FROM curriculum WHERE module_name IS NULL OR module_name = '';

-- Should show items per class
SELECT class_id, COUNT(*) FROM curriculum GROUP BY class_id;

-- Should show modules for a category
SELECT DISTINCT module_name FROM curriculum 
WHERE content_category = 'Students Requested - Topics'
LIMIT 10;
```

## Code Changes

No code changes needed! The code in `AddSessionDialog.tsx` is already correct:
- ✅ Filters by `class_id`
- ✅ Filters by `content_category`
- ✅ Filters by `module_name IS NOT NULL`

The issue was purely in the database data.

## Files to Run

1. `supabase/migrations/20260208_verify_and_fix_curriculum.sql`
2. `supabase/migrations/20260208_populate_module_names.sql`

Run them in order in Supabase SQL Editor.

# Curriculum Class ID Issue - Root Cause & Fix

## Problem
When you select a class in the "Create Session" dialog:
- ✅ Categories load correctly
- ❌ Modules don't load (empty dropdown)
- ❌ Topics don't load (empty dropdown)

## Root Cause
The curriculum table has items with `class_id = NULL`. When the code filters by `class_id`, it finds no results because:

```sql
-- This query returns NOTHING because curriculum items have class_id = NULL
SELECT module_name FROM curriculum 
WHERE content_category = 'Students Requested - Topics'
AND class_id = 'some-class-id'  -- No items match this!
```

## Why This Happened
1. Curriculum was imported without `class_id` values
2. Multiple migrations tried to fix it but didn't complete properly
3. Database still has items with `class_id = NULL`

## The Fix
The migration `20260208_verify_and_fix_curriculum.sql` does:

### Step 1: Add class_id column (if missing)
```sql
ALTER TABLE public.curriculum ADD COLUMN IF NOT EXISTS class_id UUID;
```

### Step 2: Assign NULL items to ALL classes
```sql
-- For each curriculum item with class_id = NULL
-- Create a copy for EACH class
INSERT INTO curriculum (content_category, module_no, module_name, topics_covered, ..., class_id)
SELECT c.*, cl.id as class_id
FROM curriculum c
CROSS JOIN classes cl
WHERE c.class_id IS NULL
```

Example: If you have:
- 100 curriculum items with `class_id = NULL`
- 10 classes

This creates: 100 × 10 = 1000 items (100 per class)

### Step 3: Delete the NULL originals
```sql
DELETE FROM curriculum WHERE class_id IS NULL
```

### Step 4: Remove duplicates
```sql
-- Keep only 1 copy per class
DELETE FROM curriculum
WHERE id NOT IN (
  SELECT DISTINCT ON (class_id, content_category, module_no, module_name, topics_covered) id
  FROM curriculum
  ORDER BY class_id, content_category, module_no, module_name, topics_covered, created_at ASC
)
```

## Result After Fix
- Each class has exactly 100 curriculum items
- All items have `class_id` assigned
- No duplicates
- Queries filter correctly by class

## Code Changes Made
✅ `src/components/sessions/AddSessionDialog.tsx`:
- `fetchCategories()` filters by `class_id`
- `fetchModules()` filters by `class_id`
- `fetchTopics()` filters by `class_id`
- useEffect hooks trigger fetches when class changes

✅ `src/pages/Curriculum.tsx`:
- `fetchCurriculum()` filters by `class_id`

## How to Apply the Fix
1. Run migration: `20260208_verify_and_fix_curriculum.sql`
2. Test in UI:
   - Select class → categories load ✅
   - Select category → modules load ✅
   - Select module → topics load ✅

## Verification Queries
```sql
-- Check total curriculum items
SELECT COUNT(*) FROM curriculum;

-- Check items per class (should be ~100 each)
SELECT class_id, COUNT(*) FROM curriculum GROUP BY class_id;

-- Check for any remaining NULL class_id (should be 0)
SELECT COUNT(*) FROM curriculum WHERE class_id IS NULL;
```

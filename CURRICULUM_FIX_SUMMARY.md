# Curriculum Class ID Loading Issue - FIXED

## The Problem
Topics and modules don't load in Create Session dialog because:
- The migration `20260208_remove_duplicate_curriculum.sql` was setting ALL `class_id` values to NULL
- When code filters by `class_id`, it finds nothing

## The Solution
1. **Deleted** the problematic migration: `20260208_remove_duplicate_curriculum.sql`
2. **Use** the correct migration: `20260208_verify_and_fix_curriculum.sql`

## What the Correct Migration Does

The `20260208_verify_and_fix_curriculum.sql` migration:

### Step 1: Add class_id column
```sql
ALTER TABLE public.curriculum ADD COLUMN IF NOT EXISTS class_id UUID;
```

### Step 2: Assign all NULL items to all classes
```sql
INSERT INTO curriculum (content_category, module_no, module_name, topics_covered, ..., class_id)
SELECT c.*, cl.id as class_id
FROM curriculum c
CROSS JOIN classes cl
WHERE c.class_id IS NULL
```

This creates copies:
- If you have 100 curriculum items with `class_id = NULL`
- And 10 classes
- Result: 1000 items (100 per class)

### Step 3: Delete NULL originals
```sql
DELETE FROM curriculum WHERE class_id IS NULL
```

### Step 4: Remove duplicates
```sql
DELETE FROM curriculum
WHERE id NOT IN (
  SELECT DISTINCT ON (class_id, content_category, module_no, module_name, topics_covered) id
  FROM curriculum
  ORDER BY class_id, content_category, module_no, module_name, topics_covered, created_at ASC
)
```

## Code Changes (Already Done)
✅ `src/components/sessions/AddSessionDialog.tsx`:
- `fetchCategories(classId)` - filters by class_id
- `fetchModules(category, classId)` - filters by class_id
- `fetchTopics(category, moduleName, classId)` - filters by class_id
- useEffect hooks pass selectedClass to all fetch functions

✅ `src/pages/Curriculum.tsx`:
- `fetchCurriculum(classId)` - filters by class_id

## How to Apply the Fix

### Option 1: If you haven't run any migrations yet
Just run: `20260208_verify_and_fix_curriculum.sql`

### Option 2: If migrations have already run
1. Delete the bad migration: `20260208_remove_duplicate_curriculum.sql` ✅ (Already done)
2. Run: `20260208_verify_and_fix_curriculum.sql`

## Expected Result After Fix

When you select a class in Create Session dialog:
1. Select class → Categories load ✅
2. Select category → Modules load ✅
3. Select module → Topics load ✅

## Verification

After running the migration, check:

```sql
-- Should show ~100 items per class
SELECT class_id, COUNT(*) FROM curriculum GROUP BY class_id;

-- Should show 0 (no NULL values)
SELECT COUNT(*) FROM curriculum WHERE class_id IS NULL;

-- Should show total = classes × 100
SELECT COUNT(*) FROM curriculum;
```

## Files Changed
- ❌ Deleted: `supabase/migrations/20260208_remove_duplicate_curriculum.sql`
- ✅ Updated: `supabase/migrations/20260208_verify_and_fix_curriculum.sql`
- ✅ Code: `src/components/sessions/AddSessionDialog.tsx` (already correct)
- ✅ Code: `src/pages/Curriculum.tsx` (already correct)

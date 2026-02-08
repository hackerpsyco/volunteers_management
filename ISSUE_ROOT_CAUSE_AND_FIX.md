# Root Cause Analysis: Why Topics & Modules Don't Load

## The Issue
When you select a class in "Create Session" dialog:
- ✅ Categories load
- ❌ Modules dropdown is empty
- ❌ Topics dropdown is empty

## Root Cause Found
The migration `20260208_remove_duplicate_curriculum.sql` was setting ALL `class_id` to NULL:

```sql
UPDATE public.curriculum
SET class_id = NULL;  -- ❌ THIS IS THE PROBLEM!
```

## Why This Breaks Everything

The code in `AddSessionDialog.tsx` does:

```typescript
const fetchModules = async (category: string, classId?: string) => {
  let query = supabase
    .from('curriculum')
    .select('module_name')
    .eq('content_category', category)
    .not('module_name', 'is', null);

  if (classId) {
    query = query.eq('class_id', classId);  // Filter by class_id
  }

  const { data, error } = await query;
  // ...
}
```

When you select a class, it runs:
```sql
SELECT module_name FROM curriculum 
WHERE content_category = 'Students Requested - Topics'
AND class_id = 'class-7-uuid'
```

But the database has:
```sql
SELECT module_name FROM curriculum 
WHERE content_category = 'Students Requested - Topics'
AND class_id = NULL  -- ❌ No match!
```

Result: Empty array → Empty dropdown

## The Fix

### Step 1: Delete the Bad Migration
✅ Deleted: `supabase/migrations/20260208_remove_duplicate_curriculum.sql`

### Step 2: Run the Correct Migration
Run: `supabase/migrations/20260208_verify_and_fix_curriculum.sql`

This migration:
1. Adds `class_id` column (if missing)
2. Creates copies of each curriculum item for each class
3. Deletes the NULL originals
4. Removes duplicates

## Before Fix
```
Curriculum Table:
id    | content_category | module_name | class_id
------|------------------|-------------|----------
uuid1 | Category A       | Module 1    | NULL
uuid2 | Category A       | Module 2    | NULL
uuid3 | Category B       | Module 3    | NULL
...   | ...              | ...         | NULL
```

Query: `SELECT * WHERE class_id = 'class-7-uuid'` → **0 results** ❌

## After Fix
```
Curriculum Table:
id    | content_category | module_name | class_id
------|------------------|-------------|----------
uuid1 | Category A       | Module 1    | class-7-uuid
uuid2 | Category A       | Module 2    | class-7-uuid
uuid3 | Category B       | Module 3    | class-7-uuid
uuid4 | Category A       | Module 1    | class-8-uuid
uuid5 | Category A       | Module 2    | class-8-uuid
uuid6 | Category B       | Module 3    | class-8-uuid
...   | ...              | ...         | ...
```

Query: `SELECT * WHERE class_id = 'class-7-uuid'` → **3 results** ✅

## Code is Already Correct

The code in `AddSessionDialog.tsx` and `Curriculum.tsx` is already correct:
- ✅ Filters by `class_id`
- ✅ Passes `selectedClass` to fetch functions
- ✅ useEffect hooks trigger on class change

The problem was ONLY in the database data, not the code.

## How to Apply

1. Ensure `20260208_remove_duplicate_curriculum.sql` is deleted ✅
2. Run `20260208_verify_and_fix_curriculum.sql` in Supabase
3. Test in UI - modules and topics should now load

## Verification

```sql
-- Check 1: No NULL class_id values
SELECT COUNT(*) FROM curriculum WHERE class_id IS NULL;
-- Expected: 0

-- Check 2: Items per class (should be ~100 each)
SELECT class_id, COUNT(*) FROM curriculum GROUP BY class_id;
-- Expected: Each class has ~100 items

-- Check 3: Total items
SELECT COUNT(*) FROM curriculum;
-- Expected: number_of_classes × 100
```

## Summary
- **Problem**: Migration set all `class_id` to NULL
- **Solution**: Delete bad migration, run correct migration
- **Result**: Each class gets its own curriculum items with proper `class_id` values
- **Code**: Already correct, no changes needed

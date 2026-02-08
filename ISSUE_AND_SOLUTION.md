# Curriculum Loading Issue - Complete Analysis

## What's Happening

### Current Database State
```
Curriculum Table:
- Total items: 1888
- Categories: 4 (GT Suggested, Microsoft AI, Python Programming, Students Requested)
- Module names: ✅ Present (Module 53, Module 54, Module 65, etc.)
- Topics covered: ✅ Present
- Class ID: ❌ ALL NULL
```

### Why Modules Don't Load

**User Action:**
1. Opens Create Session dialog
2. Selects a class (e.g., Class 7)
3. Selects a category (e.g., "GT Suggested - Topics")
4. Expects modules to load → **EMPTY** ❌

**What the Code Does:**
```typescript
const fetchModules = async (category: string, classId?: string) => {
  let query = supabase
    .from('curriculum')
    .select('module_name')
    .eq('content_category', category)
    .not('module_name', 'is', null);

  if (classId) {
    query = query.eq('class_id', classId);  // Filter by class
  }

  const { data, error } = await query;
  // data = [] because no matches found
}
```

**What the Database Has:**
```sql
SELECT module_name FROM curriculum 
WHERE content_category = 'GT Suggested - Topics'
AND class_id = 'class-7-uuid';

-- Result: 0 rows (because all class_id are NULL)
```

## The Root Cause

The curriculum was imported with:
- ✅ `content_category` populated
- ✅ `module_name` populated
- ✅ `topics_covered` populated
- ❌ `class_id` NOT populated (all NULL)

When the code filters by `class_id`, it finds nothing.

## The Solution

### Migration: `20260208_assign_class_id_to_curriculum.sql`

**Step 1: Create copies for all classes**
```sql
INSERT INTO curriculum (content_category, module_no, module_name, topics_covered, ..., class_id)
SELECT c.*, cl.id as class_id
FROM curriculum c
CROSS JOIN classes cl
WHERE c.class_id IS NULL
```

Example:
- 1888 curriculum items with `class_id = NULL`
- 7 classes
- Result: 1888 × 7 = 13,216 items (1888 per class)

**Step 2: Delete NULL originals**
```sql
DELETE FROM curriculum WHERE class_id IS NULL;
```

**Step 3: Remove duplicates**
```sql
DELETE FROM curriculum
WHERE id NOT IN (
  SELECT DISTINCT ON (class_id, content_category, module_no, module_name, topics_covered) id
  FROM curriculum
  ORDER BY class_id, content_category, module_no, module_name, topics_covered, created_at ASC
);
```

## After the Fix

**Database will have:**
```
content_category | module_name | class_id
GT Suggested     | Module 53   | class-7-uuid
GT Suggested     | Module 54   | class-7-uuid
GT Suggested     | Module 53   | class-8-uuid
GT Suggested     | Module 54   | class-8-uuid
...
```

**Query will now work:**
```sql
SELECT module_name FROM curriculum 
WHERE content_category = 'GT Suggested - Topics'
AND class_id = 'class-7-uuid';

-- Result: Module 53, Module 54, Module 65, Module 66, Module 67, Module 68, ...
```

**UI will show:**
1. Select class → Categories load ✅
2. Select category → Modules load ✅
3. Select module → Topics load ✅

## How to Apply

1. Open Supabase SQL Editor
2. Copy and run: `supabase/migrations/20260208_assign_class_id_to_curriculum.sql`
3. Wait for completion
4. Test in the application

## Verification

```sql
-- Check 1: No NULL class_id
SELECT COUNT(*) FROM curriculum WHERE class_id IS NULL;
-- Expected: 0

-- Check 2: Items per class
SELECT class_id, COUNT(*) FROM curriculum GROUP BY class_id;
-- Expected: Each class has ~1888 items

-- Check 3: Modules for a class
SELECT DISTINCT module_name FROM curriculum 
WHERE class_id = 'ACTUAL_CLASS_ID'
ORDER BY module_name;
-- Expected: Module 53, Module 54, Module 65, etc.
```

## Summary

| Aspect | Before | After |
|--------|--------|-------|
| Curriculum items | 1888 | 13,216 (1888 × 7 classes) |
| Items with class_id | 0 | 13,216 |
| Items with NULL class_id | 1888 | 0 |
| Modules load when class selected | ❌ No | ✅ Yes |
| Topics load when module selected | ❌ No | ✅ Yes |

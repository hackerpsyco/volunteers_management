# Curriculum Class ID Issue - Diagnosis

## The Problem in Simple Terms

When you select a class and then try to select a category:
- The code runs: `SELECT module_name FROM curriculum WHERE content_category = 'X' AND class_id = 'CLASS-ID'`
- But the database has: `SELECT module_name FROM curriculum WHERE content_category = 'X' AND class_id = NULL`
- Result: **No matches found** → Empty dropdown

## Why This Happens

The curriculum table currently looks like this:

```
id    | content_category              | module_name | topics_covered | class_id
------|-------------------------------|-------------|----------------|----------
uuid1 | Students Requested - Topics   | Module 1    | Topic A        | NULL
uuid2 | Students Requested - Topics   | Module 1    | Topic B        | NULL
uuid3 | Students Requested - Topics   | Module 2    | Topic C        | NULL
...   | ...                           | ...         | ...            | NULL
```

But it SHOULD look like this:

```
id    | content_category              | module_name | topics_covered | class_id
------|-------------------------------|-------------|----------------|----------
uuid1 | Students Requested - Topics   | Module 1    | Topic A        | class-7-id
uuid2 | Students Requested - Topics   | Module 1    | Topic B        | class-7-id
uuid3 | Students Requested - Topics   | Module 2    | Topic C        | class-7-id
uuid4 | Students Requested - Topics   | Module 1    | Topic A        | class-8-id
uuid5 | Students Requested - Topics   | Module 1    | Topic B        | class-8-id
uuid6 | Students Requested - Topics   | Module 2    | Topic C        | class-8-id
...   | ...                           | ...         | ...            | ...
```

## The Code is Correct

The AddSessionDialog.tsx code is correct:

```typescript
const fetchModules = async (category: string, classId?: string) => {
  let query = supabase
    .from('curriculum')
    .select('module_name')
    .eq('content_category', category)
    .not('module_name', 'is', null);

  if (classId) {
    query = query.eq('class_id', classId);  // ✅ This is correct
  }

  const { data, error } = await query;
  // ...
}
```

The problem is NOT the code. The problem is the DATABASE DATA.

## The Solution

Run this migration to fix the database:

**File:** `supabase/migrations/20260208_verify_and_fix_curriculum.sql`

This migration:
1. Takes all curriculum items with `class_id = NULL`
2. Creates a copy for EACH class
3. Deletes the NULL originals
4. Removes duplicates

Result: Each class gets its own 100 curriculum items with proper `class_id` values.

## How to Verify the Fix Works

After running the migration, check:

```sql
-- Should show ~100 items per class
SELECT class_id, COUNT(*) FROM curriculum GROUP BY class_id;

-- Should show 0 (no NULL values)
SELECT COUNT(*) FROM curriculum WHERE class_id IS NULL;

-- Should show total items = number_of_classes × 100
SELECT COUNT(*) FROM curriculum;
```

Then test in UI:
1. Go to Create Session dialog
2. Select a class
3. Select a category → **Modules should now load** ✅
4. Select a module → **Topics should now load** ✅

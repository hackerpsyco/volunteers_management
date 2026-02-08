# Curriculum Class Setup Guide

## Problem
The curriculum table had no relationship to classes, so when you selected a class, no curriculum content appeared.

## Solution
We've created two migrations to fix this:

### 1. Add class_id column to curriculum
**File:** `supabase/migrations/20260208_add_class_to_curriculum.sql`
- Adds `class_id` column to link curriculum to classes
- Creates index for performance

### 2. Assign all curriculum to all classes
**File:** `supabase/migrations/20260208_assign_curriculum_to_all_classes.sql`
- Takes all existing curriculum items (with NULL class_id)
- Creates copies for EACH class
- Result: Each curriculum item is now available to all classes

## How It Works Now

### Form Flow:
1. **Select Class** → Loads categories for that class
2. **Select Category** → Loads modules for that class + category
3. **Select Module** → Loads topics for that class + category + module
4. **Select Topic** → Auto-fills content details

### Database Structure:
```
curriculum table:
- id (UUID)
- content_category (TEXT)
- module_name (TEXT)
- topics_covered (TEXT)
- videos (TEXT)
- quiz_content_ppt (TEXT)
- class_id (UUID) ← NEW - links to classes table
- created_at, updated_at
```

## What You Need To Do

### Step 1: Run the migrations
Execute both migration files in Supabase:
1. `20260208_add_class_to_curriculum.sql` - Adds the class_id column
2. `20260208_assign_curriculum_to_all_classes.sql` - Links all curriculum to all classes

### Step 2: Verify in Supabase
Check that curriculum table now has:
- `class_id` column populated
- Each curriculum item appears for each class

### Step 3: Test in the app
1. Open "Add Session" dialog
2. Select a class
3. Categories should now appear
4. Select category → modules appear
5. Select module → topics appear

## Example Data After Migration

Before:
```
curriculum:
- id: 1, topics_covered: "Algebra", class_id: NULL
- id: 2, topics_covered: "Geometry", class_id: NULL
```

After:
```
curriculum:
- id: 1, topics_covered: "Algebra", class_id: class-7-id
- id: 2, topics_covered: "Algebra", class_id: class-8-id
- id: 3, topics_covered: "Algebra", class_id: class-9-id
- id: 4, topics_covered: "Geometry", class_id: class-7-id
- id: 5, topics_covered: "Geometry", class_id: class-8-id
- id: 6, topics_covered: "Geometry", class_id: class-9-id
```

Each curriculum item is now duplicated for each class!

## Code Changes

### AddSessionDialog.tsx
- `fetchCategories()` - Now requires classId, returns empty if not provided
- `fetchModules()` - Now requires classId, returns empty if not provided
- `fetchTopics()` - Now requires classId, returns empty if not provided
- Form order: Class → Category → Module → Topic

### Calendar.tsx
- Added class filter alongside volunteer filter
- Sessions can be filtered by class and/or volunteer

## Troubleshooting

**Q: Still no curriculum showing?**
A: Make sure you ran the migration `20260208_assign_curriculum_to_all_classes.sql` to link curriculum to classes.

**Q: Curriculum appears multiple times?**
A: This is expected - each curriculum item is now linked to each class. This allows class-specific customization in the future.

**Q: Want to remove old NULL entries?**
A: Uncomment the DELETE line in the migration:
```sql
DELETE FROM public.curriculum WHERE class_id IS NULL;
```

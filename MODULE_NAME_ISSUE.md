# Module Name Display Issue

## The Problem

When you select a module, you see:
- "Module 53"
- "Module 54"
- "Module 65"
- etc.

But you want to see:
- "AI in Office 365"
- "Python Basics"
- etc.

## Root Cause

The curriculum data structure is:
```
module_no: 53
module_name: "Module 53"  ← Just a number, not descriptive
topics_covered: "AI in Office 365"  ← This is the actual topic name!
```

The code is displaying `module_name` (which is just "Module 53"), but the actual descriptive name is in `topics_covered`.

## The Data Structure

Looking at the curriculum table:
- `module_no`: Numeric ID (53, 54, 65, etc.)
- `module_name`: Generic name ("Module 53", "Module 54", etc.)
- `topics_covered`: Actual topic name ("AI in Office 365", "Python Basics", etc.)

## The Solution

The UI should display `topics_covered` instead of `module_name` when showing topics to the user.

### Current Flow (Wrong):
1. User selects category → Shows categories ✅
2. User selects module → Shows `module_name` ("Module 53") ❌
3. User selects topic → Shows `topics_covered` ("AI in Office 365") ✅

### Correct Flow:
1. User selects category → Shows categories ✅
2. User selects module → Shows `module_name` ("Module 53") - this is OK for grouping
3. User selects topic → Shows `topics_covered` ("AI in Office 365") ✅

## What Needs to Change

The AddSessionDialog.tsx should:
1. Group topics by `module_name` (for organization)
2. Display `topics_covered` as the topic name (for user readability)

Currently it's showing `topics_covered` in the topic dropdown, which is correct.

The issue might be that the dropdown is showing `module_name` instead of `topics_covered`.

## Verification

Run this query to see the data:
```sql
SELECT DISTINCT 
  content_category,
  module_name,
  topics_covered
FROM public.curriculum
WHERE content_category = 'GT Suggested - Topics'
ORDER BY module_name, topics_covered
LIMIT 20;
```

This will show:
```
content_category | module_name | topics_covered
GT Suggested     | Module 53   | AI in Office 365
GT Suggested     | Module 53   | Excel Automation
GT Suggested     | Module 54   | Python Basics
...
```

So the data is correct - `topics_covered` has the descriptive names.

The UI should display `topics_covered` in the dropdown, not `module_name`.

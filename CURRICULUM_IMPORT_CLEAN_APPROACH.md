# Curriculum Import - Clean Approach

## Overview
Simple, clean workflow for importing curriculum and creating sessions with proper class-based filtering.

## Database Structure
- **curriculum table** has: `module_no`, `module_name`, `topics_covered`, `class_id`, and other fields
- Each row represents a unique topic
- `module_no`: Number (e.g., 55, 56)
- `module_name`: Generic name (e.g., "Module 55")
- `topics_covered`: Full description (e.g., "55.2 Zyrobotics")
- `class_id`: UUID linking to specific class

## Import Flow (UnifiedImportDialog.tsx)

### Step 1: Upload File
- User uploads CSV or Excel file with curriculum data

### Step 2: Select Sheet (if Excel)
- If Excel has multiple sheets, user selects which sheet to import

### Step 3: Map Columns
- User maps CSV columns to database fields:
  - Content Category
  - Module No.
  - Module Name
  - Topics No. & name
  - Videos
  - QUIZ/CONTENT PPT

### Step 4: Select Class
- **NEW**: User selects which class this curriculum belongs to
- All imported rows get `class_id` set to selected class
- Each class gets its own copy of curriculum

### Step 5: Import
- Data is inserted with `class_id` for the selected class
- Batch processing (50 items per batch)

## Session Creation Flow (AddSessionDialog.tsx)

### Step 1: Select Class
- User selects a class
- Only that class's curriculum loads

### Step 2: Select Category
- `fetchCategories()` filters by `class_id`
- Shows only categories for selected class

### Step 3: Select Module
- `fetchModules()` filters by `class_id` and `content_category`
- Extracts descriptive name from `topics_covered`
- Displays: `{module_no}. {description}`
- Example: "55. Zyrobotics"

### Step 4: Select Topic
- `fetchTopics()` filters by `class_id`, `content_category`, and `module_no`
- Shows all topics for selected module
- Auto-fills videos and PPT links

## Key Changes Made

### 1. UnifiedImportDialog.tsx
- Added `class-select` step after column mapping
- `handleImport()` now adds `class_id` to every row
- User must select class before importing

### 2. AddSessionDialog.tsx
- `fetchModules()` extracts descriptive name from `topics_covered`
- Displays format: `{module_no}. {description}`
- `fetchTopics()` properly matches module by `module_no`
- All queries filter by `class_id`

### 3. Database
- Migration `20260208_clean_curriculum_start_fresh.sql` truncates old data
- Start fresh with clean import process

## Benefits
✓ Simple, clear workflow
✓ Each class has its own curriculum copy
✓ Proper filtering at every step
✓ Descriptive module names displayed
✓ No complex data transformations
✓ Easy to debug and maintain

# Curriculum Database Design

## Overview
The curriculum system stores educational content with support for videos, PPT resources, and session tracking (Fresh and Revision sessions).

## Table Structure

### curriculum
Main table for curriculum items
- `id` (UUID, PK)
- `content_category` (TEXT) - Category name (e.g., "Microsoft - AI Content")
- `module_no` (INTEGER) - Module number (e.g., 1, 2, 3)
- `module_name` (TEXT) - Module name/title
- `topics_covered` (TEXT) - Topic code and name (e.g., "1.1 Introduction of AI")
- `videos` (TEXT) - Video link/URL
- `quiz_content_ppt` (TEXT) - Quiz/Content PPT link/URL
- `fresh_session` (TEXT) - Fresh session information/link
- `revision_session` (TEXT) - Revision session information/link
- `created_at` (TIMESTAMP) - Record creation timestamp
- `updated_at` (TIMESTAMP) - Record update timestamp

## Key Features

### 1. Simple Flat Structure
- Single table design for easy data management
- Direct mapping from Excel columns to database fields
- No complex hierarchies or relationships

### 2. Resource Management
- Stores links to videos and PPT resources
- Supports session tracking for fresh and revision sessions
- All resources stored as URLs/links

### 3. Content Organization
- Organized by category, module, and topic
- Module numbers and topic codes preserved from source data
- Easy filtering and searching

## Indexes
- `idx_curriculum_category` - Fast lookup by content category
- `idx_curriculum_module` - Fast lookup by module number
- `idx_curriculum_topic` - Fast lookup by topic code

## Row Level Security (RLS)
Table has RLS enabled with policies allowing authenticated users to:
- SELECT (read) all data
- INSERT (create) new records
- UPDATE (modify) existing records
- DELETE (remove) records

## Data Import Flow

1. **CSV Parsing**: Extract data from Excel/CSV file
2. **Column Mapping**: Map Excel columns to database fields
3. **Data Transformation**: Handle empty cells and type conversion
4. **Batch Insert**: Insert data in batches of 50 records
5. **Validation**: Ensure required fields are present

## Column Mapping from Excel

| Excel Column | Database Field | Description |
|---|---|---|
| Content Category | content_category | Category name |
| Module No. & S.No | module_no | Module number |
| Modules | module_name | Module name/title |
| Topics No. & name | topics_covered | Topic code and name |
| Videos | videos | Video URL |
| QUIZ/CONTENT PPT | quiz_content_ppt | PPT URL |
| Fresh Session | fresh_session | Fresh session info |
| Revision Session | revision_session | Revision session info |

## Notes

- All timestamps are in UTC (TIMESTAMP WITH TIME ZONE)
- URLs are stored as TEXT fields
- Empty cells are handled gracefully during import
- Grouped cells (category, module) are inherited from previous rows during import

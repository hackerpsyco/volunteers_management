# Curriculum Database Design

## Overview
The curriculum system uses a hierarchical structure to organize educational content with support for multiple languages and session tracking.

## Table Relationships

```
content_categories (1) ──→ (many) modules
                                    ↓
                                  topics (1) ──→ (many) topic_sessions
```

## Tables

### 1. content_categories
Master table for content categories (e.g., "Microsoft - AI Content")
- `id` (UUID, PK)
- `name` (TEXT, UNIQUE) - Category name
- `description` (TEXT) - Optional description
- `created_at`, `updated_at` - Timestamps

### 2. modules
Modules within a category (e.g., "Overview of AI - Part A")
- `id` (UUID, PK)
- `category_id` (UUID, FK) - References content_categories
- `module_code` (TEXT) - Module number (e.g., "1", "2")
- `title` (TEXT) - Module title
- `description` (TEXT) - Optional description
- `created_at`, `updated_at` - Timestamps
- **Unique constraint**: (category_id, module_code)

### 3. topics
Topics within a module (e.g., "1.1 Introduction of AI")
- `id` (UUID, PK)
- `module_id` (UUID, FK) - References modules
- `topic_code` (TEXT) - Topic code extracted from title (e.g., "1.1")
- `title` (TEXT) - Full topic title
- `duration_min` (INTEGER) - Minimum duration in minutes
- `duration_max` (INTEGER) - Maximum duration in minutes
- `created_at`, `updated_at` - Timestamps
- **Unique constraint**: (module_id, topic_code)

### 4. topic_sessions
Sessions for a topic with different statuses (pending, available, completed, committed)
- `id` (UUID, PK)
- `topic_id` (UUID, FK) - References topics
- `status` (TEXT) - Session status (CHECK constraint)
- `mentor_name` (TEXT) - Session mentor/teacher name
- `mentor_email` (TEXT) - Session mentor email
- `session_date` (DATE) - Session date
- `session_time` (TIME) - Session time
- **English Resources**:
  - `video_english` (TEXT) - Video link
  - `worksheet_english` (TEXT) - Worksheet link
  - `practical_activity_english` (TEXT) - Practical activity link
- **Hindi Resources**:
  - `video_hindi` (TEXT) - Hindi video link
  - `worksheet_hindi` (TEXT) - Hindi worksheet link
  - `practical_activity_hindi` (TEXT) - Hindi practical activity link
- **Content**:
  - `quiz_content_ppt` (TEXT) - Quiz/content PPT link
  - `final_content_ppt` (TEXT) - Final content PPT link
- **Revision Information**:
  - `revision_status` (TEXT) - Revision status
  - `revision_mentor_name` (TEXT) - Revision mentor name
  - `revision_mentor_email` (TEXT) - Revision mentor email
  - `revision_date` (DATE) - Revision date
- `created_at`, `updated_at` - Timestamps

## Key Features

### 1. Hierarchical Organization
- Categories → Modules → Topics → Sessions
- Allows organizing content at multiple levels
- Supports sub-topics (topics without module codes use DEFAULT module)

### 2. Multi-Language Support
- Separate resource fields for English and Hindi
- Each session can have resources in both languages

### 3. Session Status Tracking
- `pending` - Session not yet scheduled
- `available` - Session available for enrollment
- `completed` - Session completed
- `committed` - Session committed/confirmed

### 4. Revision Tracking
- Separate revision status and mentor information
- Allows tracking of content revisions

### 5. Resource Management
- Stores links to videos, worksheets, practical activities, and PPTs
- Supports both English and Hindi versions

## Indexes
- `idx_modules_category_id` - Fast lookup of modules by category
- `idx_topics_module_id` - Fast lookup of topics by module
- `idx_topic_sessions_topic_id` - Fast lookup of sessions by topic
- `idx_topic_sessions_status` - Fast filtering by status
- `idx_topic_sessions_session_date` - Fast filtering by date
- `idx_topic_sessions_mentor_name` - Fast lookup by mentor

## Views

### curriculum_by_status
Denormalized view showing all curriculum data with joins:
- Combines all tables into a single queryable view
- Ordered by category → module → topic → status
- Used by the Curriculum UI for display

## Row Level Security (RLS)
All tables have RLS enabled with policies allowing authenticated users to:
- SELECT (read) all data
- INSERT (create) new records
- UPDATE (modify) existing records
- DELETE (remove) records

## Data Import Flow

1. **CSV Parsing**: Extract data from CSV file
2. **Header Detection**: Find the header row (row 3 in the provided CSV)
3. **Category Creation**: Create/upsert categories
4. **Module Creation**: Create/upsert modules (or DEFAULT for sub-topics)
5. **Topic Creation**: Create/upsert topics with extracted topic codes
6. **Session Insertion**: Batch insert all sessions

## Notes

- Foreign keys use ON DELETE CASCADE to maintain referential integrity
- UNIQUE constraints prevent duplicate entries at each level
- The DEFAULT module is used for topics without explicit module codes
- All timestamps are in UTC (TIMESTAMP WITH TIME ZONE)

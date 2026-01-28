# Database Schema Design

## Overview
Complete database schema for the Volunteer Management System including Centres, Time Slots, and Facilitators.

---

## Tables

### 1. **centres** Table
Stores information about volunteer centres/locations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| name | TEXT | NOT NULL | Centre name |
| location | TEXT | NOT NULL | City or region |
| address | TEXT | - | Full address |
| phone | TEXT | - | Contact phone number |
| email | TEXT | - | Contact email |
| status | TEXT | DEFAULT 'active' | Status: active or inactive |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_centres_status` - For filtering by status

**RLS Policies:**
- SELECT: Authenticated users only
- INSERT: Authenticated users only
- UPDATE: Authenticated users only
- DELETE: Authenticated users only

---

### 2. **centre_time_slots** Table
Stores time slots for each centre (when sessions can be held).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| centre_id | UUID | FOREIGN KEY (centres) | Reference to centre |
| day | TEXT | NOT NULL, CHECK | Day of week (Monday-Sunday) |
| start_time | TIME | NOT NULL | Session start time |
| end_time | TIME | NOT NULL | Session end time |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_centre_time_slots_centre_id` - For querying slots by centre

**Foreign Keys:**
- `centre_id` → `centres(id)` ON DELETE CASCADE

**RLS Policies:**
- SELECT: Authenticated users only
- INSERT: Authenticated users only
- UPDATE: Authenticated users only
- DELETE: Authenticated users only

---

### 3. **facilitators** Table
Stores information about facilitators/instructors.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| name | TEXT | NOT NULL | Facilitator name |
| email | TEXT | - | Email address |
| phone | TEXT | - | Phone number |
| organization | TEXT | - | Organization/Company |
| expertise | TEXT | - | Area of expertise |
| status | TEXT | DEFAULT 'active' | Status: active or inactive |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_facilitators_status` - For filtering by status

**RLS Policies:**
- SELECT: Authenticated users only
- INSERT: Authenticated users only
- UPDATE: Authenticated users only
- DELETE: Authenticated users only

---

## Relationships

```
centres (1) ──── (Many) centre_time_slots
  ↓
  Each centre can have multiple time slots
  When a centre is deleted, all its time slots are deleted (CASCADE)
```

---

## Data Constraints

### centres.status
- Values: `'active'` | `'inactive'`
- Default: `'active'`

### centre_time_slots.day
- Values: `'Monday'` | `'Tuesday'` | `'Wednesday'` | `'Thursday'` | `'Friday'` | `'Saturday'` | `'Sunday'`
- Required: Yes

### centre_time_slots.start_time & end_time
- Format: TIME (HH:MM:SS)
- Example: '09:00:00', '17:00:00'

### facilitators.status
- Values: `'active'` | `'inactive'`
- Default: `'active'`

---

## Row Level Security (RLS)

All tables have RLS enabled with policies that allow:
- **SELECT**: Authenticated users can read all records
- **INSERT**: Authenticated users can create new records
- **UPDATE**: Authenticated users can update records
- **DELETE**: Authenticated users can delete records

---

## Migration Instructions

### Step 1: Apply Migration in Supabase
1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Copy the SQL from `supabase/migrations/20260128_create_centres_and_facilitators.sql`
5. Execute the query

### Step 2: Verify Tables Created
```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

### Step 3: Test RLS Policies
```sql
-- Test as authenticated user
SELECT * FROM centres;
SELECT * FROM centre_time_slots;
SELECT * FROM facilitators;
```

---

## Example Data

### Insert Centre
```sql
INSERT INTO centres (name, location, address, phone, email, status)
VALUES (
  'Downtown Centre',
  'New York',
  '123 Main St, New York, NY 10001',
  '+1-555-0123',
  'downtown@example.com',
  'active'
);
```

### Insert Time Slot
```sql
INSERT INTO centre_time_slots (centre_id, day, start_time, end_time)
VALUES (
  'centre-uuid-here',
  'Monday',
  '09:00:00',
  '17:00:00'
);
```

### Insert Facilitator
```sql
INSERT INTO facilitators (name, email, phone, organization, expertise, status)
VALUES (
  'John Doe',
  'john@example.com',
  '+1-555-0456',
  'Tech Corp',
  'Web Development',
  'active'
);
```

---

## Performance Considerations

1. **Indexes**: Created on frequently queried columns (status, centre_id)
2. **Cascading Deletes**: Deleting a centre automatically deletes its time slots
3. **RLS**: Policies are optimized for authenticated user access
4. **Timestamps**: Automatic tracking of creation and update times

---

## Future Enhancements

- Add relationship between facilitators and centres
- Add relationship between facilitators and sessions
- Add capacity tracking for time slots
- Add booking/reservation system
- Add audit logging for changes


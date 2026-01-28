# Database Setup Instructions

## Quick Start

### Step 1: Access Supabase Dashboard
1. Go to https://supabase.com
2. Login to your project
3. Click on "SQL Editor" in the left sidebar

### Step 2: Create Tables
Copy and paste the entire SQL from the migration file:
**File:** `supabase/migrations/20260128_create_centres_and_facilitators.sql`

Then execute it.

### Step 3: Verify Tables
Run this query to confirm tables were created:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see:
- `centres`
- `centre_time_slots`
- `facilitators`
- `curriculum`
- `sessions`
- `volunteers`

---

## Tables Created

### 1. **centres**
- Stores volunteer centre information
- Fields: name, location, address, phone, email, status
- Status: active/inactive

### 2. **centre_time_slots**
- Stores available time slots for each centre
- Fields: centre_id, day, start_time, end_time
- Days: Monday-Sunday
- Linked to centres table (CASCADE delete)

### 3. **facilitators**
- Stores facilitator/instructor information
- Fields: name, email, phone, organization, expertise, status
- Status: active/inactive

---

## Application Features

### Centres Page (`src/pages/Centres.tsx`)
- Create new centres with integrated time slots
- View all centres with their time slots
- Edit centre details
- Delete centres (cascades to time slots)
- Add multiple time slots when creating a centre

### Facilitators Page (`src/pages/Facilitators.tsx`)
- Create new facilitators
- View all facilitators
- Edit facilitator details
- Delete facilitators
- Filter by status

---

## Testing the Setup

### Test 1: Create a Centre with Time Slots
1. Go to Centres page
2. Click "New Centre"
3. Fill in centre details
4. Add multiple time slots
5. Click "Create Centre & Slots"
6. Verify centre appears with time slots

### Test 2: View Time Slots
1. Go to Centres page
2. Find a centre with time slots
3. Verify time slots display below centre details
4. Format: "Day: HH:MM - HH:MM"

### Test 3: Create a Facilitator
1. Go to Facilitators page
2. Click "New Facilitator"
3. Fill in facilitator details
4. Click "Add Facilitator"
5. Verify facilitator appears in list

---

## Troubleshooting

### Issue: Tables not appearing
**Solution:** 
- Refresh the page
- Check Supabase dashboard for errors
- Verify SQL was executed successfully

### Issue: Can't insert data
**Solution:**
- Check RLS policies are enabled
- Verify you're logged in as authenticated user
- Check for constraint violations

### Issue: Time slots not showing
**Solution:**
- Verify centre_time_slots table exists
- Check foreign key relationship
- Verify centre_id is correct

---

## Database Relationships

```
centres (1) ──── (Many) centre_time_slots
  ↓
  Each centre can have multiple time slots
  Deleting a centre deletes all its time slots
```

---

## SQL Queries Reference

### Get all centres with their time slots
```sql
SELECT 
  c.id,
  c.name,
  c.location,
  c.status,
  json_agg(
    json_build_object(
      'day', cts.day,
      'start_time', cts.start_time,
      'end_time', cts.end_time
    )
  ) as time_slots
FROM centres c
LEFT JOIN centre_time_slots cts ON c.id = cts.centre_id
GROUP BY c.id, c.name, c.location, c.status;
```

### Get active centres only
```sql
SELECT * FROM centres WHERE status = 'active';
```

### Get time slots for a specific centre
```sql
SELECT * FROM centre_time_slots 
WHERE centre_id = 'centre-uuid-here'
ORDER BY 
  CASE day 
    WHEN 'Monday' THEN 1
    WHEN 'Tuesday' THEN 2
    WHEN 'Wednesday' THEN 3
    WHEN 'Thursday' THEN 4
    WHEN 'Friday' THEN 5
    WHEN 'Saturday' THEN 6
    WHEN 'Sunday' THEN 7
  END;
```

### Get all active facilitators
```sql
SELECT * FROM facilitators WHERE status = 'active' ORDER BY name;
```

---

## Next Steps

1. ✅ Create tables using migration SQL
2. ✅ Verify tables in Supabase dashboard
3. ✅ Test creating centres with time slots
4. ✅ Test creating facilitators
5. ✅ Deploy to production


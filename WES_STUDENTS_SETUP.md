# WES Fellow Students Setup Guide

## Overview
This guide explains how to create auth accounts and user profiles for all 17 WES Fellow students.

## Student Data
All students are assigned to the **CCC (11+12+1st Y+2ndY+3rdYr)** class.

**Password Format:** FirstName+123
- Example: Narghis Khan → `Narghis+123`
- Example: Mohammad Ittehad → `Mohammad+123`

## Students List
| ID | Name | Email | Password |
|---|---|---|---|
| EMP2501 | Narghis Khan | nargish.ccc2526@gmail.com | Narghis+123 |
| EMP2502 | Mohammad Ittehad | ittehad.ccc2526@gmail.com | Mohammad+123 |
| EMP2503 | Mahak Khan | mahakkhan.ccc2526@gmail.com | Mahak+123 |
| EMP2504 | Anjali Morya | anjali.ccc2526@gmail.com | Anjali+123 |
| EMP2505 | Akash Verma | akashverma.ccc2526@gmail.com | Akash+123 |
| EMP2506 | Paras Barman | parasbarman.ccc2526@gmail.com | Paras+123 |
| EMP2507 | Nasreen Bano | nashreen.ccc2526@gmail.com | Nasreen+123 |
| EMP2510 | Sonali Malaiya | sonali.ccc2526@gmail.com | Sonali+123 |
| EMP2512 | Harsita Panika | harshita.ccc2526@gmail.com | Harsita+123 |
| EMP2513 | Anchal Singh Gond | anchal.ccc2526@gmail.com | Anchal+123 |
| EMP2514 | Saroj Panika | Sarojpanika.ccc2526@gmail.com | Saroj+123 |
| EMP2515 | Shivam Dahiya | Shivamdahiya.ccc2526@gmail.com | Shivam+123 |
| EMP2517 | Aarzoo Khanam | arzoo.ccc2526@gmail.com | Aarzoo+123 |
| EMP2519 | Vaishnavi Varman | vaishnavi.ccc2526@gmail.com | Vaishnavi+123 |
| EMP2521 | Aasifa Begam | aasifa.ccc2526@gmail.com | Aasifa+123 |
| EMP2523 | Minakshi Barman | minakshibarmanccc@gmail.com | Minakshi+123 |
| EMP2525 | Alkama Bee | alkamabeeccc@gmail.com | Alkama+123 |
| EMP2526 | Warisun | varsunnishaccc@gmail.com | Warisun+123 |

## Setup Methods

### Method 1: Using Node.js Script (Recommended)

**Prerequisites:**
- Node.js installed
- Supabase project URL
- Supabase Service Role Key (from Settings > API)

**Steps:**

1. Set environment variables:
```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

2. Run the script:
```bash
node scripts/create-wes-students.js
```

This will:
- Create auth accounts for all students
- Set their passwords to FirstName+123
- Create user_profiles linked to the CCC class
- Display success/failure status for each student

### Method 2: Using Supabase Dashboard

1. Go to your Supabase project
2. Navigate to **Authentication > Users**
3. Click **Add user**
4. For each student:
   - Email: (from the table above)
   - Password: FirstName+123 (from the table above)
   - Click **Create user**

### Method 3: Using SQL Migration

1. Run the migration to create user_profiles:
```bash
supabase migration up
```

This creates the user_profiles entries. However, auth.users must be created via the dashboard or API.

## Verification

After creating the accounts, verify they were set up correctly:

1. **Check auth users:**
   - Go to Supabase Dashboard > Authentication > Users
   - Should see all 17 students listed

2. **Check user_profiles:**
   - Query: `SELECT * FROM user_profiles WHERE email LIKE '%.ccc2526@gmail.com'`
   - Should return 17 rows with class_id set to CCC class

3. **Test login:**
   - Try logging in with one student's email and password
   - Should see their dashboard with CCC class tasks and sessions

## Files Created

- `supabase/migrations/20260226_create_wes_fellow_students.sql` - Creates user_profiles
- `supabase/migrations/20260227_create_wes_fellow_auth_users.sql` - SQL reference (auth.users must be created via API)
- `scripts/create-wes-students.js` - Node.js script to create auth accounts
- `WES_STUDENTS_SETUP.md` - This guide

## Troubleshooting

**Error: "User already exists"**
- The email is already registered in Supabase
- Check if the user already exists in the dashboard

**Error: "Invalid email"**
- Check the email format in the data
- Ensure no typos in email addresses

**Students can't log in**
- Verify the password is exactly: FirstName+123
- Check that user_profiles has the correct class_id
- Ensure the student role exists in the roles table

## Next Steps

After creating the accounts:
1. Students can log in with their email and password
2. They'll see their class dashboard
3. They can view tasks and sessions for the CCC class
4. Admins can assign tasks to the class

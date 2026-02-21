# Webhook EventId Mismatch - Debug Guide

## The Problem
- ✅ Recording created in Google Drive
- ✅ Webhook received the message (200 OK)
- ❌ Database NOT updated (still shows "⏳ Pending")
- ❌ Reason: `eventId` from webhook ≠ `google_event_id` in database

## How to Check

### Step 1: Check Webhook Logs
1. Go to Supabase Dashboard
2. Functions → handle-recording-webhook
3. Click "Logs" tab
4. Look for the latest webhook call
5. Find this line: `"No session found for eventId: ..."`
6. Copy the eventId

### Step 2: Check Database
Run this query in Supabase SQL Editor:

```sql
-- Check what google_event_id is stored in your session
SELECT 
  id,
  title,
  topics_covered,
  google_event_id,
  recording_status,
  created_at
FROM sessions
WHERE topics_covered LIKE '%Data Visualization%'
ORDER BY created_at DESC
LIMIT 5;
```

### Step 3: Compare
- Webhook eventId: `abc123xyz...`
- Database google_event_id: `def456uvw...`
- If they don't match → That's the problem!

## Why They Don't Match

### Possible Causes:

1. **Calendar sync failed silently**
   - Session created but google_event_id not stored
   - Check AddSessionDialog logs

2. **Wrong eventId format**
   - Webhook sends different format than expected
   - Check webhook logs for raw message

3. **Multiple sessions created**
   - You created multiple sessions
   - Webhook is updating a different session
   - Check which session has the recording

## The Fix

### Option 1: Manual Update (Quick)
Use "Update Recording" button:
1. Go to Sessions page
2. Find your session
3. Click "..." menu → "Update Recording"
4. Paste Google Drive URL
5. Click "Update Recording"

### Option 2: Check Logs (Diagnostic)
Share the webhook logs so we can see:
- What eventId Google sent
- Why it didn't match
- How to fix the matching logic

## What to Share

When you reply, please share:
1. The eventId from webhook logs
2. The google_event_id from database
3. Screenshot of the session in Sessions page
4. The webhook log entry (full text)

This will help us fix the eventId matching issue.

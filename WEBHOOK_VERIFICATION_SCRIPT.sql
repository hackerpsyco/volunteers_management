-- Webhook Verification Script
-- Run these queries to verify the webhook is working correctly

-- ============================================
-- 1. CHECK IF SESSIONS HAVE google_event_id
-- ============================================
-- This is critical - if google_event_id is NULL, webhook can't find the session
SELECT 
  COUNT(*) as total_sessions,
  COUNT(CASE WHEN google_event_id IS NOT NULL THEN 1 END) as sessions_with_event_id,
  COUNT(CASE WHEN google_event_id IS NULL THEN 1 END) as sessions_without_event_id
FROM sessions;

-- Show sessions with google_event_id
SELECT 
  id,
  title,
  google_event_id,
  created_at
FROM sessions
WHERE google_event_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- 2. CHECK RECORDING STATUS UPDATES
-- ============================================
-- See which sessions have recording data
SELECT 
  id,
  title,
  google_event_id,
  recording_status,
  recording_url,
  recording_duration,
  recording_size,
  recording_created_at,
  updated_at
FROM sessions
WHERE recording_status IS NOT NULL
ORDER BY recording_created_at DESC
LIMIT 10;

-- ============================================
-- 3. CHECK FOR PENDING RECORDINGS
-- ============================================
-- These are recordings that haven't been processed yet
SELECT 
  id,
  title,
  google_event_id,
  recording_status,
  recording_created_at,
  EXTRACT(EPOCH FROM (NOW() - recording_created_at)) as seconds_since_update
FROM sessions
WHERE recording_status = 'pending'
ORDER BY recording_created_at DESC;

-- ============================================
-- 4. CHECK FOR FAILED RECORDINGS
-- ============================================
-- These are recordings that failed to process
SELECT 
  id,
  title,
  google_event_id,
  recording_status,
  recording_created_at
FROM sessions
WHERE recording_status = 'failed'
ORDER BY recording_created_at DESC;

-- ============================================
-- 5. CHECK FOR AVAILABLE RECORDINGS
-- ============================================
-- These are successfully processed recordings
SELECT 
  id,
  title,
  google_event_id,
  recording_status,
  recording_url,
  recording_duration,
  recording_created_at
FROM sessions
WHERE recording_status = 'available'
ORDER BY recording_created_at DESC
LIMIT 10;

-- ============================================
-- 6. FIND SESSIONS BY EVENT ID
-- ============================================
-- Use this to find a specific session if you know the event ID
-- Replace 'YOUR_EVENT_ID' with the actual event ID from the webhook
SELECT 
  id,
  title,
  google_event_id,
  recording_status,
  recording_url,
  recording_duration,
  recording_size,
  recording_created_at,
  updated_at
FROM sessions
WHERE google_event_id = 'YOUR_EVENT_ID';

-- ============================================
-- 7. CHECK RECENT SESSION UPDATES
-- ============================================
-- See which sessions were recently updated (likely by webhook)
SELECT 
  id,
  title,
  google_event_id,
  recording_status,
  recording_url,
  updated_at,
  EXTRACT(EPOCH FROM (NOW() - updated_at)) as seconds_since_update
FROM sessions
WHERE updated_at > NOW() - INTERVAL '1 hour'
ORDER BY updated_at DESC
LIMIT 20;

-- ============================================
-- 8. VERIFY RECORDING FIELDS EXIST
-- ============================================
-- Check if the recording columns were added to sessions table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'sessions' 
  AND column_name LIKE 'recording%'
ORDER BY column_name;

-- ============================================
-- 9. CHECK FOR DUPLICATE RECORDINGS
-- ============================================
-- Ensure no session has multiple recording updates
SELECT 
  google_event_id,
  COUNT(*) as count,
  MAX(recording_created_at) as latest_update
FROM sessions
WHERE google_event_id IS NOT NULL 
  AND recording_status IS NOT NULL
GROUP BY google_event_id
HAVING COUNT(*) > 1;

-- ============================================
-- 10. MANUAL UPDATE TEST
-- ============================================
-- Use this to manually test if the UI updates work
-- Replace 'SESSION_ID' with an actual session ID
-- This simulates what the webhook should do
/*
UPDATE sessions
SET 
  recording_status = 'available',
  recording_url = 'https://drive.google.com/file/d/test-file-id/view',
  recording_duration = 3600,
  recording_size = '500MB',
  recording_created_at = NOW()
WHERE id = 'SESSION_ID';

-- Verify the update
SELECT 
  id,
  title,
  recording_status,
  recording_url,
  recording_duration,
  recording_created_at
FROM sessions
WHERE id = 'SESSION_ID';
*/

-- ============================================
-- 11. CHECK SESSION CREATION FLOW
-- ============================================
-- Verify sessions are being created with all required fields
SELECT 
  id,
  title,
  session_date,
  session_time,
  google_event_id,
  meeting_link,
  created_at
FROM sessions
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 20;

-- ============================================
-- 12. IDENTIFY SESSIONS MISSING EVENT ID
-- ============================================
-- These sessions won't receive webhook updates
SELECT 
  id,
  title,
  session_date,
  session_time,
  created_at
FROM sessions
WHERE google_event_id IS NULL
  AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- ============================================
-- 13. CHECK RECORDING STATUS DISTRIBUTION
-- ============================================
-- See the breakdown of recording statuses
SELECT 
  recording_status,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
FROM sessions
WHERE recording_status IS NOT NULL
GROUP BY recording_status
ORDER BY count DESC;

-- ============================================
-- 14. FIND OLDEST PENDING RECORDINGS
-- ============================================
-- These might indicate a problem if they're too old
SELECT 
  id,
  title,
  google_event_id,
  recording_status,
  recording_created_at,
  EXTRACT(EPOCH FROM (NOW() - recording_created_at)) / 3600 as hours_pending
FROM sessions
WHERE recording_status = 'pending'
ORDER BY recording_created_at ASC;

-- ============================================
-- 15. EXPORT RECORDING DATA FOR ANALYSIS
-- ============================================
-- Get all recording data in a format suitable for analysis
SELECT 
  id,
  title,
  google_event_id,
  recording_status,
  recording_url,
  recording_duration,
  recording_size,
  recording_created_at,
  updated_at,
  CASE 
    WHEN recording_status = 'available' THEN 'SUCCESS'
    WHEN recording_status = 'pending' THEN 'WAITING'
    WHEN recording_status = 'failed' THEN 'ERROR'
    ELSE 'UNKNOWN'
  END as status_category
FROM sessions
WHERE recording_status IS NOT NULL
ORDER BY recording_created_at DESC;

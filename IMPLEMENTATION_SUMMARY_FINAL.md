# Google Meet Recording Webhook - Implementation Summary

## Overview

The Google Meet recording webhook system has been **fully implemented** on the backend and frontend. Recordings will automatically appear in the Sessions page once you complete the manual Google Cloud Pub/Sub setup.

---

## What Was Built

### Backend (Supabase Edge Function)
**File:** `supabase/functions/handle-recording-webhook/index.ts`

A Deno-based Edge Function that:
- Receives webhook notifications from Google Cloud Pub/Sub
- Validates incoming webhook payloads
- Matches Google Calendar event ID to sessions in database
- Updates session with recording metadata (URL, duration, size, status)
- Handles errors gracefully with detailed logging
- Returns appropriate HTTP responses

**Status:** ✅ Ready to deploy

### Frontend (Sessions Page)
**File:** `src/pages/Sessions.tsx`

Updated to display recordings:
- **Desktop:** Added "Recording" column to sessions table
- **Mobile:** Added "Recording Status" section to session cards
- Shows recording status with visual indicators:
  - 📹 View Recording (clickable link when available)
  - ⏳ Processing (yellow badge when pending)
  - ❌ Failed (red badge when failed)
- Displays recording duration and file size

**Status:** ✅ Fully implemented

### Database Schema
**Table:** `sessions`

Recording columns already exist:
- `recording_url` - Link to recording in Google Drive
- `recording_status` - Status (available, pending, failed)
- `recording_duration` - Duration in seconds
- `recording_size` - File size string
- `recording_created_at` - Timestamp when recording was created
- `google_event_id` - Google Calendar event ID (used to match webhook)

**Status:** ✅ Ready to use

---

## Architecture

### Correct Flow (Pub/Sub Based)

```
Google Meet Records
    ↓
Google Cloud Pub/Sub Topic (meet-events)
    ↓
Push Subscription (meet-recording-webhook)
    ↓
Supabase Edge Function (handle-recording-webhook)
    ↓
Database Update (sessions table)
    ↓
Recording Appears in Sessions Page
```

### Why This Architecture?

Google Meet doesn't have direct webhooks. Instead, it publishes events to Google Cloud Pub/Sub, which then forwards them to your webhook via a Push Subscription. This is the standard Google Cloud event distribution pattern.

---

## Implementation Details

### Webhook Handler Logic

1. **Receive Request**
   - Accepts POST requests from Pub/Sub
   - Validates payload structure
   - Checks for required `eventId` field

2. **Match Session**
   - Queries sessions table for matching `google_event_id`
   - Returns 404 if no session found (expected for test webhooks)

3. **Update Recording**
   - Updates `recording_status` with webhook status
   - If status is "available", also updates:
     - `recording_url` - Link to recording
     - `recording_duration` - Duration in seconds
     - `recording_size` - File size
   - Sets `recording_created_at` timestamp

4. **Error Handling**
   - Validates environment variables
   - Catches database errors
   - Logs all operations for debugging
   - Returns appropriate HTTP status codes

### Webhook Payload Format

```json
{
  "eventId": "google-calendar-event-id",
  "recordingUrl": "https://drive.google.com/file/d/...",
  "recordingDuration": 3600,
  "recordingSize": "500MB",
  "status": "available"
}
```

### Recording Statuses

- **available** - Recording is ready to view
- **pending** - Recording is being processed
- **failed** - Recording failed to process

---

## What You Need to Do

### Step 1: Create Pub/Sub Topic

1. Go to: https://console.cloud.google.com/cloudpubsub
2. Click **CREATE TOPIC**
3. Name: `meet-events`
4. Click **CREATE TOPIC**

### Step 2: Create Push Subscription

1. Click on the `meet-events` topic
2. Go to **SUBSCRIPTIONS** tab
3. Click **CREATE SUBSCRIPTION**
4. Fill in:
   - **Subscription ID:** `meet-recording-webhook`
   - **Delivery Type:** Push
   - **Push endpoint:** `https://your-project-id.supabase.co/functions/v1/handle-recording-webhook`
5. Click **CREATE**

### Step 3: Deploy Webhook Handler

```bash
supabase functions deploy handle-recording-webhook
```

### Step 4: Add Environment Variables

In Supabase Dashboard:
1. Go to Settings → Secrets
2. Add these secrets:

```
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Step 5: Test

Send a test message to Pub/Sub:

```bash
gcloud pubsub topics publish meet-events \
  --message '{
    "eventId": "test-123",
    "recordingUrl": "https://drive.google.com/file/d/test",
    "recordingDuration": 3600,
    "recordingSize": "500MB",
    "status": "available"
  }'
```

Check the logs:
1. Supabase Dashboard → Functions
2. Click `handle-recording-webhook`
3. Go to Logs tab
4. You should see the webhook execution

---

## End-to-End Flow

### When a Session is Created

1. User creates session in Sessions page
2. Session stores `google_event_id` from Google Calendar event

### When a Meeting is Hosted

1. Facilitator hosts Google Meet
2. Meeting is recorded

### When Recording is Available

1. Google Meet saves recording to Google Drive
2. Google publishes event to Pub/Sub topic
3. Pub/Sub subscription receives event
4. Pub/Sub sends POST request to webhook URL
5. Webhook handler receives request
6. Webhook matches `eventId` to session's `google_event_id`
7. Webhook updates session with recording metadata
8. Sessions page fetches updated session
9. Recording column shows "📹 View Recording"
10. User can click to view recording in Google Drive

---

## Testing Checklist

- [ ] Pub/Sub topic created: `meet-events`
- [ ] Push subscription created: `meet-recording-webhook`
- [ ] Webhook URL configured in subscription
- [ ] Webhook handler deployed
- [ ] Environment variables added to Supabase Secrets
- [ ] Test message sent to Pub/Sub
- [ ] Logs show webhook execution
- [ ] Database updated with test data
- [ ] Sessions page displays recording

---

## Troubleshooting

### Webhook Not Receiving

**Problem:** Pub/Sub subscription not sending requests to webhook

**Solutions:**
- Verify webhook URL is correct in subscription settings
- Verify webhook URL is publicly accessible
- Check Supabase function logs for errors
- Ensure environment variables are set

### Recording Not Appearing

**Problem:** Recording metadata not showing in Sessions page

**Solutions:**
- Verify `google_event_id` is stored in session
- Verify webhook payload has correct `eventId`
- Check Supabase function logs for errors
- Verify database columns exist and are accessible

### Logs Show Errors

**Problem:** Webhook execution shows errors in logs

**Solutions:**
- Check environment variables are set correctly
- Verify Supabase URL and service role key are correct
- Check database permissions
- Verify session exists with matching `google_event_id`

### Pub/Sub Topic Not Found

**Problem:** Can't find Pub/Sub topic in Google Cloud Console

**Solutions:**
- Ensure you're in correct Google Cloud project
- Ensure Pub/Sub API is enabled
- Check project ID is correct

---

## Files Reference

### Code Files (Ready to Deploy)

- `supabase/functions/handle-recording-webhook/index.ts` - Webhook handler
- `supabase/functions/handle-recording-webhook/deno.json` - Deno configuration
- `supabase/functions/handle-recording-webhook/README.md` - Function documentation
- `src/pages/Sessions.tsx` - Recording display in Sessions page

### Documentation Files

- `PUBSUB_WEBHOOK_CORRECT.md` - **START HERE** - Correct 3-step setup guide
- `CORRECTION_PUBSUB_APPROACH.md` - Explains what was wrong and why
- `QUICK_START_WEBHOOK.md` - Quick reference guide
- `GOOGLE_MEET_WEBHOOK_SETUP.md` - Complete setup guide
- `WEBHOOK_IMPLEMENTATION_COMPLETE.md` - Implementation status

---

## Key Differences from Old Documentation

Many blogs and tutorials incorrectly describe Google Meet webhooks. Here's what changed:

| Old (Wrong) | New (Correct) |
|------------|---------------|
| Add webhook in Meet API UI | Create Pub/Sub topic |
| Direct webhooks from Meet | Push subscription from Pub/Sub |
| Configure in Meet API settings | Configure in Google Cloud Pub/Sub |
| No Pub/Sub needed | Pub/Sub is required |

**Key Takeaway:** Google Meet doesn't have direct webhooks. It uses Google Cloud Pub/Sub to publish events.

---

## Next Steps

1. **Read:** `PUBSUB_WEBHOOK_CORRECT.md` for detailed setup instructions
2. **Create:** Pub/Sub topic in Google Cloud Console
3. **Create:** Push subscription with your Supabase webhook URL
4. **Deploy:** Webhook handler with `supabase functions deploy handle-recording-webhook`
5. **Configure:** Environment variables in Supabase Secrets
6. **Test:** Send test message to Pub/Sub
7. **Monitor:** Check Supabase function logs
8. **Verify:** Create a session and host a meeting to test end-to-end

---

## Support Resources

- **Google Cloud Pub/Sub Documentation:** https://cloud.google.com/pubsub/docs
- **Google Meet API Documentation:** https://developers.google.com/meet
- **Supabase Functions Documentation:** https://supabase.com/docs/guides/functions
- **Supabase Edge Functions Deployment:** https://supabase.com/docs/guides/functions/deploy

---

## Summary

✅ **Backend:** Webhook handler fully implemented and ready to deploy
✅ **Frontend:** Sessions page updated to display recordings
✅ **Database:** Schema ready with all recording columns
✅ **Documentation:** Comprehensive guides created

⏳ **Waiting for:** Manual Google Cloud Pub/Sub setup

Once you complete the Pub/Sub setup, recordings will automatically appear in the Sessions page when meetings are recorded.

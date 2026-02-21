# Google Meet Recording Webhook Handler

## Overview

This Supabase Edge Function receives webhook notifications from Google Meet when recordings are available and updates the corresponding session with recording metadata.

## How It Works

1. Google Meet records a session
2. Recording is saved to Google Drive
3. Google sends webhook notification to this function
4. Function matches Google Calendar event ID to session
5. Function updates session with recording data
6. Recording appears in Sessions page

## Webhook Payload

```json
{
  "eventId": "google-calendar-event-id",
  "recordingUrl": "https://drive.google.com/file/d/...",
  "recordingDuration": 3600,
  "recordingSize": "500MB",
  "status": "available"
}
```

## Environment Variables Required

```
GOOGLE_SERVICE_ACCOUNT_EMAIL=wes-volunteer-service@project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Deployment

```bash
supabase functions deploy handle-recording-webhook
```

## Testing

### Test with curl
```bash
curl -X POST https://your-project-id.supabase.co/functions/v1/handle-recording-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "test-event-123",
    "recordingUrl": "https://drive.google.com/file/d/test",
    "recordingDuration": 3600,
    "recordingSize": "500MB",
    "status": "available"
  }'
```

### Expected Response
```json
{
  "warning": "No session found for this event",
  "eventId": "test-event-123"
}
```

This is expected - it means the webhook is working but there's no session with that event ID.

## Database Updates

The function updates the `sessions` table with:
- `recording_url` - Link to recording in Google Drive
- `recording_status` - Status (available, pending, failed)
- `recording_duration` - Duration in seconds
- `recording_size` - File size
- `recording_created_at` - When recording was created

## Error Handling

The function handles:
- Missing eventId
- Invalid JSON payload
- Missing environment variables
- Database errors
- Sessions not found

All errors are logged to Supabase function logs.

## Logs

View logs in Supabase Dashboard:
1. Functions → handle-recording-webhook
2. Logs tab
3. Shows all webhook executions and errors

## Troubleshooting

### Webhook Not Received
- Verify webhook URL is correct
- Verify webhook URL is publicly accessible
- Check Google Cloud Console webhook configuration
- Check function logs for errors

### Recording Not Appearing
- Verify google_event_id is stored in session
- Verify webhook payload has correct eventId
- Check function logs for errors
- Verify database columns exist

### "No session found for this event"
- This is expected for test webhooks
- Verify google_event_id matches eventId in webhook
- Check database for sessions with matching google_event_id

## Security

- Webhook validates payload structure
- Webhook validates required fields
- Webhook uses service role key for database access
- Webhook logs all events for audit trail

For production, consider adding:
- Webhook signature verification
- Rate limiting
- Request validation
- Error alerts

## Performance

- Webhook processes in < 1 second
- Database update is atomic
- No external API calls
- Minimal memory usage

## Monitoring

Monitor these metrics:
- Webhook execution time
- Success rate
- Error rate
- Database update time
- Recording availability rate

## Related Files

- `src/pages/Sessions.tsx` - Displays recordings
- `WEBHOOK_SETUP_COMPLETE.md` - Setup guide
- `WEBHOOK_QUICK_START.md` - Quick start
- `IMPLEMENTATION_CHECKLIST.md` - Verification checklist

## Support

For issues or questions:
1. Check Supabase function logs
2. Review setup guides
3. Test with curl command
4. Verify environment variables
5. Check database for recording columns


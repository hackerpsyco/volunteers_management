# Google Calendar Integration Setup Checklist

## Current Status
The Edge Function has been updated with improved error handling for both Workspace and external email addresses. However, to fully support calendar event creation for all emails, you need to complete the following setup steps.

## Issues to Fix

### 1. Enable Google Calendar API
**Status**: ❌ Not Enabled (Error: "Google Calendar API has not been used in project")

**Steps to Fix**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: `gt-session` (Project ID: 412670769869)
3. Navigate to **APIs & Services** → **Library**
4. Search for "Google Calendar API"
5. Click on it and press **Enable**
6. Wait 2-5 minutes for the change to propagate

### 2. Set Up Domain-Wide Delegation (For External Emails)
**Status**: ❌ Not Configured (Error: "Service accounts cannot invite attendees without Domain-Wide Delegation of Authority")

**Why It's Needed**: 
- To create calendar events for external emails (non-Workspace domain)
- Without this, the service account can only create events on its own calendar

**Steps to Fix**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: `gt-session`
3. Navigate to **APIs & Services** → **Credentials**
4. Find the Service Account: `gtsession@gt-session.iam.gserviceaccount.com`
5. Click on it to open details
6. Go to the **Keys** tab
7. Note the **Client ID** (you'll need this for Google Workspace Admin)
8. Go to [Google Workspace Admin Console](https://admin.google.com/)
9. Navigate to **Security** → **API Controls** → **Domain-wide Delegation**
10. Click **Add new**
11. Enter the **Client ID** from step 7
12. In **OAuth Scopes**, enter: `https://www.googleapis.com/auth/calendar`
13. Click **Authorize**

### 3. Verify Service Account Credentials
**Status**: ✅ Updated (New credentials in `.env.local`)

**Current Service Account**:
- Email: `gtsession@gt-session.iam.gserviceaccount.com`
- Project: `gt-session`

## How It Works After Setup

### For Workspace Domain Emails (@wazireducationsocity.com)
1. Service Account uses domain-wide delegation to impersonate the user
2. Creates event on that user's calendar
3. User receives calendar invitation

### For External Emails (gmail.com, etc.)
1. Service Account creates event on its own calendar
2. Adds external email as attendee
3. External email receives calendar invitation

## Testing

After completing the setup steps above, test by:

1. Creating a new session with:
   - Volunteer: External email (e.g., piyushmodi812@gmail.com)
   - Facilitator: Workspace email (e.g., someone@wazireducationsocity.com)
   - Coordinator: Any email

2. Check the browser console for success messages like:
   ```
   Successfully created event for piyushmodi812@gmail.com: event-id-123
   Successfully created event for facilitator@wazireducationsocity.com: event-id-456
   ```

3. Verify calendar invitations are received by all attendees

## Troubleshooting

### Error: "Google Calendar API has not been used in project"
- **Solution**: Enable Google Calendar API (Step 1 above)
- **Wait Time**: 2-5 minutes after enabling

### Error: "Service accounts cannot invite attendees without Domain-Wide Delegation"
- **Solution**: Set up Domain-Wide Delegation (Step 2 above)
- **Note**: Only needed for external emails

### Error: "Invalid email or User ID"
- **Cause**: Service account trying to impersonate non-existent Workspace user
- **Solution**: Ensure Workspace emails are valid users in your Google Workspace

## Files Modified
- `supabase/functions/sync-google-calendar/index.ts` - Improved error handling and logging
- `.env.local` - Updated with new service account credentials

## Next Steps
1. Complete the setup steps above
2. Test calendar event creation
3. Monitor browser console for any errors
4. If issues persist, check Google Cloud Console logs for detailed error messages

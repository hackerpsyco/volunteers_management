# Google Calendar API Integration Setup

## What's Done

✅ **Code Updated:**
- `supabase/functions/sync-google-calendar/index.ts` - Now calls Google Calendar API
- `src/components/sessions/AddSessionDialog.tsx` - Gets tokens and sends to Edge Function
- `src/utils/googleOAuth.ts` - Google OAuth service
- `src/pages/AuthCallback.tsx` - OAuth callback handler
- `src/components/GoogleCalendarConnect.tsx` - Connect button component

## How It Works

1. **User connects Google Calendar** → Clicks "Connect Google Calendar" button
2. **OAuth flow** → Redirected to Google login
3. **Token stored** → Access token saved in database
4. **Session created** → Calendar event created in their Google Calendar
5. **Invitation sent** → Google Calendar sends email invitation

## Setup Steps

### Step 1: Create Google Cloud Project

1. Go to https://console.cloud.google.com/
2. Click "Create Project"
3. Name: "WES Volunteer Management"
4. Click Create

### Step 2: Enable Google Calendar API

1. Search for "Google Calendar API"
2. Click it
3. Click "Enable"

### Step 3: Create OAuth Credentials

1. Go to "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client ID"
3. Choose "Web application"
4. Add Authorized redirect URIs:
   - `http://localhost:3000/auth/callback` (development)
   - `https://yourdomain.com/auth/callback` (production)
5. Click Create
6. Copy Client ID

### Step 4: Update Environment Variables

Add to `.env.local`:
```
VITE_GOOGLE_CLIENT_ID=your_client_id_from_step_3
VITE_GOOGLE_API_KEY=your_api_key
```

### Step 5: Deploy Edge Function

```bash
supabase functions deploy sync-google-calendar
```

### Step 6: Add Route to App

Update your router to include:
```typescript
import AuthCallback from '@/pages/AuthCallback';

// In your routes:
{
  path: '/auth/callback',
  element: <AuthCallback />
}
```

## How Users Connect

1. Go to Volunteers page
2. Click "Connect Google Calendar" button
3. Login with Google
4. Grant calendar access
5. Redirected back to app
6. Token saved in database

## How Sessions Get Added to Calendar

1. Create a session
2. Edge Function gets tokens from database
3. Calls Google Calendar API
4. Creates event in volunteer's calendar
5. Creates event in facilitator's calendar
6. Google Calendar sends email invitations

## Database Schema

**volunteers table:**
- `google_calendar_token` - OAuth access token

**facilitators table:**
- `google_calendar_token` - OAuth access token

**calendar_syncs table:**
- `session_id` - Session ID
- `google_event_id` - Google Calendar event ID
- `synced_at` - When synced

## Testing

1. Connect Google Calendar for a volunteer
2. Create a session
3. Check volunteer's Google Calendar
4. Session should appear with invitation

## Troubleshooting

**OAuth redirect not working?**
- Check redirect URI matches exactly in Google Cloud Console
- Check `.env.local` has correct VITE_GOOGLE_CLIENT_ID

**Calendar event not created?**
- Check token is stored in database
- Check Edge Function logs in Supabase
- Check Google Calendar API is enabled

**Email not received?**
- Check email address is correct in database
- Check Google Calendar settings for notifications
- Check spam folder


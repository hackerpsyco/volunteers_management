# Google Calendar Integration - Complete

## What's Done

✅ **Backend (Edge Function):**
- `supabase/functions/sync-google-calendar/index.ts` - Calls Google Calendar API to create events

✅ **Frontend:**
- `src/components/sessions/AddSessionDialog.tsx` - Gets tokens and sends to Edge Function
- `src/utils/googleOAuth.ts` - Google OAuth service for token management
- `src/pages/AuthCallback.tsx` - OAuth callback handler
- `src/components/GoogleCalendarConnect.tsx` - Connect button component

✅ **Environment:**
- `.env.example` - Updated with Google Calendar variables

## How It Works

### User Flow

1. **Connect Google Calendar**
   - User clicks "Connect Google Calendar" button
   - Redirected to Google login
   - Grants calendar access
   - Token saved in database

2. **Create Session**
   - User creates session in app
   - Edge Function gets tokens from database
   - Calls Google Calendar API
   - Creates event in volunteer's calendar
   - Creates event in facilitator's calendar
   - Google Calendar sends email invitations

3. **View in Calendar**
   - Volunteer sees session in their Google Calendar
   - Facilitator sees session in their Google Calendar
   - Both receive email notifications

## Setup (6 Steps)

### Step 1: Create Google Cloud Project
- Go to https://console.cloud.google.com/
- Create new project

### Step 2: Enable Google Calendar API
- Search for "Google Calendar API"
- Click Enable

### Step 3: Create OAuth Credentials
- Go to Credentials
- Create OAuth 2.0 Client ID
- Add redirect URIs:
  - `http://localhost:3000/auth/callback`
  - `https://yourdomain.com/auth/callback`
- Copy Client ID

### Step 4: Update Environment
Add to `.env.local`:
```
VITE_GOOGLE_CLIENT_ID=your_client_id
VITE_GOOGLE_API_KEY=your_api_key
```

### Step 5: Deploy Edge Function
```bash
supabase functions deploy sync-google-calendar
```

### Step 6: Add Route to App
Add to your router:
```typescript
import AuthCallback from '@/pages/AuthCallback';

{
  path: '/auth/callback',
  element: <AuthCallback />
}
```

## Files Created

- `src/utils/googleOAuth.ts` - OAuth service
- `src/pages/AuthCallback.tsx` - OAuth callback
- `src/components/GoogleCalendarConnect.tsx` - Connect button
- `GOOGLE_CALENDAR_API_SETUP.md` - Setup guide

## Files Updated

- `supabase/functions/sync-google-calendar/index.ts` - Now calls Google Calendar API
- `src/components/sessions/AddSessionDialog.tsx` - Gets tokens and sends to Edge Function
- `.env.example` - Added Google Calendar variables

## Database Changes

**volunteers table:**
- `google_calendar_token` - Already exists (from migration)

**facilitators table:**
- `google_calendar_token` - Already exists (from migration)

**calendar_syncs table:**
- Already exists (from migration)

## How to Use

### For Volunteers

1. Go to Volunteers page
2. Click "Connect Google Calendar"
3. Login with Google
4. Grant calendar access
5. Token saved automatically

### For Facilitators

1. Go to Facilitators page
2. Click "Connect Google Calendar"
3. Login with Google
4. Grant calendar access
5. Token saved automatically

### Create Session

1. Go to Sessions page
2. Click "New Session"
3. Fill in all fields
4. Click "Create Session"
5. Calendar events created automatically
6. Email invitations sent

## Testing Checklist

- [ ] Deploy Edge Function
- [ ] Add route to app
- [ ] Update environment variables
- [ ] Connect Google Calendar for volunteer
- [ ] Connect Google Calendar for facilitator
- [ ] Create a session
- [ ] Check volunteer's Google Calendar
- [ ] Check facilitator's Google Calendar
- [ ] Verify email invitations received

## Next Steps

1. Set up Google Cloud Project
2. Get OAuth credentials
3. Update environment variables
4. Deploy Edge Function
5. Add route to app
6. Test the flow

## Support

See `GOOGLE_CALENDAR_API_SETUP.md` for detailed setup instructions.


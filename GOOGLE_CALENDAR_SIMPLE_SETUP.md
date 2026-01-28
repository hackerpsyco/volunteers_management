# Google Calendar Integration - Simple Setup

## What Happens

When you create a session:

1. **Session is saved** to database
2. **Calendar event is created** with:
   - Session title
   - Date and time
   - Volunteer email
   - Facilitator email
3. **Google Calendar sends invitations** to both
4. **They receive email notifications** from Google Calendar automatically

## How It Works

- No SendGrid needed
- No API keys needed
- Just uses Google Calendar's built-in invitation system
- Google Calendar automatically sends email notifications

## Setup Steps

### Step 1: Deploy Edge Function

**Via Supabase Dashboard:**

1. Go to https://app.supabase.com/
2. Select your project
3. Click "Edge Functions" (left menu)
4. Click "Create a new function"
5. Name: `sync-google-calendar`
6. Copy code from: `supabase/functions/sync-google-calendar/index.ts`
7. Paste into editor
8. Click "Deploy"

**Via CLI:**

```bash
supabase functions deploy sync-google-calendar
```

### Step 2: Update Frontend Environment

Create/update `.env.local`:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Step 3: Test It

1. Open the app
2. Go to Sessions page
3. Click "New Session"
4. Fill in all fields:
   - Select volunteer (must have work_email)
   - Select facilitator (must have email)
   - Select category, module, topic
   - Select centre and time slot
   - Click "Create Session"
5. Check your email
6. You should see calendar invitation from Google Calendar

## What Volunteer Receives

**Email from Google Calendar:**
- Subject: "Session Title" (calendar invitation)
- Session date and time
- Facilitator name
- Option to accept/decline
- Automatically added to their calendar

## What Facilitator Receives

**Email from Google Calendar:**
- Subject: "Session Title" (calendar invitation)
- Session date and time
- Volunteer name
- Option to accept/decline
- Automatically added to their calendar

## Database

**calendar_syncs table** tracks:
- session_id
- synced_at (when it was added to calendar)

## Troubleshooting

### No email received?

**Check 1: Verify email addresses**
- Go to Volunteers page
- Check volunteer has `work_email` filled in
- Go to Facilitators page
- Check facilitator has `email` filled in

**Check 2: Check Supabase logs**
- Go to Supabase Dashboard
- Click "Edge Functions"
- Click on `sync-google-calendar`
- Click "Logs" tab
- Look for errors

**Check 3: Check spam folder**
- Google Calendar invitations sometimes go to spam

### Function not found?

**Solution:**
- Verify function is deployed: `supabase functions list`
- Redeploy if needed: `supabase functions deploy sync-google-calendar`

## Files Modified

- `src/components/sessions/AddSessionDialog.tsx` - Updated to call Edge Function
- `supabase/functions/sync-google-calendar/index.ts` - Updated to use Google Calendar

## Next Steps

1. ✅ Deploy Edge Function
2. ✅ Test session creation
3. ✅ Verify calendar invitations received
4. 🔄 View sessions in Calendar page
5. 🔄 Accept/decline calendar invitations

## How to Accept Calendar Invitation

1. Open email from Google Calendar
2. Click "Yes" to accept
3. Session automatically added to your Google Calendar
4. You'll get reminders before the session

## View in Calendar

1. Open the app
2. Go to Calendar page
3. Select volunteer from dropdown
4. See all their sessions on the calendar
5. Click on a session to see details


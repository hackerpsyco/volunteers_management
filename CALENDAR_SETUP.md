# Calendar & Email Notifications Setup

## How It Works

When you create a session:
1. Session is saved to database
2. Calendar event is created with volunteer and facilitator as attendees
3. Google Calendar automatically sends email invitations to both
4. They receive calendar invitations and can accept/decline
5. Session appears in their Google Calendar

## Setup (2 Steps)

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

### Step 2: Verify Environment Variables

Make sure `.env.local` has:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Test It

1. Open the app
2. Go to Sessions page
3. Click "New Session"
4. Fill in all fields:
   - Select volunteer (must have work_email)
   - Select facilitator (must have email)
   - Select category, module, topic
   - Select centre and time slot
5. Click "Create Session"
6. Check your email for calendar invitation

## What They Receive

**Email from Google Calendar:**
- Subject: "Session Title" (calendar invitation)
- Date and time
- Facilitator/Volunteer name
- Accept/Decline buttons
- Automatically added to their calendar

## View in App

**Sessions Page:**
- Shows all created sessions in table format
- Can delete sessions

**Calendar Page:**
- Shows calendar view
- Filter by volunteer
- Click session to see details
- Shows: Topic, Category, Module, Facilitator, Volunteer, Date, Time, Status, Resources

## Troubleshooting

**Email not received?**
- Check volunteer has `work_email` filled in
- Check facilitator has `email` filled in
- Check spam folder
- Check Supabase Edge Functions logs

**Function not found?**
- Verify function is deployed: `supabase functions list`
- Redeploy: `supabase functions deploy sync-google-calendar`

**Session not showing in calendar?**
- Refresh page
- Check filter is set to "All Volunteers"
- Check session date is correct


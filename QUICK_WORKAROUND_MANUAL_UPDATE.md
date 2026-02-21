# Quick Workaround - Manual Recording Update

## Since Webhook Isn't Matching EventId

You can manually add the recording URL right now:

### Steps:

1. **Go to Sessions page**
   - Click "Sessions" in sidebar

2. **Find your session**
   - Look for "WES GT Session - Class 7 - by piyush tamoli - 32. Data Visualization"
   - Should show "⏳ Processing" in Recording column

3. **Click the "..." menu** (desktop) or **"Recording" button** (mobile)
   - Desktop: Three dots on the right
   - Mobile: "Recording" button in actions

4. **Select "Update Recording"**
   - Dialog opens

5. **Paste the Google Drive URL**
   - From your email: `https://drive.google.com/file/d/...`
   - Or get it from Google Drive directly

6. **Set Status to "Available"**
   - Dropdown shows: "📹 Available", "⏳ Processing", "❌ Failed"
   - Select "📹 Available"

7. **Click "Update Recording"**
   - Recording appears immediately!

### Result:
- Session shows "📹 View Recording" link
- Can click to view in Google Drive
- Duration and file size can be added (optional)

## Why This Works

The manual update directly updates the database:
- `recording_url` → Your Google Drive link
- `recording_status` → "available"
- `recording_created_at` → Current time

No webhook needed!

## Next Steps

After you manually update:
1. We'll check the webhook logs
2. Find why eventId didn't match
3. Fix the matching logic
4. Future recordings will auto-update

For now, use the manual "Update Recording" button as a workaround.

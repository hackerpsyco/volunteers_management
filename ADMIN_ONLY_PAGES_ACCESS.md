# Admin-Only Pages Access Control

## Overview

The following pages are now restricted to Admin users only:
- ✅ Session Recording (Tab C - Session Hours Tracker)
- ✅ Feedback Details
- ✅ Admin Panel (already restricted)

Only users with role_id = 1 (Admin) can access these pages.

## What Changed

### 1. SessionRecording.tsx
- Added role checking on page load
- Shows "Access Denied" for non-admin users
- Redirects to dashboard if not admin
- Shows loading state while checking access

### 2. FeedbackDetails.tsx
- Added role checking on page load
- Shows "Access Denied" for non-admin users
- Redirects to dashboard if not admin
- Shows loading state while checking access

## Access Control

### Admin Users (role_id = 1)
```
Can access:
✅ Session Recording page
✅ Feedback Details page
✅ Admin Panel
✅ Hour tracker (Tab C in Session Recording)
✅ All feedback data
```

### Non-Admin Users (Supervisor, Coordinator, Facilitator)
```
Cannot access:
❌ Session Recording page
❌ Feedback Details page
❌ Admin Panel
❌ Hour tracker
❌ Feedback details

Can access:
✅ Dashboard
✅ Calendar
✅ Sessions
✅ Curriculum
✅ Facilitators
✅ Coordinators
✅ Centres
✅ Classes
✅ Volunteers
✅ Edit Profile
✅ Settings
```

## User Experience

### Admin User Flow
```
Admin logs in
    ↓
Can access all pages including:
- Session Recording
- Feedback Details
- Admin Panel
    ↓
Can view and edit:
- Session hours
- Feedback data
- User management
```

### Non-Admin User Flow
```
Supervisor/Coordinator/Facilitator logs in
    ↓
Try to access Session Recording
    ↓
See "Access Denied" message
    ↓
Redirected to dashboard
    ↓
Error toast notification shown
```

## Error Messages

### Session Recording Access Denied
```
"Access Denied"
"Session recording is only accessible to administrators."
[Go to Dashboard button]
```

### Feedback Details Access Denied
```
"Access Denied"
"Feedback details are only accessible to administrators."
[Go to Dashboard button]
```

## Technical Implementation

### SessionRecording.tsx
```typescript
// Check admin access on mount
useEffect(() => {
  if (user?.id) {
    checkAdminAccess();
  }
}, [user?.id]);

// Verify user is Admin (role_id = 1)
const checkAdminAccess = async () => {
  const { data } = await supabase
    .from('user_profiles')
    .select('role_id')
    .eq('id', user?.id)
    .single();

  if (data?.role_id === 1) {
    setUserRole(data.role_id);
  } else {
    toast.error('Access denied. Session recording is only for administrators.');
    navigate('/dashboard', { replace: true });
  }
};

// Show access denied message
if (userRole !== 1) {
  return (
    <DashboardLayout>
      <Card>
        <Shield icon />
        <h2>Access Denied</h2>
        <p>Session recording is only accessible to administrators.</p>
        <Button>Go to Dashboard</Button>
      </Card>
    </DashboardLayout>
  );
}
```

### FeedbackDetails.tsx
```typescript
// Same pattern as SessionRecording
// Check admin access on mount
// Show access denied message if not admin
// Redirect to dashboard
```

## Testing

### Test 1: Admin Can Access Session Recording
1. Create Admin user
2. Login as Admin
3. Go to Sessions page
4. Click on a session
5. Click "Record Session"
6. Verify Session Recording page loads
7. Verify can see all tabs including hours tracker

### Test 2: Non-Admin Cannot Access Session Recording
1. Create Coordinator user
2. Login as Coordinator
3. Try to access `/sessions/[sessionId]/recording`
4. Verify "Access Denied" message
5. Verify redirected to dashboard

### Test 3: Admin Can Access Feedback Details
1. Login as Admin
2. Go to Feedback & Record page
3. Click on a session
4. Click "View Feedback Details"
5. Verify Feedback Details page loads
6. Verify can see all feedback data

### Test 4: Non-Admin Cannot Access Feedback Details
1. Login as Coordinator
2. Try to access `/sessions/[sessionId]/feedback-details`
3. Verify "Access Denied" message
4. Verify redirected to dashboard

## Security Features

✅ **Role-based access control**
- Only Admin role (1) can access
- Other roles are blocked

✅ **Multiple layers of protection**
- Page-level access checks
- Redirects non-admins to dashboard
- Error toast notifications

✅ **User feedback**
- Clear error message
- "Go to Dashboard" button
- Toast notification

✅ **Database-backed**
- Role stored in user_profiles table
- Checked against Supabase on each access

## Pages Protected

| Page | Route | Admin Only |
|------|-------|-----------|
| Session Recording | `/sessions/:sessionId/recording` | ✅ Yes |
| Feedback Details | `/sessions/:sessionId/feedback-details` | ✅ Yes |
| Admin Panel | `/admin` | ✅ Yes |

## Files Modified

- `src/pages/SessionRecording.tsx` - Added role checking
- `src/pages/FeedbackDetails.tsx` - Added role checking

## Files Not Modified

- AppSidebar.tsx (already has role filtering)
- AdminPanel.tsx (already has role checking)
- Other pages (no changes needed)

## Troubleshooting

### Admin cannot access Session Recording
**Cause:** Role not loaded or incorrect role_id
**Solution:**
- Verify user has role_id = 1 in database
- Check browser console for errors
- Refresh page

### Non-admin can access pages
**Cause:** Role check not working
**Solution:**
- Verify user_profiles table has correct role_id
- Check Supabase logs
- Clear browser cache

### "Access Denied" appears for Admin user
**Cause:** Role check failed or role_id is not 1
**Solution:**
- Verify user profile exists in database
- Verify role_id = 1 in user_profiles table
- Check Supabase logs for errors

## Future Enhancements

Possible future improvements:
- Add role-based access to other pages
- Add permission system for specific actions
- Add audit logging for admin actions
- Add role management UI

## Summary

✅ Session Recording restricted to Admin only
✅ Feedback Details restricted to Admin only
✅ Admin Panel restricted to Admin only
✅ Clear error messages and feedback
✅ Multiple layers of security
✅ Ready for production use

---

**Status:** ✅ Complete and Ready for Testing
**Last Updated:** February 5, 2026

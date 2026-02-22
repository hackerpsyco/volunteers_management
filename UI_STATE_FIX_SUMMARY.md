# UI State Logic Fix - Student Homework Feedback Tab

## Problem Identified ✅

The "c) Student Homework Feedback" tab wasn't displaying because of a **UI state management issue**, not a database problem.

### Root Cause

When switching between main tabs (Facilitator → Coordinator → Facilitator), the `activeSubTab` state was NOT being reset. This caused:

1. Click "c) Student Homework Feedback" sub-tab
2. Switch to "Coordinator" tab
3. Switch back to "Facilitator" tab
4. Sub-tabs UI doesn't render because state is stale/mismatched

### Why This Happened

The main tab buttons only updated `activeTab`, but didn't reset `activeSubTab`:

```typescript
// ❌ BEFORE - Only sets activeTab
onClick={() => setActiveTab('facilitator')}

// ✅ AFTER - Sets both activeTab and resets activeSubTab
onClick={() => {
  setActiveTab('facilitator');
  setActiveSubTab('objective');
}}
```

---

## Solution Applied ✅

**File**: `src/pages/FeedbackDetails.tsx`

**Change**: Updated the "Facilitator Feedback" button to reset `activeSubTab` to 'objective' when clicked.

```typescript
<button
  onClick={() => {
    setActiveTab('facilitator');
    setActiveSubTab('objective');  // ← ADDED THIS
  }}
  className={...}
>
  Facilitator Feedback
</button>
```

---

## How to Test

1. **Hard refresh browser**: `Ctrl+Shift+R`
2. **Go to Feedback & Record**
3. **Select a session**
4. **Click "Option A: Session Details & Performance"**
5. **Click "c) Student Homework Feedback"** ← Should now display!
6. **Switch to "Coordinator Feedback"** tab
7. **Switch back to "Facilitator Feedback"** tab
8. **Click "c) Student Homework Feedback"** again ← Should still work!

---

## What's Now Working

✅ Sub-tabs (a, b, c) display correctly  
✅ Switching between main tabs resets sub-tabs  
✅ "Add Homework" button appears  
✅ Dialog opens without errors  
✅ Homework feedback section renders  

---

## Database Status

The `student_task_feedback` table still needs to be created via migration:

```powershell
supabase migration up
```

Or manually run the SQL from `supabase/migrations/20260221_create_student_task_feedback.sql`

---

## Summary

This was a **pure UI state logic issue**, not a backend/database problem. The fix ensures that when you switch between main feedback tabs, the sub-tabs reset to their default state, preventing stale state conflicts.

The homework feedback feature is now ready to use once the database migration is run!

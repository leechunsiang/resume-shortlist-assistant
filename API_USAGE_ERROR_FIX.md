# API Usage Error - Quick Fix

## The Error
```
[API_USAGE] Error fetching user summary: {}
[API_USAGE] Error fetching org summary: {}
```

## The Cause
The database functions for API usage tracking don't exist yet.

## The Fix (2 minutes)

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** (left sidebar)

### Step 2: Run Migration
1. Click **"New query"**
2. Open this file: `supabase/migrations/20251107120000_create_api_usage_logs.sql`
3. Copy **entire contents**
4. Paste into SQL Editor
5. Click **"Run"** (or Ctrl+Enter)
6. Wait for ✅ Success message

### Step 3: Refresh App
1. Go back to http://localhost:3000/api-usage
2. Press Ctrl+Shift+R (hard refresh)
3. ✅ Errors should be gone
4. ✅ Page shows "0 Requests" (normal before first AI call)

## What Gets Created
- `api_usage_logs` table
- `get_user_usage_summary()` function
- `get_organization_usage_summary()` function
- Indexes for performance
- Row Level Security policies

## Verify It Works
After migration:
1. Go to Job Listings
2. Click "AI Shortlist" on any job
3. Wait for AI analysis to complete
4. Go back to `/api-usage` page
5. ✅ Should show usage stats and costs

## Still Have Issues?
- Check browser console for errors
- Verify migration ran without errors in Supabase
- Make sure you're logged in
- Try logout/login

---

**File:** `APPLY_API_USAGE_MIGRATION.md` for detailed guide

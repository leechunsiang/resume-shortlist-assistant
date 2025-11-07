# Apply API Usage Migration - Quick Guide

## Problem
You're getting errors:
- `[API_USAGE] Error fetching user summary: {}`
- `[API_USAGE] Error fetching org summary: {}`

This is because the PostgreSQL functions (`get_user_usage_summary` and `get_organization_usage_summary`) don't exist in your database yet.

## Solution: Apply the Migration

### Option 1: Using Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query" button

3. **Copy the Migration SQL**
   - Open: `supabase/migrations/20251107120000_create_api_usage_logs.sql`
   - Copy ALL the contents (entire file)

4. **Paste and Run**
   - Paste into SQL Editor
   - Click "Run" button (or press Ctrl+Enter)
   - ✅ Wait for "Success. No rows returned"

5. **Verify**
   - Refresh your app at http://localhost:3000/api-usage
   - Errors should be gone

### Option 2: Using Supabase CLI (Alternative)

If you have Supabase CLI installed:

```bash
# Link to your project (first time only)
npx supabase link --project-ref YOUR_PROJECT_REF

# Apply all pending migrations
npx supabase db push
```

## What the Migration Creates

1. **Table:** `api_usage_logs`
   - Stores all OpenAI API calls
   - Tracks tokens, costs, timestamps
   - Links to users and organizations

2. **Functions:**
   - `get_user_usage_summary()` - User stats
   - `get_organization_usage_summary()` - Org stats

3. **Indexes:**
   - Fast queries by user, organization, date
   - Optimized for dashboard performance

4. **Security:**
   - Row Level Security (RLS) enabled
   - Users can only see their own data

## After Migration

✅ `/api-usage` page will work
✅ Usage tracking will log to database
✅ Cost calculations will appear
✅ CSV export will function

## Troubleshooting

### If you get "function already exists" error:
The migration was already applied partially. You can:
- Run each section individually
- Or use `DROP FUNCTION IF EXISTS` before creating

### If you get permission errors:
Make sure you're running as database owner/admin in Supabase dashboard.

### If page still shows errors:
1. Check browser console for actual error
2. Verify migration ran successfully
3. Try hard refresh (Ctrl+Shift+R)

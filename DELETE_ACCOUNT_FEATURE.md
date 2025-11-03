# Delete Account Feature Documentation

## Overview
The delete account feature allows users to permanently delete their account and all associated data from the system.

## How It Works

### User Flow
1. User navigates to Settings page (`/settings`)
2. Scrolls to the "Danger Zone" section
3. Clicks "Delete My Account" button
4. Confirms deletion by typing "DELETE" in the modal
5. Account and all data are permanently deleted
6. User is signed out and redirected to home page

### What Gets Deleted

When a user deletes their account:

1. **Organizations** - If the user is the only owner of an organization, the entire organization is deleted including:
   - All candidates in that organization
   - All job listings
   - All job applications
   - All organization members

2. **Organization Memberships** - If the user is a member (but not sole owner) of other organizations, only their membership is removed

3. **Auth Account** - The user's authentication account is deleted from Supabase Auth

## Technical Implementation

### API Route
`/api/delete-account` - Server-side API that handles the deletion process

**Why server-side?**
- Supabase doesn't allow client-side deletion of auth accounts for security reasons
- Requires the `service_role` key which should never be exposed to the client
- Ensures proper cascade deletion of all related data

### Files Modified
1. `src/app/api/delete-account/route.ts` - API endpoint for account deletion
2. `src/lib/supabase.ts` - Updated `authApi.deleteAccount()` to call the API
3. `src/app/settings/page.tsx` - Settings page with delete account UI
4. `src/components/dashboard-layout.tsx` - Updated Settings link to route to `/settings`

## Setup Instructions

### 1. Get Supabase Service Role Key

1. Go to your Supabase Dashboard
2. Select your project
3. Navigate to **Settings** > **API**
4. Copy the `service_role` key (⚠️ Keep this secret!)

### 2. Add to Environment Variables

Add to your `.env.local` file:

```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

⚠️ **IMPORTANT**: Never commit the service role key to version control. Add `.env.local` to your `.gitignore`.

### 3. Restart Development Server

After adding the environment variable, restart your dev server:

```bash
npm run dev
```

## Security Considerations

1. **Service Role Key** - Only used server-side, never exposed to client
2. **Authentication Check** - API verifies the user is authenticated
3. **Cascade Deletion** - Properly deletes all related data to prevent orphaned records
4. **Confirmation Modal** - Requires explicit confirmation before deletion
5. **No Undo** - Deletion is permanent and irreversible

## Database Schema Requirements

The delete operation relies on proper foreign key relationships in your database. Ensure your schema has:

- `candidates.organization_id` → `organizations.id`
- `job_listings.organization_id` → `organizations.id`
- `job_applications.job_id` → `job_listings.id`
- `organization_members.organization_id` → `organizations.id`

## Error Handling

The delete account feature includes comprehensive error handling:

1. **No User Logged In** - Returns error if user not authenticated
2. **Missing User ID** - API validates user ID is provided
3. **Database Errors** - Catches and reports database operation failures
4. **Auth Deletion Errors** - Handles errors from Supabase auth deletion

## Testing

To test the delete account feature:

1. Create a test account
2. Create an organization as that user
3. Add some candidates and jobs
4. Navigate to Settings → Delete Account
5. Confirm deletion
6. Verify you cannot log back in with that account
7. Verify all data is removed from the database

## Rollback Plan

If you need to disable the delete account feature:

1. Comment out or remove the "Danger Zone" section in `src/app/settings/page.tsx`
2. Optionally remove the `/api/delete-account` route
3. Optionally remove the `deleteAccount` function from `authApi`

## Support

If users need to recover an accidentally deleted account:
- Unfortunately, deletion is permanent
- Advise users to contact support immediately
- Database backups may be used for recovery if available

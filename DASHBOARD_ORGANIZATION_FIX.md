# Dashboard Organization Fix

## Issue
The main dashboard was always displaying data from the user's first organization instead of respecting the organization selected in the organization switcher.

## Root Cause
The dashboard page (`src/app/page.tsx`) was hardcoded to use the first organization from the user's organization list:
```typescript
const orgs = await organizationsApi.getUserOrganizations(user.id);
const orgId = orgs[0].id; // ❌ Always using first organization
```

This bypassed the organization context which manages the selected organization and stores it in localStorage.

## Solution
Updated the dashboard to use the `useOrganization` hook from the organization context, which tracks the selected organization.

### Changes Made

#### 1. Import Organization Context
```typescript
import { useOrganization } from '@/contexts/organization-context';
```

#### 2. Use Context Hook
```typescript
const { currentOrganization, loading: orgLoading } = useOrganization();
```

#### 3. Remove Local Organization State
Removed unnecessary state:
```typescript
// ❌ Removed
const [organizationId, setOrganizationId] = useState<string | null>(null);
```

#### 4. Updated Data Fetching Logic
```typescript
// Wait for organization context to load
if (orgLoading) {
  console.log('[DASHBOARD] Waiting for organization context...');
  return;
}

// Check if we have a current organization
if (!currentOrganization) {
  console.log('[DASHBOARD] No organization selected, redirecting to setup');
  router.push('/organization/setup');
  return;
}

console.log('[DASHBOARD] Using organization:', currentOrganization.name, currentOrganization.id);

// Fetch dashboard stats, recent candidates, and active jobs for the selected organization
const [statsData, candidatesData, jobsData] = await Promise.all([
  dashboardApi.getStats(currentOrganization.id), // ✅ Using selected org
  candidatesApi.getRecent(currentOrganization.id, 5),
  jobsApi.getAll(currentOrganization.id)
]);
```

#### 5. Updated Effect Dependencies
```typescript
useEffect(() => {
  // ...
}, [router, currentOrganization, orgLoading]); // ✅ Re-fetch when organization changes
```

## How It Works Now

1. **Organization Context Loads**: The `OrganizationProvider` loads user's organizations and restores the selected organization from localStorage
2. **Dashboard Waits**: Dashboard waits for org context to finish loading (`orgLoading`)
3. **Uses Selected Org**: Dashboard fetches data for `currentOrganization` from context
4. **Reactive Updates**: When user switches organizations via the switcher, the dashboard automatically re-fetches data (via the `currentOrganization` dependency in useEffect)

## User Flow

1. User logs in
2. Organization context loads all their organizations
3. Context restores previously selected organization from localStorage (or defaults to first org)
4. Dashboard displays data for the selected organization
5. User switches organization via sidebar switcher
6. Organization context updates `currentOrganization`
7. Dashboard useEffect triggers automatically
8. Dashboard fetches and displays new organization's data

## Benefits

✅ **Respects User Selection**: Dashboard now shows data for the organization selected in the switcher
✅ **Automatic Updates**: Dashboard automatically refreshes when organization is switched
✅ **Centralized State**: Uses organization context as single source of truth
✅ **Persistent Selection**: Selected organization persists across page refreshes via localStorage
✅ **Consistency**: All pages now use the same organization selection mechanism

## Testing

1. ✅ Login and verify dashboard shows data for default organization
2. ✅ Switch to a different organization via the sidebar switcher
3. ✅ Verify dashboard updates to show the new organization's data
4. ✅ Refresh the page
5. ✅ Verify dashboard still shows the selected organization's data (not the first org)
6. ✅ Create a new organization
7. ✅ Switch to it and verify dashboard displays its (empty) data

## Files Modified

- `src/app/page.tsx` - Main dashboard page

## Related Features

- Organization Context (`src/contexts/organization-context.tsx`)
- Organization Switcher (`src/components/organization-switcher.tsx`)
- All other pages (candidates, jobs) already use organization context correctly

## Notes

- This fix ensures consistency across all pages
- Dashboard now behaves the same way as the Candidates and Job Listings pages
- The organization context handles all organization-related state management
- localStorage keys used:
  - `currentOrganizationId` - Selected organization for dashboard/pages
  - `selectedOrganizationId` - Used by RBAC system for permission checks

# Tab Focus Refresh Fix

## Issue
When switching browser tabs and returning to the web app, the dashboard, job listings, and candidates pages were automatically refreshing their data, causing unnecessary network requests and a jarring user experience.

## Root Causes

### 1. Auth State Change Listener
Supabase's `onAuthStateChange` listener fires multiple events:
- `SIGNED_IN` - User logs in
- `SIGNED_OUT` - User logs out
- `TOKEN_REFRESHED` - Auth token refreshed (happens on tab focus)
- `INITIAL_SESSION` - Initial session loaded
- `USER_UPDATED` - User data updated

The organization context was refetching data for ALL auth events, including `TOKEN_REFRESHED` which fires every time a tab regains focus.

### 2. Unstable useEffect Dependencies
Pages were using unstable dependencies in their useEffect hooks:
```typescript
// ❌ Problem: router and orgLoading change frequently
useEffect(() => {
  fetchData();
}, [router, currentOrganization, orgLoading]);
```

- `router` - Next.js router object can change on tab focus
- `orgLoading` - Boolean that toggles during loading
- `currentOrganization` - Entire object (not just ID)

These caused unnecessary re-renders and data fetches.

## Solutions Implemented

### 1. Filter Auth Events in Organization Context
Updated the `onAuthStateChange` listener to only refetch on meaningful events:

**File**: `src/contexts/organization-context.tsx`

```typescript
authApi.onAuthStateChange((event, session) => {
  console.log('[ORG CONTEXT] Auth event:', event);
  
  // Only refetch on actual sign in, ignore token refreshes
  if (event === 'SIGNED_IN') {
    hasInitializedRef.current = false;
    fetchOrganizations();
  } else if (event === 'SIGNED_OUT') {
    // Clear state on sign out
    setOrganizations([]);
    setCurrentOrganizationState(null);
    localStorage.removeItem('currentOrganizationId');
    localStorage.removeItem('selectedOrganizationId');
    hasInitializedRef.current = false;
    setLoading(false);
  }
  // ✅ Ignore TOKEN_REFRESHED, INITIAL_SESSION, and other events
});
```

### 2. Optimize useEffect Dependencies

#### Dashboard (`src/app/page.tsx`)
```typescript
// ❌ Before
useEffect(() => {
  fetchData();
}, [router, currentOrganization, orgLoading]);

// ✅ After - only depend on organization ID
useEffect(() => {
  if (!orgLoading && currentOrganization) {
    fetchData();
  }
}, [currentOrganization?.id]);
```

#### Job Listings (`src/app/job-listings/page.tsx`)
```typescript
// ✅ Same optimization
useEffect(() => {
  if (!orgLoading && currentOrganization) {
    fetchData();
  }
}, [currentOrganization?.id]);
```

#### Candidates (`src/app/candidates/page.tsx`)
```typescript
// ✅ Same optimization
useEffect(() => {
  if (!orgLoading && currentOrganization) {
    fetchCandidates();
  }
}, [currentOrganization?.id]);
```

### Key Changes:
1. **Check `orgLoading` and `currentOrganization` inside effect** instead of as dependencies
2. **Only depend on `currentOrganization?.id`** - the stable identifier
3. **Set `setLoading(false)` when waiting** to prevent infinite loading states
4. **Remove `router` dependency** - not needed for data fetching

## How It Works Now

### Organization Context
1. Loads organizations once on mount
2. Only refetches when user signs in (not on token refresh)
3. Ignores tab focus events completely

### Page Data Fetching
1. Effect only runs when organization ID changes
2. Tab focus doesn't trigger re-render
3. Token refresh doesn't cause refetch
4. Still automatically updates when switching organizations

## Benefits

✅ **No Unnecessary Fetches**: Data doesn't reload on tab focus
✅ **Stable Dependencies**: Effects only run when organization actually changes
✅ **Better Performance**: Reduced network requests and database queries
✅ **Smoother UX**: No jarring reloads when switching tabs
✅ **Token Refresh Still Works**: Auth tokens refresh silently in background
✅ **Organization Switch Works**: Data still updates when changing organizations

## Testing

### Before Fix:
1. Open dashboard
2. Switch to another browser tab
3. Wait 5 seconds
4. Switch back to app tab
5. ❌ Dashboard data reloads unnecessarily

### After Fix:
1. Open dashboard
2. Switch to another browser tab
3. Wait 5 seconds
4. Switch back to app tab
5. ✅ Dashboard stays the same, no reload

### Organization Switch (Still Works):
1. Open dashboard
2. Switch organization via sidebar
3. ✅ Dashboard reloads with new organization's data

## Technical Details

### Auth Events Comparison:
| Event | Before Fix | After Fix |
|-------|-----------|-----------|
| `SIGNED_IN` | ✅ Refetch | ✅ Refetch |
| `SIGNED_OUT` | ✅ Clear state | ✅ Clear state |
| `TOKEN_REFRESHED` | ❌ Refetch (unnecessary) | ✅ Ignore |
| `INITIAL_SESSION` | ❌ Refetch (unnecessary) | ✅ Ignore |
| `USER_UPDATED` | ❌ Refetch (unnecessary) | ✅ Ignore |

### Dependency Comparison:
| Page | Before | After |
|------|--------|-------|
| Dashboard | `[router, currentOrganization, orgLoading]` | `[currentOrganization?.id]` |
| Job Listings | `[router, currentOrganization, orgLoading]` | `[currentOrganization?.id]` |
| Candidates | `[router, currentOrganization, orgLoading]` | `[currentOrganization?.id]` |

### Why `?.id` Works:
- `currentOrganization?.id` returns a **primitive string**
- Primitive values have **referential equality**
- `"abc123" === "abc123"` is always true
- Object comparison is by reference: `{id: "abc"} !== {id: "abc"}`
- Using just the ID prevents unnecessary re-renders

## Files Modified

1. `src/contexts/organization-context.tsx` - Filter auth events
2. `src/app/page.tsx` - Optimize dashboard dependencies
3. `src/app/job-listings/page.tsx` - Optimize job listings dependencies
4. `src/app/candidates/page.tsx` - Optimize candidates dependencies

## Related Issues

This fix also resolves:
- Unexpected loading states when switching tabs
- Flash of loading spinner on tab focus
- Redundant database queries
- Wasted API calls to Supabase

## Notes

- Auth tokens still refresh automatically (Supabase handles this)
- Session persistence still works across tabs
- RBAC permission checks are unaffected
- Organization switching still triggers proper refetches
- The fix is development-mode friendly (works with React Strict Mode)

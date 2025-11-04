# Organization Switcher Feature

## Overview
Users can now belong to multiple organizations and easily switch between them using a dropdown menu in the sidebar. The selected organization context is maintained across the application.

## Features

### 1. **Multiple Organization Support**
- Users can be members of multiple organizations
- Each organization membership is activated automatically when users log in or sign up
- Organizations are managed through the Settings > Team tab

### 2. **Organization Switcher UI**
- Located in the sidebar below the logo (when authenticated)
- Shows current organization name and icon
- Dropdown menu lists all organizations the user belongs to
- "Create New Organization" option at the bottom
- Persists selected organization in localStorage

### 3. **Context Management**
- Global `OrganizationContext` provides current organization across the app
- Automatically refreshes when memberships change
- Syncs with authentication state

## Implementation Details

### Files Created/Modified

#### 1. `src/contexts/organization-context.tsx`
Context provider that manages:
- List of all user's organizations
- Currently selected organization
- Loading state
- Organization refresh function

```typescript
const { 
  organizations,          // All orgs user belongs to
  currentOrganization,    // Currently selected org
  setCurrentOrganization, // Change selected org
  loading,                // Initial load state
  refreshOrganizations    // Refresh org list
} = useOrganization();
```

#### 2. `src/components/organization-switcher.tsx`
Dropdown component features:
- Gradient organization icon
- Organization name and description
- Checkmark on selected organization
- Create new organization button
- Click outside to close
- Smooth animations

#### 3. `src/app/layout.tsx`
Wraps entire app with `OrganizationProvider`

#### 4. `src/components/dashboard-layout.tsx`
Adds `OrganizationSwitcher` component above navigation links (when authenticated)

#### 5. `src/app/settings/page.tsx`
Updated to use `currentOrganization` from context instead of local state

## User Flow

### Adding Members to Organization
1. User A creates Organization "Tech Corp"
2. User A goes to Settings > Team
3. User A adds `userb@example.com` with role "Member"
4. Record created with status: `'pending'`

### New Member Joining
1. User B signs up or logs in with `userb@example.com`
2. System automatically activates pending membership
3. User B sees organization switcher in sidebar
4. Dropdown shows "Tech Corp" as an available organization
5. User B can switch to "Tech Corp" to access its data

### Switching Organizations
1. Click organization switcher in sidebar
2. Select desired organization from dropdown
3. All pages now show data for selected organization
4. Selection persists across page refreshes

## API Integration

### Organization Context Usage
```typescript
'use client';
import { useOrganization } from '@/contexts/organization-context';

export default function MyPage() {
  const { currentOrganization, refreshOrganizations } = useOrganization();

  if (!currentOrganization) {
    return <div>No organization selected</div>;
  }

  // Use currentOrganization.id for API calls
  const candidates = await candidatesApi.getAll(currentOrganization.id);
  
  return <div>{currentOrganization.name}</div>;
}
```

### Refreshing Organizations
Call `refreshOrganizations()` after:
- Adding a new member
- Creating a new organization
- Updating organization details

## State Management

### LocalStorage
- Key: `currentOrganizationId`
- Value: UUID of selected organization
- Used to restore selection on page load

### Context State
```typescript
{
  organizations: Organization[],
  currentOrganization: Organization | null,
  loading: boolean
}
```

### Auth Sync
- Listens to Supabase auth state changes
- Clears organizations on sign out
- Reloads organizations on sign in

## UI/UX Features

### Responsive Design
- Full width in sidebar
- Truncates long organization names
- Shows descriptions as secondary text

### Visual Feedback
- Hover effects on buttons
- Check icon on selected organization
- Smooth dropdown animations
- Gradient organization icons

### Empty States
- "Create Organization" button when no orgs
- Graceful handling of no current org

## Data Flow

```
┌─────────────────────┐
│   User Signs Up     │
│   /Login            │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ activatePending     │
│ Memberships()       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ OrganizationContext │
│ Loads User's Orgs   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ OrganizationSwitcher│
│ Shows in Sidebar    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ User Selects Org    │
│ Saved to localStorage│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ All Pages Use       │
│ currentOrganization │
└─────────────────────┘
```

## Integration Points

### Pages That Use Organization Context
- `/` - Dashboard (show org stats)
- `/candidates` - Filter by organization
- `/job-listings` - Filter by organization
- `/settings` - Organization and team management
- `/audit` - Show org audit logs

### API Routes That Need Organization ID
- `/api/ai-shortlist` - Job and candidates
- Any candidate/job CRUD operations
- Team management operations
- Audit log queries

## Testing

### Test Scenario 1: Single Organization
1. Create account
2. Create organization
3. Verify org appears in switcher
4. Click switcher - should show just one org

### Test Scenario 2: Multiple Organizations
1. Create two organizations
2. Get invited to third organization
3. Verify all three appear in switcher
4. Switch between them - verify data changes

### Test Scenario 3: New Member Flow
1. Admin adds member by email
2. Member signs up with that email
3. Verify member sees organization in switcher
4. Verify member can access organization data

### Test Scenario 4: Persistence
1. Select an organization
2. Refresh page
3. Verify same organization is still selected
4. Log out and back in
5. Verify organization is still selected

## Future Enhancements

- [ ] Show organization member count in switcher
- [ ] Add organization avatar/logo support
- [ ] Recent organizations list
- [ ] Organization search/filter (for users with many orgs)
- [ ] Organization settings quick access
- [ ] Keyboard shortcuts for switching (Cmd/Ctrl + K)
- [ ] Organization-specific themes/colors
- [ ] Notifications badge per organization

## Troubleshooting

### Organization Not Showing
- Check if membership status is 'active' (not 'pending')
- Verify user is logged in
- Check browser console for errors
- Call `refreshOrganizations()` manually

### Wrong Organization Selected
- Check localStorage for `currentOrganizationId`
- Clear localStorage and refresh
- Verify organization still exists in database

### Context Not Available
- Ensure component is wrapped in `OrganizationProvider`
- Check that component is client-side ('use client')
- Verify import path is correct

# Create Organization Feature

## Overview
Users can now create additional organizations from the Settings page. This feature allows users to manage multiple organizations within their account.

## Implementation Details

### UI Components

#### 1. Create Organization Button
- **Location**: Settings page > Organization tab (top section)
- **Design**: Emerald-themed card with prominent "New Organization" button
- **Icon**: Building2 icon
- **Action**: Opens the create organization modal

#### 2. Create Organization Modal
- **Fields**:
  - **Name** (required) - Organization name
  - **Description** (optional) - Brief description
  - **Website** (optional) - Organization website URL
  - **Industry** (optional) - Business industry
  - **Size** (optional) - Dropdown with employee count ranges:
    - 1-10 employees
    - 11-50 employees
    - 51-200 employees
    - 201-500 employees
    - 501-1000 employees
    - 1000+ employees

- **Validation**:
  - Organization name is required
  - All other fields are optional
  - Create button disabled if name is empty

- **States**:
  - Loading state with spinner during creation
  - Error display if creation fails
  - Success triggers modal close and context refresh

### Backend Integration

#### API Endpoint
- **Route**: `/api/organization/create`
- **Method**: POST
- **Request Body**:
```typescript
{
  name: string;
  description?: string;
  website?: string;
  industry?: string;
  size?: string;
}
```

#### Handler Function
```typescript
const handleCreateOrganization = async () => {
  // 1. Validate organization name
  // 2. Call API to create organization
  // 3. Refresh organization context
  // 4. Close modal and reset form
  // 5. Handle errors
}
```

### State Management

#### New State Variables
```typescript
const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);
const [newOrgData, setNewOrgData] = useState({
  name: '',
  description: '',
  website: '',
  industry: '',
  size: ''
});
const [createOrgError, setCreateOrgError] = useState('');
const [isCreatingOrg, setIsCreatingOrg] = useState(false);
```

### User Flow

1. **Access Feature**:
   - Navigate to Settings page
   - Click on "Organization" tab
   - See "Create New Organization" section at the top

2. **Create Organization**:
   - Click "New Organization" button
   - Modal opens with form fields
   - Fill in organization name (required)
   - Optionally fill in other details
   - Click "Create Organization" button

3. **Post-Creation**:
   - Organization is created with user as owner
   - Organization context refreshes
   - Modal closes and form resets
   - New organization appears in organization switcher
   - User can switch between organizations

## Integration with Existing Features

### Organization Context
- After creation, the organization context automatically refreshes
- New organization becomes available in the organization switcher
- User's membership is automatically created with "owner" role

### RBAC System
- Creator automatically gets "owner" role
- Full permissions to manage the new organization
- Can invite team members and assign roles

### Organization Switcher
- Newly created organizations appear in the dropdown
- User can switch between all their organizations
- Selected organization persists in localStorage

## Database Schema

### Organizations Table
```sql
organizations (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  website TEXT,
  industry TEXT,
  size TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

### Organization Members Table
```sql
organization_members (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES users(id),
  role TEXT CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
)
```

## Error Handling

### Client-Side
- Empty name validation
- Network error handling
- Display error messages in modal

### Server-Side
- Authentication check
- Input validation
- Database error handling
- Duplicate name check (optional)

## UI/UX Features

### Visual Design
- **Emerald theme** for create section (distinguishes from current org details)
- **Smooth animations** with Framer Motion
- **Loading states** with spinner
- **Error messages** in red with border highlighting
- **Responsive design** works on all screen sizes

### User Feedback
- Button disabled during creation
- Loading spinner with "Creating..." text
- Success indicated by modal closure and context refresh
- Errors displayed clearly in the modal

## Testing Checklist

- [ ] Click "New Organization" button opens modal
- [ ] Cannot submit without organization name
- [ ] Can submit with only name filled
- [ ] All optional fields work correctly
- [ ] Loading state displays during creation
- [ ] Error messages display on failure
- [ ] Modal closes on successful creation
- [ ] Organization appears in switcher
- [ ] User has owner role in new organization
- [ ] Can switch to newly created organization
- [ ] Form resets after creation

## Future Enhancements

1. **Organization Templates**
   - Pre-fill fields based on industry templates
   - Quick setup for common organization types

2. **Organization Logo**
   - Upload and display organization logo
   - Show in switcher and header

3. **Duplicate Name Prevention**
   - Check for existing organization names
   - Suggest alternatives if name exists

4. **Organization Settings**
   - Edit organization details after creation
   - Delete organization (owner only)
   - Transfer ownership

5. **Onboarding Flow**
   - Guide new users through organization setup
   - Add team members during creation
   - Set up first job listing

## Files Modified

- `src/app/settings/page.tsx` - Added UI, state, and handler
- `src/contexts/organization-context.tsx` - Used for context refresh
- `src/lib/supabase.ts` - Used organizationsApi.create()

## Related Documentation

- `ORGANIZATION_SWITCHER.md` - Organization switching functionality
- `RBAC_IMPLEMENTATION.md` - Role-based access control
- `ORGANIZATION_MEMBER_MANAGEMENT.md` - Team member management
- `AUTH_SETUP.md` - Authentication system

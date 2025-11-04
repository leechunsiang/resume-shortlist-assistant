# Role-Based Access Control (RBAC) Implementation Guide

## Overview
This document provides a comprehensive guide to the RBAC system implemented in the Resume Shortlist Assistant. The system uses two complementary approaches:

1. **Organization Roles** - Simple role-based membership in organizations
2. **RBAC Permissions** - Granular permission system for fine-grained access control

## Role Hierarchy

### 1. Owner
**Full control over the organization**
- All admin permissions
- Transfer ownership
- Delete organization
- Cannot be removed by others
- Only one owner per organization

### 2. Admin
**Full access except ownership transfer**
- Manage all team members
- Assign/revoke roles (except owner)
- Full access to all features
- View audit logs
- Manage organization settings
- All CRUD operations on jobs and candidates
- Use AI features
- Export data

### 3. Member
**Standard access for daily operations**
- Create, read, update, delete jobs
- Create, read, update, delete candidates
- Use AI shortlisting features
- Export data
- View team members (cannot manage)
- Cannot access settings
- Cannot view audit logs

### 4. Viewer
**Read-only access**
- View job listings (read-only)
- View candidates (read-only)
- View team members
- Cannot create, update, or delete anything
- Cannot use AI features
- Cannot export data
- Cannot access settings

## Permission Matrix

| Feature | Owner | Admin | Member | Viewer |
|---------|-------|-------|--------|--------|
| **Jobs** |
| View jobs | ✅ | ✅ | ✅ | ✅ |
| Create jobs | ✅ | ✅ | ✅ | ❌ |
| Edit jobs | ✅ | ✅ | ✅ | ❌ |
| Delete jobs | ✅ | ✅ | ✅ | ❌ |
| Export jobs | ✅ | ✅ | ✅ | ❌ |
| **Candidates** |
| View candidates | ✅ | ✅ | ✅ | ✅ |
| Add candidates | ✅ | ✅ | ✅ | ❌ |
| Edit candidates | ✅ | ✅ | ✅ | ❌ |
| Delete candidates | ✅ | ✅ | ✅ | ❌ |
| Export candidates | ✅ | ✅ | ✅ | ❌ |
| **AI Features** |
| AI shortlisting | ✅ | ✅ | ✅ | ❌ |
| **Team Management** |
| View members | ✅ | ✅ | ✅ | ✅ |
| Invite members | ✅ | ✅ | ❌ | ❌ |
| Change roles | ✅ | ✅ | ❌ | ❌ |
| Remove members | ✅ | ✅ | ❌ | ❌ |
| **Organization** |
| View settings | ✅ | ✅ | ❌ | ❌ |
| Edit settings | ✅ | ✅ | ❌ | ❌ |
| View audit logs | ✅ | ✅ | ❌ | ❌ |
| Delete organization | ✅ | ❌ | ❌ | ❌ |
| Transfer ownership | ✅ | ❌ | ❌ | ❌ |

## Implementation Details

### Database Schema

#### organization_members table
```sql
CREATE TABLE organization_members (
    id UUID PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id),
    user_id VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'member', -- owner, admin, member, viewer
    status VARCHAR(50) DEFAULT 'active',
    invited_by VARCHAR(255),
    invited_at TIMESTAMP,
    joined_at TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    UNIQUE(organization_id, user_id)
);
```

#### roles table (Advanced RBAC)
```sql
CREATE TABLE roles (
    id UUID PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL, -- admin, recruiter, viewer
    description TEXT,
    created_at TIMESTAMP
);
```

#### permissions table
```sql
CREATE TABLE permissions (
    id UUID PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'jobs.create'
    description TEXT,
    resource VARCHAR(50) NOT NULL, -- jobs, candidates, users, settings
    action VARCHAR(50) NOT NULL, -- create, read, update, delete
    created_at TIMESTAMP
);
```

### Permission Naming Convention

Permissions follow the format: `resource.action`

Examples:
- `jobs.create` - Create new job listings
- `jobs.read` - View job listings
- `jobs.update` - Edit job listings
- `jobs.delete` - Delete job listings
- `candidates.create` - Add candidates
- `users.manage` - Manage team members
- `settings.manage` - Manage organization settings
- `audit.view` - View audit logs
- `ai.shortlist` - Use AI features

### Usage in Frontend (React)

#### Permission Hook
```tsx
import { usePermissions } from '@/lib/rbac';

function JobListings() {
  const { can, canAny, canAll } = usePermissions();

  // Check single permission
  const canEdit = can('jobs.update');
  const canDelete = can('jobs.delete');

  // Check if user has ANY of the permissions
  const canModify = canAny(['jobs.update', 'jobs.delete']);

  // Check if user has ALL permissions
  const isFullAccess = canAll(['jobs.create', 'jobs.update', 'jobs.delete']);

  return (
    <div>
      {canEdit && <button>Edit</button>}
      {canDelete && <button>Delete</button>}
    </div>
  );
}
```

#### Role-Based Checks
```tsx
import { useRole } from '@/lib/rbac';

function Settings() {
  const { isOwner, isAdmin, isMember, isViewer, hasRole } = useRole();

  if (!isAdmin && !isOwner) {
    return <div>Access Denied</div>;
  }

  return (
    <div>
      {isOwner && <button>Transfer Ownership</button>}
      {(isOwner || isAdmin) && <button>Manage Team</button>}
    </div>
  );
}
```

### Usage in Backend (API Routes)

#### Permission Middleware
```typescript
import { requirePermission, requireRole } from '@/lib/rbac';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  const { organizationId } = await request.json();

  // Check permission
  const { authorized, error } = await requirePermission(
    user.id,
    organizationId,
    'jobs.create'
  );

  if (!authorized) {
    return Response.json({ error }, { status: 403 });
  }

  // Proceed with operation
  // ...
}
```

#### Role Middleware
```typescript
import { requireRole } from '@/lib/rbac';

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  const { organizationId } = await request.json();

  // Check if user is owner or admin
  const { authorized } = await requireRole(
    user.id,
    organizationId,
    ['owner', 'admin']
  );

  if (!authorized) {
    return Response.json(
      { error: 'Only owners and admins can delete members' },
      { status: 403 }
    );
  }

  // Proceed with deletion
  // ...
}
```

## Security Best Practices

1. **Always check permissions on the backend** - Never rely solely on frontend checks
2. **Use least privilege** - Grant minimum permissions necessary
3. **Validate organization context** - Ensure user belongs to organization
4. **Log permission checks** - Track access attempts in audit logs
5. **Handle permission errors gracefully** - Show user-friendly messages

## Common Patterns

### Hiding UI Elements
```tsx
{can('jobs.delete') && (
  <button onClick={handleDelete}>Delete Job</button>
)}
```

### Disabling Actions
```tsx
<button
  disabled={!can('jobs.update')}
  onClick={handleEdit}
>
  Edit Job
</button>
```

### Conditional Rendering
```tsx
{isOwner || isAdmin ? (
  <AdminPanel />
) : (
  <StandardView />
)}
```

### Navigation Guards
```tsx
useEffect(() => {
  if (!can('settings.manage')) {
    router.push('/dashboard');
  }
}, [can, router]);
```

## Testing Permissions

### Manual Testing
1. Create test users with different roles
2. Login as each role
3. Verify access to features matches permission matrix
4. Test edge cases (owner transfer, role changes)

### Automated Testing
```typescript
describe('RBAC Permissions', () => {
  it('should allow admin to manage members', async () => {
    const admin = await createTestUser('admin');
    const result = await hasPermission(admin.id, orgId, 'users.manage');
    expect(result).toBe(true);
  });

  it('should deny viewer from creating jobs', async () => {
    const viewer = await createTestUser('viewer');
    const result = await hasPermission(viewer.id, orgId, 'jobs.create');
    expect(result).toBe(false);
  });
});
```

## Troubleshooting

### Permission Denied Errors
1. Check user's role in organization
2. Verify permission exists in database
3. Check role-permission mapping
4. Review RLS policies in Supabase

### Role Assignment Issues
1. Ensure user is member of organization
2. Check organization_members table
3. Verify user_roles table entries
4. Review migration scripts

### Common Mistakes
- Forgetting to check permissions on backend
- Using wrong permission name format
- Not refreshing permissions after role change
- Missing organization context in checks

## Future Enhancements

- [ ] Custom roles with configurable permissions
- [ ] Time-based permissions (temporary access)
- [ ] Permission groups for easier management
- [ ] Permission inheritance between organizations
- [ ] Two-factor authentication for sensitive operations
- [ ] IP-based access restrictions
- [ ] API key-based permissions for integrations

# RBAC Quick Reference Guide

## Frontend Permission Checks

### Using the usePermissions Hook

```tsx
import { usePermissions } from '@/lib/rbac';

function JobListingPage() {
  const { can, canAny, canAll } = usePermissions();
  const [canEdit, setCanEdit] = useState(false);
  const [canDelete, setCanDelete] = useState(false);

  useEffect(() => {
    const checkPermissions = async () => {
      setCanEdit(await can('jobs.update'));
      setCanDelete(await can('jobs.delete'));
    };
    checkPermissions();
  }, [can]);

  return (
    <div>
      {canEdit && <button>Edit Job</button>}
      {canDelete && <button>Delete Job</button>}
    </div>
  );
}
```

### Using the useRole Hook

```tsx
import { useRole } from '@/lib/rbac';

function SettingsPage() {
  const { isOwner, isAdmin, isMember, isViewer, hasRole } = useRole();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const checkRole = async () => {
      const isOwn = await isOwner();
      const isAdm = await isAdmin();
      
      if (isOwn) setUserRole('owner');
      else if (isAdm) setUserRole('admin');
    };
    checkRole();
  }, [isOwner, isAdmin]);

  // Only owners and admins can access settings
  if (userRole !== 'owner' && userRole !== 'admin') {
    return <div>Access Denied</div>;
  }

  return <div>Settings Content</div>;
}
```

### Conditional Rendering

```tsx
// Show button only if user has permission
{canEdit && (
  <button onClick={handleEdit}>Edit</button>
)}

// Show different UI based on role
{isOwner ? (
  <OwnerDashboard />
) : isAdmin ? (
  <AdminDashboard />
) : (
  <MemberDashboard />
)}
```

### Disable Actions

```tsx
<button
  disabled={!canDelete}
  onClick={handleDelete}
  className={!canDelete ? 'opacity-50 cursor-not-allowed' : ''}
>
  Delete Job
</button>
```

## Backend Permission Checks (API Routes)

### Check Permission

```typescript
// app/api/jobs/create/route.ts
import { requirePermission } from '@/lib/rbac';
import { authApi } from '@/lib/supabase';

export async function POST(request: Request) {
  // Get authenticated user
  const user = await authApi.getCurrentUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get organization ID from request
  const { organizationId, title, description } = await request.json();

  // Check if user has permission
  const { authorized, error } = await requirePermission(
    user.id,
    organizationId,
    'jobs.create'
  );

  if (!authorized) {
    return Response.json({ error }, { status: 403 });
  }

  // User has permission, proceed with operation
  // ... create job logic
  
  return Response.json({ success: true });
}
```

### Check Role

```typescript
// app/api/organization/delete/route.ts
import { requireRole } from '@/lib/rbac';
import { authApi } from '@/lib/supabase';

export async function DELETE(request: Request) {
  const user = await authApi.getCurrentUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { organizationId } = await request.json();

  // Only owners can delete organizations
  const { authorized, error, role } = await requireRole(
    user.id,
    organizationId,
    'owner'
  );

  if (!authorized) {
    return Response.json({ error }, { status: 403 });
  }

  // User is owner, proceed with deletion
  // ... delete organization logic

  return Response.json({ success: true });
}
```

### Check Multiple Roles

```typescript
// app/api/members/manage/route.ts
import { requireRole } from '@/lib/rbac';
import { authApi } from '@/lib/supabase';

export async function POST(request: Request) {
  const user = await authApi.getCurrentUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { organizationId } = await request.json();

  // Both owners and admins can manage members
  const { authorized, error } = await requireRole(
    user.id,
    organizationId,
    ['owner', 'admin']
  );

  if (!authorized) {
    return Response.json({ error }, { status: 403 });
  }

  // Proceed with member management
  // ...

  return Response.json({ success: true });
}
```

## Permission Reference

### Jobs
- `jobs.create` - Create new job listings
- `jobs.read` - View job listings
- `jobs.update` - Edit job listings
- `jobs.delete` - Delete job listings
- `jobs.export` - Export job data

### Candidates
- `candidates.create` - Add new candidates
- `candidates.read` - View candidate profiles
- `candidates.update` - Edit candidate information
- `candidates.delete` - Delete candidates
- `candidates.export` - Export candidate data

### Team Management
- `users.manage` - Manage team members and roles

### Organization
- `settings.manage` - Manage organization settings
- `audit.view` - View audit logs
- `organization.delete` - Delete organization (owner only)
- `organization.transfer` - Transfer ownership (owner only)

### AI Features
- `ai.shortlist` - Use AI shortlisting features

## Common Patterns

### Navigation Guard (Redirect if no permission)

```tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/lib/rbac';

export default function AdminPage() {
  const router = useRouter();
  const { can } = usePermissions();

  useEffect(() => {
    const checkAccess = async () => {
      const hasAccess = await can('settings.manage');
      if (!hasAccess) {
        router.push('/dashboard');
      }
    };
    checkAccess();
  }, [can, router]);

  return <div>Admin Content</div>;
}
```

### Show Loading Until Permission Check Complete

```tsx
function ProtectedComponent() {
  const { can } = usePermissions();
  const [canAccess, setCanAccess] = useState<boolean | null>(null);

  useEffect(() => {
    const checkPermission = async () => {
      const result = await can('jobs.delete');
      setCanAccess(result);
    };
    checkPermission();
  }, [can]);

  if (canAccess === null) {
    return <div>Loading...</div>;
  }

  if (!canAccess) {
    return <div>Access Denied</div>;
  }

  return <div>Protected Content</div>;
}
```

### Bulk Permission Check

```tsx
function MultiActionToolbar() {
  const { canAll } = usePermissions();
  const [hasFullAccess, setHasFullAccess] = useState(false);

  useEffect(() => {
    const checkPermissions = async () => {
      const result = await canAll([
        'jobs.update',
        'jobs.delete',
        'jobs.export'
      ]);
      setHasFullAccess(result);
    };
    checkPermissions();
  }, [canAll]);

  return (
    <div>
      {hasFullAccess ? (
        <FullToolbar />
      ) : (
        <LimitedToolbar />
      )}
    </div>
  );
}
```

## Testing Checklist

- [ ] Owner can access all features
- [ ] Admin can access all features except organization deletion/transfer
- [ ] Member can create/edit/delete jobs and candidates
- [ ] Member can use AI features
- [ ] Viewer can only view jobs and candidates
- [ ] Viewer cannot create, edit, or delete anything
- [ ] Backend API routes properly check permissions
- [ ] Unauthorized users receive 401 status
- [ ] Users without permission receive 403 status with error message
- [ ] Frontend UI hides/disables features based on permissions
- [ ] Role changes take effect immediately after update

## Best Practices

1. **Always check on backend** - Never rely solely on frontend checks
2. **Use meaningful error messages** - Help users understand why they can't access something
3. **Hide UI elements** - Don't just disable, hide elements user can't access
4. **Cache permission checks** - Use state to avoid repeated async calls
5. **Handle loading states** - Show loading indicator during permission checks
6. **Test with different roles** - Verify each role has correct access
7. **Log access attempts** - Use audit trail for security monitoring
8. **Update permissions immediately** - Refresh UI after role changes

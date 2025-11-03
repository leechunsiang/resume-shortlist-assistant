# RBAC, Audit Trail, and Export Features Implementation

## Overview
This document describes the implementation of Role-Based Access Control (RBAC), Audit Trail, and CSV/PDF Export features for the Resume Shortlist Assistant.

## 🎯 Features Implemented

### 1. Role-Based Access Control (RBAC)

#### Database Schema
- **Tables Created:**
  - `roles` - Stores role definitions (Admin, Recruiter, Viewer)
  - `permissions` - Granular permissions for resources and actions
  - `role_permissions` - Junction table mapping roles to permissions
  - `user_roles` - Assigns roles to users within organizations

#### Default Roles
1. **Admin**
   - Full access to all features
   - Can manage users, roles, and settings
   - Can view audit logs
   - All permissions granted

2. **Recruiter**
   - Can create, read, update, delete jobs
   - Can create, read, update, delete candidates
   - Can use AI shortlisting features
   - Can export data
   - Cannot manage users or view audit logs

3. **Viewer**
   - Read-only access to jobs and candidates
   - Cannot create, update, or delete
   - Cannot use AI features or export data

#### Permission System
Permissions follow the format: `resource.action`
- Jobs: `jobs.create`, `jobs.read`, `jobs.update`, `jobs.delete`, `jobs.export`
- Candidates: `candidates.create`, `candidates.read`, `candidates.update`, `candidates.delete`, `candidates.export`
- AI: `ai.shortlist`
- Users: `users.manage`
- Settings: `settings.manage`
- Audit: `audit.view`

#### Usage in Code
```typescript
import { usePermission, hasPermission, canPerformAction } from '@/lib/rbac';

// React hook usage
const { checkPermission, checkAction } = usePermission();
const canEdit = await checkAction('jobs', 'update');

// Direct usage
const hasAccess = await hasPermission(userId, organizationId, 'jobs.delete');

// API route protection
const { authorized, error } = await requirePermission(userId, orgId, 'jobs.create');
```

### 2. Audit Trail

#### Database Schema
- **Table:** `audit_logs`
  - Tracks user ID, organization, action, resource type, resource ID
  - Stores details as JSONB for flexibility
  - Records IP address and user agent
  - Indexed for fast queries

#### Tracked Actions
- `create` - Resource creation
- `update` - Resource modification
- `delete` - Resource deletion
- `view` - Resource viewing
- `export` - Data export
- `login` / `logout` - Authentication events

#### Usage in Code
```typescript
import { logAudit, useAuditLog } from '@/lib/audit';

// Direct logging
await logAudit({
  user_id: userId,
  organization_id: orgId,
  action: 'create',
  resource_type: 'job',
  resource_id: jobId,
  details: { title: 'Software Engineer' }
});

// React hook usage
const { log } = useAuditLog();
await log('update', 'candidate', candidateId, { status: 'shortlisted' });
```

#### Audit Logs Viewer
- Access at `/audit`
- Filter by action, resource type, date range
- Export logs to CSV
- View detailed information for each event
- Shows user actions timeline

### 3. CSV/PDF Export

#### Implemented Exports

**Job Listings:**
- `exportJobsToCSV(jobs)` - Export all jobs to CSV
- `exportJobsToPDF(jobs)` - Export jobs table to PDF
- `exportJobDetailsToPDF(job)` - Export single job with full details

**Candidates:**
- `exportCandidatesToCSV(candidates)` - Export all candidates to CSV
- `exportCandidatesToPDF(candidates)` - Export candidates table to PDF
- `exportCandidateProfileToPDF(candidate)` - Export single candidate profile

**Audit Logs:**
- `exportAuditLogsToCSV(logs)` - Export audit trail to CSV

#### Usage
Export buttons are available on:
- Job Listings page header (CSV and PDF buttons)
- Candidates page header (CSV and PDF buttons)
- Audit Logs page (CSV export button)

#### Technologies Used
- `jspdf` - PDF generation
- `jspdf-autotable` - Table formatting in PDFs
- `papaparse` - CSV parsing and generation

## 🚀 Setup Instructions

### 1. Database Setup

Run the migration file to create all necessary tables:

```bash
# In Supabase SQL Editor, execute:
rbac-audit-migration.sql
```

This will:
- Create all RBAC tables (roles, permissions, user_roles, role_permissions)
- Create audit_logs table
- Insert default roles and permissions
- Set up Row Level Security policies
- Create indexes for performance
- Set up automatic admin role assignment for organization creators

### 2. Verify Installation

Check that these files exist:
- `src/lib/rbac.ts` - RBAC utilities
- `src/lib/audit.ts` - Audit logging utilities
- `src/lib/export.ts` - Export utilities
- `src/app/audit/page.tsx` - Audit logs viewer
- `rbac-audit-migration.sql` - Database migration

### 3. Test the Features

**Test RBAC:**
1. Create a new organization (you'll be assigned Admin role automatically)
2. Try accessing different features
3. Check that permissions are enforced

**Test Audit Trail:**
1. Perform various actions (create job, update candidate, etc.)
2. Navigate to `/audit` to view the audit logs
3. Filter logs by action, resource, or date
4. Export logs to CSV

**Test Exports:**
1. Go to Job Listings page
2. Click CSV or PDF export buttons
3. Verify the downloaded files contain correct data
4. Repeat for Candidates page

## 📊 Database Structure

### Tables Overview

```
roles
├── id (UUID, PK)
├── name (VARCHAR, UNIQUE)
├── description (TEXT)
└── created_at (TIMESTAMP)

permissions
├── id (UUID, PK)
├── name (VARCHAR, UNIQUE)
├── description (TEXT)
├── resource (VARCHAR) - e.g., 'jobs', 'candidates'
├── action (VARCHAR) - e.g., 'create', 'read', 'update', 'delete'
└── created_at (TIMESTAMP)

role_permissions
├── role_id (UUID, FK -> roles)
└── permission_id (UUID, FK -> permissions)

user_roles
├── id (UUID, PK)
├── user_id (UUID)
├── organization_id (UUID, FK -> organizations)
├── role_id (UUID, FK -> roles)
├── assigned_at (TIMESTAMP)
└── assigned_by (UUID)

audit_logs
├── id (UUID, PK)
├── user_id (UUID)
├── organization_id (UUID, FK -> organizations)
├── action (VARCHAR)
├── resource_type (VARCHAR)
├── resource_id (UUID, NULLABLE)
├── details (JSONB)
├── ip_address (INET)
├── user_agent (TEXT)
└── created_at (TIMESTAMP)
```

## 🔐 Security Features

### Row Level Security (RLS)
All tables have RLS enabled with appropriate policies:
- Users can only view audit logs for their organization
- Users can only view roles in their organization
- Permissions are read-only for authenticated users

### Automatic Role Assignment
When a user creates an organization, they are automatically assigned the Admin role via database trigger.

### Permission Checks
All sensitive operations should check permissions before execution:
```typescript
const { authorized } = await requirePermission(userId, orgId, 'jobs.delete');
if (!authorized) {
  return { error: 'Insufficient permissions' };
}
```

## 📝 Usage Examples

### Adding Audit Logging to API Routes

```typescript
// In your API route
import { logAudit } from '@/lib/audit';

export async function POST(request: Request) {
  // ... perform action ...
  
  // Log the action
  await logAudit({
    user_id: user.id,
    organization_id: orgId,
    action: 'create',
    resource_type: 'job',
    resource_id: newJob.id,
    details: {
      title: newJob.title,
      department: newJob.department
    }
  });
  
  return Response.json({ success: true });
}
```

### Checking Permissions in Components

```typescript
'use client';

import { usePermission } from '@/lib/rbac';

export default function JobCard({ job }) {
  const { checkAction } = usePermission();
  const [canEdit, setCanEdit] = useState(false);
  
  useEffect(() => {
    checkAction('jobs', 'update').then(setCanEdit);
  }, []);
  
  return (
    <div>
      <h3>{job.title}</h3>
      {canEdit && <button>Edit</button>}
    </div>
  );
}
```

### Exporting Data

```typescript
import { exportJobsToCSV, exportJobsToPDF } from '@/lib/export';

function JobListingsHeader({ jobs }) {
  return (
    <div>
      <button onClick={() => exportJobsToCSV(jobs)}>
        Export CSV
      </button>
      <button onClick={() => exportJobsToPDF(jobs)}>
        Export PDF
      </button>
    </div>
  );
}
```

## 🎨 UI Components Added

### Audit Logs Page (`/audit`)
- Filterable table of all audit events
- Color-coded action badges
- Expandable details view
- CSV export button
- Date range filtering

### Export Buttons
- Added to Job Listings page header
- Added to Candidates page header
- Disabled when no data available
- Clear icons (Download for CSV, FileText for PDF)

## 🔄 Future Enhancements

Potential improvements for future development:
1. **User Management UI** - Add/remove users, assign roles
2. **Custom Roles** - Allow admins to create custom roles with selected permissions
3. **Audit Log Search** - Full-text search across audit log details
4. **Export Templates** - Customizable export formats and templates
5. **Permission Caching** - Cache permission checks for better performance
6. **Audit Alerts** - Notify admins of suspicious activities
7. **Compliance Reports** - Pre-built reports for compliance requirements
8. **API Rate Limiting** - Tie rate limits to user roles

## 📚 API Reference

### RBAC Functions
- `getUserRole(userId, organizationId)` - Get user's role
- `getRolePermissions(roleId)` - Get all permissions for a role
- `hasPermission(userId, orgId, permissionName)` - Check if user has permission
- `canPerformAction(userId, orgId, resource, action)` - Check if user can perform action
- `assignRole(userId, orgId, roleName, assignedBy)` - Assign role to user
- `getAllRoles()` - Get all available roles
- `usePermission()` - React hook for permission checking

### Audit Functions
- `logAudit(entry)` - Log an audit event
- `getAuditLogs(organizationId, filters)` - Get filtered audit logs
- `exportAuditLogsToCSV(logs)` - Export logs to CSV
- `useAuditLog()` - React hook for audit logging

### Export Functions
- `exportJobsToCSV(jobs)` - Export jobs to CSV
- `exportJobsToPDF(jobs)` - Export jobs to PDF
- `exportJobDetailsToPDF(job)` - Export single job details
- `exportCandidatesToCSV(candidates)` - Export candidates to CSV
- `exportCandidatesToPDF(candidates)` - Export candidates to PDF
- `exportCandidateProfileToPDF(candidate)` - Export candidate profile

## ✅ Testing Checklist

- [ ] Run database migration successfully
- [ ] Verify default roles are created
- [ ] Verify admin role auto-assigned on org creation
- [ ] Test permission checks for different roles
- [ ] Create and view audit logs
- [ ] Filter audit logs by action and date
- [ ] Export audit logs to CSV
- [ ] Export jobs to CSV
- [ ] Export jobs to PDF
- [ ] Export candidates to CSV
- [ ] Export candidates to PDF
- [ ] Verify RLS policies work correctly
- [ ] Test export buttons are disabled when no data

## 🐛 Troubleshooting

**Issue:** Audit logs not appearing
- Check that `logAudit()` is being called after actions
- Verify organization_id is correct
- Check Supabase table has data

**Issue:** Permission checks always return false
- Verify user has a role assigned in `user_roles` table
- Check that role has appropriate permissions
- Confirm organization_id matches

**Issue:** Export buttons disabled
- Ensure there is data in the arrays
- Check for JavaScript errors in console
- Verify libraries are installed (jspdf, papaparse)

## 📞 Support

For issues or questions:
1. Check this documentation first
2. Review the implementation files in `/src/lib/`
3. Check Supabase logs for database errors
4. Review browser console for client-side errors

---

**Version:** 1.0.0  
**Last Updated:** 2025-01-03  
**Dependencies:** jspdf, jspdf-autotable, papaparse, @supabase/supabase-js

# Database Architecture - Resume Shortlist Assistant

## Overview
This application uses a **multi-tenant organization-based architecture** where all data is scoped to organizations.

## Data Flow & Relationships

```
User (Supabase Auth)
    ↓
Organizations (user can belong to multiple orgs)
    ↓
├── Job Listings (organization_id)
│       ↓
│   Job Applications (links candidates to specific jobs)
│       ↓
└── Candidates (organization_id)
```

## Key Principles

### 1. **Organization-Based Isolation**
- Every piece of data (jobs, candidates, etc.) belongs to an organization
- Users can only see data from organizations they're members of
- This ensures complete tenant isolation

### 2. **Candidates Must Be Tied to Jobs**
- Candidates should NOT exist independently
- Candidates are created when they apply to a specific job
- The `job_applications` table links candidates to jobs

### 3. **Job-First Workflow**
The correct flow is:
1. User creates an **Organization** (required after signup)
2. User creates **Job Listings** within the organization
3. Candidates apply to specific jobs (creates `candidate` + `job_application`)
4. Stats and lists show candidates grouped by their job applications

## Table Structure

### Core Tables

#### `organizations`
- **Purpose**: Company/organization entity
- **Key Fields**: `id`, `name`, `created_by`
- **Relationships**: Has many jobs, candidates, and members

#### `organization_members`
- **Purpose**: Links users to organizations with roles
- **Key Fields**: `organization_id`, `user_id`, `role`, `status`
- **Roles**: owner, admin, member, viewer

#### `job_listings`
- **Purpose**: Job postings within an organization
- **Key Fields**: `id`, `organization_id`, `title`, `requirements`, `status`
- **Foreign Key**: `organization_id` → `organizations(id)`

#### `candidates`
- **Purpose**: People who applied to jobs
- **Key Fields**: `id`, `organization_id`, `email`, `resume_text`
- **Foreign Key**: `organization_id` → `organizations(id)`
- **Constraint**: `UNIQUE(organization_id, email)` - One email per org

#### `job_applications`
- **Purpose**: Links candidates to specific jobs (many-to-many)
- **Key Fields**: `id`, `job_id`, `candidate_id`, `status`, `match_score`
- **Foreign Keys**: 
  - `job_id` → `job_listings(id)`
  - `candidate_id` → `candidates(id)`
- **Constraint**: `UNIQUE(job_id, candidate_id)` - Can't apply twice to same job

## Dashboard Statistics

The dashboard shows organization-specific stats:

- **Total Candidates**: Count of candidates in your organization
- **Shortlisted**: Candidates with `status='shortlisted'` in `job_applications`
- **Pending Review**: Candidates with `status='pending'` in `job_applications`
- **Success Rate**: Percentage of candidates hired (status='hired')
- **Active Jobs**: Jobs with `status='active'`

## Current Issues & Fixes

### ❌ Problem: Candidates without Job Applications
If you see candidates on the dashboard but have no jobs:
1. **Clean up orphaned data**: Delete candidates not linked to any job application
2. **Fix the flow**: Always create job listings first, then add candidates to specific jobs

### ✅ Solution Implemented:
1. **Dashboard now shows organization-scoped stats** - Uses `organizationId` filter
2. **Stats are calculated from job_applications** - Ensures candidates are tied to jobs
3. **Empty state message updated** - "Create a job listing and add candidates to get started"

## SQL Queries to Clean Up

If you have orphaned candidates (not linked to any job application), run:

```sql
-- Find candidates without any job applications
SELECT c.* 
FROM candidates c
LEFT JOIN job_applications ja ON c.id = ja.candidate_id
WHERE ja.id IS NULL;

-- Delete candidates without job applications (CAREFUL!)
DELETE FROM candidates
WHERE id IN (
    SELECT c.id 
    FROM candidates c
    LEFT JOIN job_applications ja ON c.id = ja.candidate_id
    WHERE ja.id IS NULL
);
```

## Best Practices

### Creating a Candidate
When adding a new candidate, you should:
1. Have an existing job listing
2. Create the candidate record (with `organization_id`)
3. Create a job_application record linking candidate to job
4. Set initial status (usually 'pending')

### Viewing Candidates
Instead of querying `candidates` table directly, query through `job_applications`:

```typescript
// ❌ Don't do this:
const candidates = await candidatesApi.getAll(orgId);

// ✅ Do this instead:
const jobApplications = await supabase
  .from('job_applications')
  .select('*, candidates(*), job_listings(*)')
  .eq('job_listings.organization_id', orgId);
```

## AI Shortlisting Flow

When using AI to shortlist candidates:
1. Select a job listing
2. System fetches all candidates who applied to that job (via `job_applications`)
3. AI analyzes each candidate's resume against job requirements
4. Results are saved back to `job_applications.ai_analysis` (JSONB field)
5. Status is updated to 'shortlisted' or 'rejected' based on AI recommendation

## Next Steps to Implement

1. **Update Candidates Page**: Show candidates grouped by job they applied to
2. **Add "Apply to Job" flow**: Create candidate + job_application in one transaction
3. **Remove standalone candidate creation**: Always require a job_id
4. **Add job filter**: On candidates page, filter by job listing
5. **Update AI shortlist**: Ensure it only works on candidates with job_applications

## Migration Checklist

If you're upgrading from single-tenant to multi-tenant:
- [x] Run `supabase-migration.sql` to add organization tables
- [x] Add `organization_id` to all data tables
- [x] Update all API calls to filter by `organizationId`
- [x] Add organization checks to all pages
- [x] Update stats to be organization-specific
- [ ] Clean up orphaned candidates
- [ ] Test job → candidate → application flow
- [ ] Add UI for viewing candidates per job

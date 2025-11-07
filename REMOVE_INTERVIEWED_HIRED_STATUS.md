# Remove Interviewed/Hired Status & Add Override Feature

## Overview
Simplified the candidate status system by removing "interviewed" and "hired" statuses. Added an "overridden" status with a manual override button for rejected candidates.

## Status System Changes

### Before
- `pending` ❌ (removed in previous update)
- `shortlisted` ✅
- `rejected` ❌
- `interviewed` 🔵 (REMOVED)
- `hired` 🟢 (REMOVED)

### After
- `shortlisted` ✅ (Green) - Candidate meets requirements (score >= 50)
- `rejected` ❌ (Red) - Candidate doesn't meet requirements (score < 50)
- `overridden` 🟣 (Purple) - **NEW** Rejected candidate manually overridden by recruiter

## Key Changes

### 1. TypeScript Types (`src/lib/supabase.ts`)

**Updated status union types:**
```typescript
// Before
status: 'shortlisted' | 'rejected' | 'interviewed' | 'hired'

// After
status: 'shortlisted' | 'rejected' | 'overridden'
```

**Applied to:**
- `Candidate` interface
- `JobApplication` interface

### 2. Candidates Page UI (`src/app/candidates/page.tsx`)

**Removed:**
- ❌ "Interviewed" stat card
- ❌ "Interviewed" filter tab
- ❌ Status dropdown selector in side panel
- ❌ `interviewedRipple` hook

**Added:**
- ✅ "Overridden" stat card
- ✅ "Overridden" filter tab
- ✅ Status badge (read-only) in side panel
- ✅ Override button for rejected candidates
- ✅ Purple color scheme for overridden status

**Override Button Features:**
- Only visible for rejected candidates
- Hidden for viewers (RBAC compliant)
- One-click override to "overridden" status
- Updates local state immediately
- Error handling with user feedback

### 3. Landing Page (`src/app/page.tsx`)

**Updated status color function:**
```typescript
const getStatusColor = (status: string) => {
  switch (status) {
    case 'shortlisted': return 'text-emerald-400';
    case 'rejected': return 'text-red-400';
    case 'overridden': return 'text-purple-400'; // NEW
    default: return 'text-gray-400';
  }
};
```

**Updated status badge styles:**
- Removed interviewed (blue) and hired (green) styling
- Added overridden (purple) styling

### 4. Dashboard Stats (`src/lib/supabase.ts`)

**Success Rate Calculation Changed:**
```typescript
// Before: hired / total applications
const successRate = Math.round(((hired || 0) / totalApplications) * 100);

// After: shortlisted / total candidates
const successRate = Math.round(((shortlisted || 0) / totalApplications) * 100);
```

### 5. Database Migration (`supabase/migrations/20251107110000_remove_interviewed_hired_status.sql`)

**Updates existing data:**
```sql
-- Convert interviewed/hired to shortlisted
UPDATE candidates
SET status = 'shortlisted'
WHERE status IN ('interviewed', 'hired');

UPDATE job_applications
SET status = 'shortlisted'
WHERE status IN ('interviewed', 'hired');
```

## Override Feature Details

### How It Works

1. **Candidate is auto-rejected** when AI score < 50
2. **Recruiter reviews** the rejected candidate
3. **Override button appears** in candidate detail panel (rejected status only)
4. **Click override** to change status to "overridden"
5. **Candidate is now marked** for reconsideration

### Use Cases

- AI misjudged a candidate's qualifications
- Special considerations (diversity, internal referral, etc.)
- Manual review reveals hidden strengths
- Portfolio/work samples not captured in resume text
- Industry-specific context that AI couldn't understand

### UI Implementation

```tsx
{selectedCandidate.status === 'rejected' && !isViewerRole && (
  <button
    onClick={async () => {
      await candidatesApi.update(selectedCandidate.id, { 
        status: 'overridden' 
      });
      // Update UI...
    }}
    className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 
               text-purple-400 border border-purple-500/30"
  >
    <svg>✓</svg>
    Override
  </button>
)}
```

### RBAC Compliance

- ✅ Owners: Can override
- ✅ Admins: Can override
- ✅ Members: Can override
- ❌ Viewers: Cannot override (button hidden)

## Visual Changes

### Candidate Detail Panel

**Before:**
```
[Name]
[Position]
Status: [Dropdown with 5 options]
```

**After:**
```
[Name]
[Position]
[Status Badge] [Override Button]
              (only for rejected + non-viewers)
```

### Stats Cards

**Before:**
- Total Candidates
- Shortlisted
- Rejected
- **Interviewed** ← REMOVED

**After:**
- Total Candidates
- Shortlisted
- Rejected
- **Overridden** ← NEW

### Filter Tabs

**Before:**
`All | Shortlisted | Rejected | Interviewed`

**After:**
`All | Shortlisted | Rejected | Overridden`

## Color Scheme

| Status | Color | Hex | Usage |
|--------|-------|-----|-------|
| Shortlisted | Emerald/Green | `#10b981` | Qualified candidates |
| Rejected | Red | `#ef4444` | Auto-rejected (score < 50) |
| Overridden | Purple | `#a855f7` | Manually overridden rejections |

## Migration Instructions

### 1. Apply Database Migration

```bash
# Using Supabase CLI
cd "c:\Users\Lee Chun Siang\Documents\GitHub\resume-shortlist-assistant"
supabase db push

# Or run SQL manually in Supabase Dashboard
# File: supabase/migrations/20251107110000_remove_interviewed_hired_status.sql
```

### 2. Verify Changes

```bash
# Start dev server
npm run dev

# Test the following:
```

- [ ] No "Interviewed" stat card or filter tab
- [ ] Status dropdown removed from side panel
- [ ] Status badge shows correctly
- [ ] Override button appears for rejected candidates
- [ ] Override button hidden for viewers
- [ ] Clicking override updates status to "overridden"
- [ ] Overridden filter works correctly
- [ ] Existing interviewed/hired candidates now shortlisted

## Files Modified

1. ✅ `src/lib/supabase.ts` - Types and dashboard stats
2. ✅ `src/app/candidates/page.tsx` - UI components and override button
3. ✅ `src/app/page.tsx` - Landing page status display
4. ✅ `supabase/migrations/20251107110000_remove_interviewed_hired_status.sql` - Migration

## Benefits

1. **Simpler Workflow**: 3 statuses instead of 5
2. **Clearer Purpose**: Focus on shortlist/reject decision
3. **Better UX**: Read-only status with explicit override action
4. **Flexibility**: Can still override AI decisions when needed
5. **Audit Trail**: "Overridden" status clearly marks manual interventions

## Workflow Example

```
1. AI analyzes resume
   ↓
2a. Score >= 50 → shortlisted ✅
2b. Score < 50 → rejected ❌
   ↓
3. Recruiter reviews rejected candidate
   ↓
4. [Override Button] → overridden 🟣
   ↓
5. Candidate reconsidered for position
```

## API Behavior

### Candidate Creation
- Score >= 50: Status = `shortlisted`
- Score < 50: Status = `rejected`
- Override: Status = `overridden` (manual only)

### Status Update Endpoint
```typescript
// PATCH /api/candidates/:id
{
  "status": "overridden" // or "shortlisted", "rejected"
}
```

### Query Filters
```typescript
// Get overridden candidates
candidates.filter(c => c.status === 'overridden')

// Get all qualified candidates (shortlisted + overridden)
candidates.filter(c => ['shortlisted', 'overridden'].includes(c.status))
```

## Rollback (If Needed)

If you need to revert these changes:

```sql
-- Add interviewed and hired back (not recommended)
ALTER TABLE candidates 
  ALTER COLUMN status TYPE varchar;
  
-- Remove check constraint if exists and recreate with old values
-- This is NOT recommended as it complicates the workflow
```

However, rolling back is **not recommended** as the simplified system provides better UX.

---

**Last Updated**: November 7, 2025  
**Migration Version**: 20251107110000  
**Previous Migration**: 20251107100000 (Remove pending status)

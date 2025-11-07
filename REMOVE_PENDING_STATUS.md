# Remove Pending Status - Implementation Summary

## Overview
Removed the "pending" status from the candidate management system. Candidates are now automatically categorized as either "shortlisted" or "rejected" based on their AI match scores.

## Status Logic

### Score-Based Status Assignment
- **Shortlisted**: Match score >= 50 (yellow zone and above)
- **Rejected**: Match score < 50 (red zone)

### Score Color Zones
- **Green Zone**: 85-100 (Emerald color)
- **Blue Zone**: 70-84 (Blue color)
- **Yellow Zone**: 50-69 (Yellow color)
- **Red Zone**: 0-49 (Red color) → Auto-rejected

## Changes Made

### 1. AI Shortlist API (`src/app/api/ai-shortlist/route.ts`)
**Updated logic to automatically reject low-scoring candidates:**

```typescript
// Before: Used recommendation text to determine status
status: analysis.recommendation === 'strongly_recommended' || analysis.recommendation === 'recommended' 
  ? 'shortlisted' 
  : 'pending'

// After: Use score threshold
const matchScore = Math.floor(analysis.matchScore);
const candidateStatus = matchScore >= 50 ? 'shortlisted' : 'rejected';
```

**Applied to three areas:**
- Resume upload mode (new candidates)
- Job application creation (upload mode)
- Batch analysis mode (existing candidates)

### 2. Candidates Page UI (`src/app/candidates/page.tsx`)

**Removed "pending" from:**
- ✅ Status color function (`getStatusColor`)
- ✅ Stats card (replaced with "Rejected" card)
- ✅ Ripple effect hooks (pendingRipple → rejectedRipple)
- ✅ Filter tabs (removed "Pending" tab)
- ✅ Status dropdown (removed "Pending" option)

**Updated stats:**
```typescript
// Before
const stats = {
  total: candidates.length,
  shortlisted: candidates.filter(c => c.status === 'shortlisted').length,
  pending: candidates.filter(c => c.status === 'pending').length,
  interviewed: candidates.filter(c => c.status === 'interviewed').length,
};

// After
const stats = {
  total: candidates.length,
  shortlisted: candidates.filter(c => c.status === 'shortlisted').length,
  rejected: candidates.filter(c => c.status === 'rejected').length,
  interviewed: candidates.filter(c => c.status === 'interviewed').length,
};
```

### 3. Database Migration (`supabase/migrations/20251107100000_remove_pending_status.sql`)

**Updates existing data:**
```sql
-- Update candidates table
UPDATE candidates
SET status = CASE 
  WHEN score >= 50 THEN 'shortlisted'
  ELSE 'rejected'
END
WHERE status = 'pending';

-- Update job_applications table
UPDATE job_applications
SET status = CASE 
  WHEN match_score >= 50 THEN 'shortlisted'
  ELSE 'rejected'
END
WHERE status = 'pending';
```

## Available Statuses

After these changes, the valid candidate statuses are:
1. **shortlisted** - Score >= 50, candidate meets minimum requirements
2. **rejected** - Score < 50, candidate does not meet requirements
3. **interviewed** - Candidate has been scheduled/completed interview
4. **hired** - Candidate has been hired

## Migration Instructions

To apply the database migration:

```bash
# If using Supabase CLI
supabase db push

# Or run the SQL directly in Supabase Dashboard
# Navigate to SQL Editor and execute:
# supabase/migrations/20251107100000_remove_pending_status.sql
```

## Benefits

1. **Clear Decision Making**: No ambiguous "pending" state
2. **Automatic Filtering**: Low-scoring candidates immediately rejected
3. **Simplified Workflow**: Binary decision (shortlist or reject)
4. **Score-Based Logic**: Transparent threshold (50 points)
5. **Better UX**: Users don't need to manually review every low-scoring candidate

## User Impact

- Existing candidates with "pending" status will be automatically reclassified
- New candidates uploaded through AI will be immediately categorized
- Users can still manually change status if needed (except viewers)
- Filter tabs now show: All, Shortlisted, Rejected, Interviewed

## Testing Checklist

- [ ] Upload resume with high score (>= 50) → Should be shortlisted
- [ ] Upload resume with low score (< 50) → Should be rejected
- [ ] Run AI shortlist on job → All candidates categorized correctly
- [ ] Filter by "Shortlisted" → Shows only shortlisted candidates
- [ ] Filter by "Rejected" → Shows only rejected candidates
- [ ] Stats cards display correct counts
- [ ] Status dropdown does not show "Pending" option
- [ ] Database migration updates existing records

## Rollback (If Needed)

If you need to revert these changes:

```sql
-- Add 'pending' back as an option (not recommended)
ALTER TABLE candidates 
  ALTER COLUMN status TYPE varchar 
  CHECK (status IN ('pending', 'shortlisted', 'rejected', 'interviewed', 'hired'));
```

However, this is **not recommended** as the new system provides clearer candidate management.

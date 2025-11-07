# Multiple Job Applications Feature

## Overview
This feature allows candidates to apply for multiple positions within an organization and provides a swipeable interface to view AI analysis for each application.

## Changes Made

### 1. Database Migration (`20251107130000_allow_multiple_applications.sql`)

**Purpose:** Remove the unique constraint on job applications to allow candidates to apply to multiple positions.

```sql
-- Removed UNIQUE constraint on (job_id, candidate_id)
ALTER TABLE job_applications DROP CONSTRAINT IF EXISTS job_applications_job_id_candidate_id_key;

-- Added non-unique index for performance
CREATE INDEX IF NOT EXISTS idx_job_applications_job_candidate ON job_applications(job_id, candidate_id);
```

**To Apply:** Run this migration in your Supabase dashboard SQL editor.

### 2. AI Shortlist API Updates (`src/app/api/ai-shortlist/route.ts`)

#### Upload Mode Changes:
- **Check for existing candidates** by email before creating new records
- **Reuse existing candidate records** when uploading resumes
- **Check for existing applications** to prevent duplicates
- **Skip duplicate applications** with informative messages

```typescript
// Check if candidate exists
const { data: existingCandidate } = await supabase
  .from('candidates')
  .select('*')
  .eq('organization_id', organizationId)
  .eq('email', candidateInfo.email)
  .single();

// Use existing candidate or create new one
if (existingCandidate) {
  candidate = existingCandidate;
} else {
  // Create new candidate
}

// Check if application already exists
const { data: existingApp } = await supabase
  .from('job_applications')
  .select('id')
  .eq('job_id', jobId)
  .eq('candidate_id', candidate.id)
  .single();

if (existingApp) {
  // Skip duplicate application
  continue;
}
```

#### Batch Mode Changes:
- **Removed filter** that prevented existing candidates from being analyzed
- **Added duplicate check** when creating applications
- **Allows same candidate** to apply to different positions

### 3. Candidates Page UI Updates (`src/app/candidates/page.tsx`)

#### New State Variable:
```typescript
const [currentApplicationIndex, setCurrentApplicationIndex] = useState(0);
```

#### Swipeable Navigation Controls:
- **Left/Right arrow buttons** to navigate between applications
- **Application counter** showing "X / Y" format
- **Disabled state** for buttons at boundaries
- **Smooth animations** using Framer Motion

#### Features:
- **Reset index to 0** when selecting a new candidate
- **AnimatePresence** for smooth slide transitions
- **Applied date display** for each application
- **Individual AI summaries** for each job position

### 4. User Experience Improvements

#### Before:
- ❌ Candidates could only apply to one position
- ❌ Error message: "All candidates have already applied to this job"
- ❌ No way to see multiple AI analyses

#### After:
- ✅ Candidates can apply to unlimited positions
- ✅ Existing candidates are reused (no duplicates)
- ✅ Swipeable interface to view all applications
- ✅ Individual AI analysis for each position
- ✅ Clear visual indication of current application (1 / 3)

## How to Use

### 1. Upload Resumes for Multiple Positions

```
1. Open Job Listings page
2. Click "AI Shortlist" button
3. Select a job position from dropdown
4. Upload resumes (TXT or PDF, max 10 files)
5. Analyze resumes
6. Repeat for different positions
```

### 2. View Candidate Applications

```
1. Open Candidates page
2. Click on any candidate card
3. Side panel opens showing:
   - Contact information
   - Skills
   - Overall score
   - Job Applications section
4. If multiple applications exist:
   - Use arrow buttons to navigate
   - View counter shows current position (e.g., "2 / 5")
   - Each application shows:
     * Job title and department
     * Match score
     * AI summary
     * Strengths and weaknesses
     * Matching skills
     * Applied date
```

### 3. Navigate Between Applications

**Navigation Controls:**
- **← Button:** Previous application (disabled on first)
- **Counter:** Shows "X / Y" where X is current, Y is total
- **→ Button:** Next application (disabled on last)

**Keyboard Support (Future Enhancement):**
- Arrow keys could be added for keyboard navigation
- Swipe gestures on touch devices

## Technical Details

### Database Schema
```sql
-- job_applications table
CREATE TABLE job_applications (
    id UUID PRIMARY KEY,
    job_id UUID REFERENCES job_listings(id),
    candidate_id UUID REFERENCES candidates(id),
    match_score INTEGER,
    ai_analysis JSONB,
    status VARCHAR(50),
    applied_at TIMESTAMP,
    -- NO UNIQUE constraint on (job_id, candidate_id)
);
```

### API Response Structure
```json
{
  "success": true,
  "results": [
    {
      "fileName": "resume.pdf",
      "candidateId": "uuid",
      "candidateName": "John Doe",
      "matchScore": 85,
      "recommendation": "strongly_recommended",
      "success": true
    },
    {
      "fileName": "resume2.pdf",
      "candidateId": "existing-uuid",
      "candidateName": "Jane Smith",
      "matchScore": 72,
      "skipped": true,
      "reason": "Already applied to this position"
    }
  ]
}
```

### Animations
- **Slide transition:** Smooth left/right slide when switching applications
- **Fade effect:** Combined with slide for professional look
- **Duration:** 0.2 seconds for quick, responsive feel

## Benefits

### For Recruiters:
1. **Comprehensive View:** See how a candidate matches different roles
2. **Easy Comparison:** Quickly navigate between applications
3. **Data Reuse:** No duplicate candidate records
4. **Flexible Workflow:** Analyze same candidate pool for multiple positions

### For System:
1. **Efficient Storage:** One candidate record, multiple applications
2. **Better Analytics:** Track candidate interest across positions
3. **Duplicate Prevention:** Smart checks prevent redundant data
4. **Scalability:** Support unlimited applications per candidate

## Future Enhancements

### Potential Improvements:
1. **Keyboard Navigation:** Arrow keys for power users
2. **Touch Gestures:** Swipe left/right on mobile devices
3. **Application Comparison:** Side-by-side view of multiple applications
4. **Bulk Operations:** Apply candidate to multiple positions at once
5. **Application Notes:** Add position-specific notes
6. **Timeline View:** Chronological application history
7. **Status Per Application:** Track status separately for each position

## Migration Checklist

- [x] Create database migration file
- [x] Update API to handle existing candidates
- [x] Add duplicate application checks
- [x] Implement swipeable navigation UI
- [x] Add navigation controls
- [x] Test with multiple applications
- [x] Add smooth animations
- [x] Update documentation

## Testing Scenarios

### Test Case 1: New Candidate, Multiple Positions
1. Upload resume for Position A → Creates candidate + application
2. Upload same resume for Position B → Reuses candidate, creates new application
3. View candidate → Shows 2 applications with navigation

### Test Case 2: Existing Candidate, Same Position
1. Upload resume for Position A → Creates candidate + application
2. Upload same resume for Position A again → Skips with message
3. View candidate → Shows 1 application

### Test Case 3: Navigation
1. Select candidate with 3 applications
2. Default shows application 1/3
3. Click next → Shows application 2/3
4. Click next → Shows application 3/3 (next button disabled)
5. Click prev → Shows application 2/3

## Support

For issues or questions:
- Check database migration is applied
- Verify candidate email uniqueness within organization
- Check browser console for errors
- Review API logs for duplicate detection

## Version History

- **v1.0** (2025-11-07): Initial implementation
  - Multiple applications support
  - Swipeable navigation
  - Duplicate prevention
  - Smooth animations

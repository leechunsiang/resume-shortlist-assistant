# Multiple Applications - Quick Reference

## Quick Start

### 1. Apply Database Migration
```sql
-- Run in Supabase SQL Editor
ALTER TABLE job_applications DROP CONSTRAINT IF EXISTS job_applications_job_id_candidate_id_key;
CREATE INDEX IF NOT EXISTS idx_job_applications_job_candidate ON job_applications(job_id, candidate_id);
```

### 2. Upload Resumes for Multiple Jobs
1. Job Listings → AI Shortlist button
2. Select job from dropdown
3. Upload resumes (max 10 files)
4. Repeat for different positions

### 3. View Multiple Applications
1. Candidates page → Click candidate
2. See navigation controls if multiple applications exist
3. Use ← → arrows to switch between applications

## Key Features

✅ **Candidates can apply to unlimited positions**  
✅ **No duplicate candidate records**  
✅ **Swipeable navigation with smooth animations**  
✅ **Individual AI analysis per job**  
✅ **Automatic duplicate prevention**

## Navigation Controls

```
← [Prev]  |  1 / 3  |  [Next] →
```

- **Left Arrow:** Previous application (disabled on first)
- **Counter:** Current / Total applications
- **Right Arrow:** Next application (disabled on last)

## API Behavior

### Upload Same Resume to Different Jobs
```
Resume A → Job 1: Creates candidate + application ✓
Resume A → Job 2: Reuses candidate + new application ✓
Resume A → Job 1: Skips (already applied) ⊘
```

### Result Messages
- ✓ **Success:** "Analyzed X resumes"
- ⊘ **Skipped:** "Already applied to this position"
- ⊘ **Error:** Specific error message

## UI Changes

### Before
- One application per candidate
- No navigation needed
- Single AI summary

### After
- Multiple applications per candidate
- Arrow navigation + counter
- Swipeable AI summaries
- Applied date for each position

## File Changes

| File | Change |
|------|--------|
| `supabase/migrations/20251107130000_allow_multiple_applications.sql` | Remove unique constraint |
| `src/app/api/ai-shortlist/route.ts` | Handle existing candidates |
| `src/app/candidates/page.tsx` | Add swipeable navigation |

## Troubleshooting

### Issue: Duplicate candidate error
**Solution:** Database migration not applied. Run SQL migration.

### Issue: Navigation not showing
**Solution:** Candidate has only 1 application. Navigation appears for 2+ applications.

### Issue: Application skipped message
**Solution:** Candidate already applied to that job. This is expected behavior.

## Animation Details

- **Transition:** Slide left/right with fade
- **Duration:** 200ms
- **Effect:** Smooth, professional feel
- **Library:** Framer Motion

## Status Codes

| Status | Meaning |
|--------|---------|
| ✓ | Successfully created application |
| ⊘ | Skipped - already applied |
| ⚠ | Warning - partial success |
| ✗ | Error - failed to process |

## Best Practices

1. **Apply migration first** before testing
2. **Upload TXT format** for best results (PDF also supported)
3. **Max 10 files** per upload batch
4. **Select job** before uploading resumes
5. **Check navigation counter** to see total applications

## Quick Commands

```bash
# Start dev server
npm run dev

# Check for errors
npm run build

# View console logs
Open browser DevTools → Console tab
```

## Links

- Full Documentation: `MULTIPLE_APPLICATIONS_FEATURE.md`
- Migration File: `supabase/migrations/20251107130000_allow_multiple_applications.sql`
- API Code: `src/app/api/ai-shortlist/route.ts`
- UI Code: `src/app/candidates/page.tsx`

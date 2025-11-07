# Remove Pending Status - Quick Reference

## ✅ What Changed

### Status System Update
- **Before**: Candidates could be `pending`, `shortlisted`, `rejected`, `interviewed`, or `hired`
- **After**: Candidates can only be `shortlisted`, `rejected`, `interviewed`, or `hired`

### Automatic Status Assignment
New candidates are automatically assigned status based on AI match score:
- **Score >= 50**: `shortlisted` ✅
- **Score < 50**: `rejected` ❌

## 🎯 Score Zones

| Zone | Score Range | Color | Status | Action |
|------|-------------|-------|--------|--------|
| 🟢 Green | 85-100 | Emerald | Shortlisted | Ready for interview |
| 🔵 Blue | 70-84 | Blue | Shortlisted | Review recommended |
| 🟡 Yellow | 50-69 | Yellow | Shortlisted | Consider reviewing |
| 🔴 Red | 0-49 | Red | **Rejected** | **Auto-rejected** |

## 📝 Files Modified

1. **src/app/api/ai-shortlist/route.ts**
   - Changed status logic from recommendation-based to score-based
   - Added auto-rejection for scores < 50

2. **src/app/candidates/page.tsx**
   - Removed "pending" from status colors, filters, and dropdown
   - Replaced "Pending Review" stat card with "Rejected"
   - Updated ripple effects (pendingRipple → rejectedRipple)

3. **src/lib/supabase.ts**
   - Updated TypeScript types (removed 'pending' from status union)
   - Changed `DashboardStats.pending_review` to `rejected_count`
   - Updated dashboard stats queries

4. **src/app/page.tsx**
   - Changed pending candidates display to "recently added"
   - Updated status badge logic

5. **supabase/migrations/20251107100000_remove_pending_status.sql**
   - New migration to update existing pending records

## 🚀 How to Apply

### 1. Database Migration
```bash
# Using Supabase CLI
cd "c:\Users\Lee Chun Siang\Documents\GitHub\resume-shortlist-assistant"
supabase db push

# Or run SQL manually in Supabase Dashboard
# Copy contents of: supabase/migrations/20251107100000_remove_pending_status.sql
```

### 2. Test the Changes
```bash
# Run the dev server
npm run dev
```

### 3. Verify
- [ ] Upload a high-score resume (should be shortlisted)
- [ ] Upload a low-score resume (should be rejected)
- [ ] Check candidates page - no "Pending" tab/option
- [ ] Check stats display correctly
- [ ] Existing pending candidates updated to shortlisted/rejected

## 🔄 Migration SQL Summary

The migration updates two tables:

```sql
-- Update candidates
UPDATE candidates
SET status = CASE 
  WHEN score >= 50 THEN 'shortlisted'
  ELSE 'rejected'
END
WHERE status = 'pending';

-- Update job_applications
UPDATE job_applications
SET status = CASE 
  WHEN match_score >= 50 THEN 'shortlisted'
  ELSE 'rejected'
END
WHERE status = 'pending';
```

## 💡 Benefits

1. **No Ambiguity**: Clear binary decision (shortlist or reject)
2. **Time Saving**: Low-scoring candidates auto-rejected
3. **Transparency**: Score-based threshold (50 points)
4. **Simplified UI**: Fewer status options to manage
5. **Better Workflow**: Focus on qualified candidates only

## 📊 UI Changes

### Before
- Filter Tabs: All, Shortlisted, **Pending**, Interviewed, Rejected
- Status Dropdown: **Pending**, Shortlisted, Interviewed, Hired, Rejected

### After
- Filter Tabs: All, Shortlisted, **Rejected**, Interviewed
- Status Dropdown: Shortlisted, **Rejected**, Interviewed, Hired

## 🔧 Developer Notes

### TypeScript Types Updated
```typescript
// Before
status: 'pending' | 'shortlisted' | 'rejected' | 'interviewed' | 'hired'

// After
status: 'shortlisted' | 'rejected' | 'interviewed' | 'hired'
```

### API Response Changes
```typescript
// Before
interface DashboardStats {
  pending_review: number;
  // ...
}

// After
interface DashboardStats {
  rejected_count: number;
  // ...
}
```

## 📚 Related Documentation
- `REMOVE_PENDING_STATUS.md` - Full implementation details
- `CANDIDATE_STATUS_UPDATE.md` - Status update feature
- `GEMINI_AI_SETUP.md` - AI integration guide

---

**Last Updated**: November 7, 2025  
**Migration Version**: 20251107100000

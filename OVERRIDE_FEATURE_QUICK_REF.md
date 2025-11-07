# Override Feature - Quick Reference

## 📊 Current Status System

| Status | Color | When Applied | Can Override? |
|--------|-------|--------------|---------------|
| **shortlisted** | 🟢 Green | Score >= 50 (auto) | N/A |
| **rejected** | 🔴 Red | Score < 50 (auto) | ✅ Yes |
| **overridden** | 🟣 Purple | Manual (button click) | N/A |

## 🎯 How to Override a Rejected Candidate

1. Navigate to **Candidates** page
2. Click on a **rejected** candidate (red badge)
3. In the detail panel, locate the **Override** button (purple)
4. Click **Override**
5. Status changes to **overridden** immediately

## 🔘 Override Button

**Location:** Candidate detail side panel, next to status badge

**Visibility:**
- ✅ Shows for: Rejected candidates only
- ❌ Hidden for: Shortlisted, Overridden, Viewers

**Styling:**
```
[✓ Override]
Purple background with hover effect
Icon + text label
```

## 🎨 Status Colors

```css
Shortlisted → bg-emerald-500/20 text-emerald-400 border-emerald-500/30
Rejected    → bg-red-500/20 text-red-400 border-red-500/30
Overridden  → bg-purple-500/20 text-purple-400 border-purple-500/30
```

## 📱 UI Changes Summary

### Candidate Detail Panel

**Before:**
```
┌─────────────────────────────┐
│ [Avatar] John Doe           │
│          Software Engineer  │
│          Status: [Dropdown] │ ← REMOVED
└─────────────────────────────┘
```

**After:**
```
┌─────────────────────────────┐
│ [Avatar] John Doe           │
│          Software Engineer  │
│          [Rejected] [Override] │ ← NEW
└─────────────────────────────┘
```

### Filter Tabs

**Before:** `All | Shortlisted | Rejected | Interviewed`

**After:** `All | Shortlisted | Rejected | Overridden`

### Stats Cards (Dashboard)

**Before:**
- Total Candidates
- Shortlisted
- Rejected
- Interviewed ❌

**After:**
- Total Candidates
- Shortlisted
- Rejected
- Overridden ✅

## 🔒 RBAC Permissions

| Role | Can View Override Button | Can Click Override |
|------|-------------------------|-------------------|
| Owner | ✅ Yes | ✅ Yes |
| Admin | ✅ Yes | ✅ Yes |
| Member | ✅ Yes | ✅ Yes |
| Viewer | ❌ No | ❌ No |

## 🗄️ Database Schema

### Valid Status Values
```sql
candidates.status IN ('shortlisted', 'rejected', 'overridden')
job_applications.status IN ('shortlisted', 'rejected', 'overridden')
```

### Migration Applied
```sql
-- Converts interviewed/hired → shortlisted
UPDATE candidates 
SET status = 'shortlisted'
WHERE status IN ('interviewed', 'hired');
```

## 📈 When to Use Override

✅ **Good Use Cases:**
- AI missed key qualifications
- Strong portfolio not in resume text
- Internal referral or diversity considerations
- Industry-specific context
- Soft skills not captured by AI

❌ **Avoid Overriding For:**
- Personal bias
- Circumventing hiring standards
- Without proper review
- To inflate metrics

## 🔄 Status Flow

```
Resume Upload
     ↓
AI Analysis
     ↓
  Score?
   / \
>=50  <50
  ↓    ↓
Short- Rejected
listed    ↓
       [Override]
          ↓
      Overridden
```

## 💻 Code Snippets

### Get Override Statistics
```typescript
const overriddenCount = candidates.filter(
  c => c.status === 'overridden'
).length;
```

### Check if Can Override
```typescript
const canOverride = 
  candidate.status === 'rejected' && 
  !isViewer();
```

### Update Status to Override
```typescript
await candidatesApi.update(candidateId, { 
  status: 'overridden' 
});
```

## 🐛 Troubleshooting

**Override button not appearing?**
- Check if candidate is rejected status
- Verify user is not a viewer
- Ensure RBAC permissions loaded

**Override not saving?**
- Check network connection
- Verify API permissions
- Check browser console for errors

**Status badge not updating?**
- Refresh the page
- Check if local state updated
- Verify database migration applied

## 📝 Testing Checklist

- [ ] Override button shows for rejected candidates
- [ ] Override button hidden for viewers
- [ ] Clicking override updates status
- [ ] Status badge changes to purple
- [ ] Overridden filter tab works
- [ ] Stats card shows correct count
- [ ] Changes persist after page reload

## 🚀 Quick Start

```bash
# Apply migration
supabase db push

# Start dev server
npm run dev

# Test override feature
1. Go to /candidates
2. Find a rejected candidate (red badge)
3. Click on candidate to open detail panel
4. Click purple "Override" button
5. Verify status changes to "Overridden"
```

---

**Version**: 1.0  
**Last Updated**: November 7, 2025  
**Migration**: 20251107110000

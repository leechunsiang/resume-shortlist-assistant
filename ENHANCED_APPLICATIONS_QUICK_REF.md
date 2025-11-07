# Enhanced Applications - Quick Reference

## What's New?

### 1. ✨ Swipeable Score Cards
Each job application now shows its own match score with a circular progress indicator.

**How to use:**
- Open candidate side panel
- Use ← → arrows to navigate between jobs
- Each card shows position-specific match score

### 2. 🎯 Smart Job Indicators
Candidate cards show which jobs they're shortlisted for with visual badges.

**Indicators:**
- ✅ Green badge = Shortlisted
- ❌ Red badge = Rejected  
- Number in parentheses = Match score

**Example:**
```
Applied to 3 positions • Shortlisted for 2
[✓ Backend Dev (85)]  [✗ Frontend (45)]  [✓ Senior (92)]
```

### 3. 🎛️ Override with Job Selection
Override button now lets you choose which rejected position to approve.

**Workflow:**
1. Click "Override" button
2. If multiple rejections → dialog opens
3. Select job to approve
4. Click "Override & Approve"
5. That specific job gets approved

## Quick Actions

### View Application Details
```
1. Click candidate card
2. Side panel shows first application
3. Use ← → to switch between jobs
4. See score, AI analysis, strengths/weaknesses
```

### Override Single Rejection
```
1. Click candidate with rejected status
2. Click "Override" button
3. ✓ Done - instantly approved
```

### Override Multiple Rejections
```
1. Click candidate with multiple rejections
2. Click "Override" button
3. Select job from dialog
4. Click "Override & Approve"
5. ✓ Selected job approved
```

## Visual Guide

### Candidate Card Badges
| Badge | Meaning | Action |
|-------|---------|--------|
| `[✓ Job (85)]` | Shortlisted, 85% match | View details |
| `[✗ Job (45)]` | Rejected, 45% match | Can override |
| `[Job (70)]` | Pending review | Review needed |

### Score Card Colors
| Score Range | Color | Meaning |
|-------------|-------|---------|
| 80-100 | Green | Strong match |
| 50-79 | Yellow | Good match |
| 0-49 | Red | Weak match |

### Override Dialog
```
┌─────────────────────────────────┐
│  Override Rejection             │
│                                 │
│  Select position to approve:    │
│                                 │
│  ○ Backend Dev (85) ✓           │
│  ○ Frontend Dev (45)            │
│  ○ Senior Architect (38)        │
│                                 │
│  [Cancel] [Override & Approve]  │
└─────────────────────────────────┘
```

## Key Benefits

✅ **Position-Specific Scores** - See match for each job  
✅ **Visual Status** - Instant understanding of applications  
✅ **Selective Override** - Approve only the right position  
✅ **No Confusion** - Clear indicators prevent mistakes  
✅ **Fast Navigation** - Swipe through applications quickly  

## Tips

### Best Practices
1. **Review All Applications** - Use arrows to see all positions
2. **Check Match Scores** - Listed next to each job name
3. **Selective Approval** - Override only suitable positions
4. **Update Regularly** - Refresh to see latest statuses

### Common Scenarios

**Scenario 1: High Score, Rejected**
- Match score: 85
- Status: Rejected (auto-rejected before)
- Action: Override to approve

**Scenario 2: Multiple Applications**
- Applied to 5 jobs
- Shortlisted for 3, rejected for 2
- Action: Review rejected ones, override if suitable

**Scenario 3: Borderline Scores**
- Scores: 48, 52, 75
- First rejected (< 50), others shortlisted
- Action: Override first if reconsidering threshold

## Keyboard Shortcuts (Coming Soon)

| Key | Action |
|-----|--------|
| ← | Previous application |
| → | Next application |
| Space | Toggle override dialog |
| Esc | Close dialog |

## File Locations

- **Main Code:** `src/app/candidates/page.tsx`
- **Full Docs:** `ENHANCED_APPLICATIONS_FEATURES.md`
- **Migration:** No migration needed

## Troubleshooting

**Q: Score not showing?**  
A: Refresh page, check if AI analysis completed

**Q: Override button disabled?**  
A: Check user role - viewers can't override

**Q: Can't see all applications?**  
A: Use arrow buttons to navigate

**Q: Card not updating?**  
A: Refresh page or re-select candidate

## Support

For issues:
1. Check browser console for errors
2. Verify user has proper permissions
3. Ensure candidate has applications
4. Refresh candidate list

## Version

- **Version:** 1.1.0
- **Release Date:** November 7, 2025
- **Dependencies:** No new dependencies
- **Breaking Changes:** None

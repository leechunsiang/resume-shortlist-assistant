# Search/Filter Feature - Quick Reference

## Quick Start Guide

### Job Listings Search
1. Go to: **Job Listings** page
2. Look for the search bar below the stats cards
3. Type to search by:
   - Job title (e.g., "Software Engineer")
   - Department (e.g., "Engineering")
   - Location (e.g., "Remote")
   - Requirements (e.g., "React", "Python")

**Example searches:**
- "engineer" - finds all engineering jobs
- "remote" - finds all remote positions
- "react" - finds jobs requiring React

### Candidates Search
1. Go to: **Candidates** page
2. Look for the search bar below the status filter tabs
3. Type to search by:
   - Name (first or last)
   - Email address
   - Phone number
   - Applied position

**Example searches:**
- "john" - finds all Johns
- "@gmail.com" - finds all Gmail users
- "555-0123" - finds by phone number
- "developer" - finds candidates who applied for developer positions

## Visual Layout

### Job Listings Page Structure
```
┌─────────────────────────────────────────────────┐
│ Job Listings Header                             │
│ [Export] [Create New Job]                      │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│ [Total] [Active] [Applicants] [Draft]          │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│ 🔍 Search by title, department, location...    │
│    Found 5 jobs matching "remote"          [X]  │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│ ╔═══════════════╗ ╔═══════════════╗            │
│ ║  Job Card 1   ║ ║  Job Card 2   ║            │
│ ╚═══════════════╝ ╚═══════════════╝            │
└─────────────────────────────────────────────────┘
```

### Candidates Page Structure
```
┌─────────────────────────────────────────────────┐
│ Candidates Header                               │
│                                      [Export]   │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│ [Total] [Shortlisted] [Pending] [Interviewed]  │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│ [All] [Shortlisted] [Pending] [Interviewed]    │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│ 🔍 Search by name, email, phone, position...   │
│    Found 3 candidates matching "john"      [X]  │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│ ╔═════════════════════════════════════════╗    │
│ ║  👤 Candidate Card 1                    ║    │
│ ╚═════════════════════════════════════════╝    │
│ ╔═════════════════════════════════════════╗    │
│ ║  👤 Candidate Card 2                    ║    │
│ ╚═════════════════════════════════════════╝    │
└─────────────────────────────────────────────────┘
```

## Features

### ✅ Real-Time Search
- No need to press Enter
- Results update as you type
- Instant feedback

### ✅ Clear Button
- Click the X to clear search
- Returns to full list
- Maintains status filter (on Candidates page)

### ✅ Result Count
- Shows how many items match
- Updates in real-time
- Displays search query

### ✅ Smart Empty States
- Different messages for:
  - No data at all
  - No search results
- Helpful suggestions

### ✅ Case-Insensitive
- "JOHN" = "john" = "John"
- Searches work regardless of caps

### ✅ Multi-Field Search
- One search box
- Searches all relevant fields
- Finds matches anywhere

## Common Use Cases

### Finding a Specific Job
**Scenario:** Looking for remote software engineer position
**Solution:** Type "remote engineer" in Job Listings search

### Finding a Candidate by Email
**Scenario:** Need to find john.doe@email.com
**Solution:** Type "@email.com" or "john.doe" in Candidates search

### Finding All Engineering Roles
**Scenario:** View all jobs in Engineering dept
**Solution:** Type "engineering" in Job Listings search

### Finding Candidates for Specific Job
**Scenario:** See who applied for "Frontend Developer"
**Solution:** Type "frontend developer" in Candidates search

## Tips & Tricks

### Partial Matching
- Search "eng" to find "Engineering", "Engineer", etc.
- Search "john" to find "Johnson", "Johnny", etc.

### Combined Filters (Candidates)
1. Click a status tab (e.g., "Shortlisted")
2. Type in search box
3. See only shortlisted candidates matching your search

### Quick Clear
- Click the X button
- Or select all text and delete
- Or press Escape (if implemented)

## Keyboard Navigation

| Key | Action |
|-----|--------|
| Click search box | Start typing |
| Type | Filter results |
| Esc | (Future: Clear search) |
| Tab | Navigate to next element |

## Performance Notes

- ⚡ **Instant** - No server requests needed
- 💾 **Efficient** - Filters existing data
- 🎯 **Accurate** - Searches all relevant fields
- 🔒 **Safe** - Null-safe, handles missing data

## Troubleshooting

### No Results Found
1. Check spelling
2. Try shorter search terms
3. Try different fields
4. Clear search and try again

### Search Not Working
1. Check if data is loaded (stats cards show numbers)
2. Refresh the page
3. Clear browser cache
4. Check console for errors

## Developer Notes

### State Management
- Uses React `useState` hook
- Search query stored in component state
- Filter logic computed on each render

### Filter Algorithm
```typescript
// Job Listings
jobs.filter(job => 
  title.includes(query) ||
  department.includes(query) ||
  location.includes(query) ||
  requirements.includes(query)
)

// Candidates
candidates
  .filter(statusFilter)
  .filter(searchFilter)
```

### Null Safety
- Uses optional chaining (`?.`)
- Provides fallback values (`|| ''`)
- Handles undefined/null gracefully

## Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 90+ | ✅ Supported |
| Firefox | 88+ | ✅ Supported |
| Safari | 14+ | ✅ Supported |
| Edge | 90+ | ✅ Supported |

## Related Documentation

- `SEARCH_FILTER_FEATURE.md` - Full implementation details
- `RBAC_IMPLEMENTATION.md` - Permission system
- `ORGANIZATION_SWITCHER.md` - Multi-org support

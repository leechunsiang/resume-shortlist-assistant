# Search/Filter Feature Implementation

## Overview
Added real-time search/filter functionality to both Job Listings and Candidates pages. Users can now search without pressing enter or reloading the page - results update instantly as they type.

## Features Implemented

### Job Listings Page
**Search Criteria:**
- Title
- Department
- Location
- Requirements

**Features:**
- Real-time search (updates as you type)
- Clear button (X) to reset search
- Search result count display
- Maintains existing status display
- Searches across all job fields simultaneously

### Candidates Page
**Search Criteria:**
- First Name
- Last Name
- Full Name (first + last)
- Email
- Phone Number
- Applied Position (from job applications)

**Features:**
- Real-time search (updates as you type)
- Clear button (X) to reset search
- Search result count display
- Works with existing status filters (all, shortlisted, pending, interviewed, rejected)
- Combines status filter + search filter together

## Implementation Details

### Job Listings (`src/app/job-listings/page.tsx`)

1. **Added State:**
```typescript
const [searchQuery, setSearchQuery] = useState('');
```

2. **Filter Logic:**
```typescript
const filteredJobs = jobs.filter(job => {
  if (!searchQuery.trim()) return true;
  
  const query = searchQuery.toLowerCase();
  const title = job.title?.toLowerCase() || '';
  const department = job.department?.toLowerCase() || '';
  const location = job.location?.toLowerCase() || '';
  const requirements = job.requirements?.toLowerCase() || '';
  
  return (
    title.includes(query) ||
    department.includes(query) ||
    location.includes(query) ||
    requirements.includes(query)
  );
});
```

3. **UI Components:**
   - Search input with magnifying glass icon
   - Clear button when search is active
   - Result count display
   - Updated empty state to show search-specific messages

### Candidates Page (`src/app/candidates/page.tsx`)

1. **Added State:**
```typescript
const [searchQuery, setSearchQuery] = useState('');
```

2. **Filter Logic:**
```typescript
const filteredCandidates = candidates
  .filter(c => filterStatus === 'all' || c.status === filterStatus)
  .filter(c => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const firstName = c.first_name?.toLowerCase() || '';
    const lastName = c.last_name?.toLowerCase() || '';
    const fullName = `${firstName} ${lastName}`;
    const email = c.email?.toLowerCase() || '';
    const phone = c.phone?.toLowerCase() || '';
    
    // Search through applied positions
    const appliedPositions = c.job_applications?.map(app => 
      app.job_listings?.title?.toLowerCase() || ''
    ).join(' ') || '';
    
    return (
      fullName.includes(query) ||
      firstName.includes(query) ||
      lastName.includes(query) ||
      email.includes(query) ||
      phone.includes(query) ||
      appliedPositions.includes(query)
    );
  });
```

3. **UI Components:**
   - Search input with magnifying glass icon
   - Clear button when search is active
   - Result count display
   - Works seamlessly with status filter tabs
   - Updated empty state to show search-specific messages

## User Experience

### How to Use - Job Listings
1. Navigate to Job Listings page
2. Type in the search box at the top
3. Results filter instantly as you type
4. Search works across title, department, location, and requirements
5. Click the X button to clear the search

### How to Use - Candidates
1. Navigate to Candidates page
2. Optionally select a status filter tab (all, shortlisted, pending, etc.)
3. Type in the search box
4. Results filter instantly based on both status AND search query
5. Search works across name, email, phone, and applied positions
6. Click the X button to clear the search

## Technical Details

### Performance
- **Case-insensitive search** - searches work regardless of capitalization
- **Null-safe** - handles missing fields gracefully with `?.` and `|| ''`
- **Real-time updates** - uses React state with `onChange` event
- **No API calls** - filters existing data in memory for instant results
- **Multiple field search** - searches across all relevant fields simultaneously

### UI/UX Features
- Modern glass-morphism design matching existing theme
- Focus ring on input (emerald color)
- Hover effects on clear button
- Result count feedback
- Context-aware empty states
- Smooth transitions and animations

## Files Modified

1. `src/app/job-listings/page.tsx`
   - Added searchQuery state
   - Added filteredJobs computed value
   - Added search input UI
   - Updated rendering to use filteredJobs
   - Enhanced empty state messages

2. `src/app/candidates/page.tsx`
   - Added searchQuery state
   - Updated filteredCandidates to include search logic
   - Added search input UI
   - Enhanced empty state messages
   - Maintains compatibility with status filters

## Future Enhancements (Optional)

Potential improvements for future iterations:
- [ ] Advanced filters (date ranges, salary ranges)
- [ ] Multi-select dropdown filters
- [ ] Save search preferences
- [ ] Search history
- [ ] Keyboard shortcuts (Ctrl+F to focus search)
- [ ] Highlight matching text in results
- [ ] Export filtered results only
- [ ] URL query parameters for shareable searches

## Testing Checklist

- [x] Search works in Job Listings page
- [x] Search works in Candidates page
- [x] Clear button removes search query
- [x] Result count updates correctly
- [x] Empty states show appropriate messages
- [x] Search is case-insensitive
- [x] Status filters + search work together on Candidates page
- [x] Search works across all specified fields
- [x] No console errors
- [x] Responsive on mobile devices

## Browser Compatibility

Works on all modern browsers:
- Chrome/Edge (Chromium)
- Firefox
- Safari
- Mobile browsers

## Accessibility

- Input is keyboard accessible
- Clear button is keyboard accessible
- Proper placeholder text
- Search icon provides visual context
- Result count provides feedback

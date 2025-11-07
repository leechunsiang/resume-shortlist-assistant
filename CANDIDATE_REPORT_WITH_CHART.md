# Candidate Report with Pie Chart Feature

## Overview
This feature allows users to download a comprehensive PDF report of candidates with visual statistics, including a pie chart showing the distribution of shortlisted vs rejected candidates.

## Features

### 📊 Visual Pie Chart
- **Pie chart visualization** showing the percentage breakdown of:
  - Shortlisted candidates (Green)
  - Rejected candidates (Red)
- Generated using HTML5 Canvas API
- Embedded directly into the PDF report

### 📈 Summary Statistics
The report includes:
- **Total candidates** count
- **Shortlisted** count and percentage (with green indicator)
- **Rejected** count and percentage (with red indicator)
- **Overridden** count and percentage (with blue indicator)

### 📋 Detailed Candidate List
- Full table with all candidates including:
  - Name
  - Email
  - Current Position
  - Years of Experience
  - Status (color-coded)
- Status values are color-coded in the table:
  - Shortlisted: Green text
  - Rejected: Red text
  - Overridden: Blue text

## How to Use

### From the Candidates Page

1. Navigate to the **Candidates** page
2. Click the **Download** button (with download icon)
3. Select **"Report with Chart"** from the dropdown menu
4. The PDF will be automatically generated and downloaded

### Export Options Available
- **Report with Chart** (NEW) - Comprehensive report with pie chart
- **CSV** - Raw data export
- **PDF** - Simple table export

## File Output

### Filename Format
```
candidates-report-YYYY-MM-DD.pdf
```
Example: `candidates-report-2025-11-07.pdf`

### Report Structure

**Page 1:**
1. **Header**
   - Title: "Candidates Summary Report"
   - Generated date and time
   - Total candidates count

2. **Summary Statistics**
   - Visual color indicators for each status
   - Count and percentage for each category

3. **Pie Chart**
   - Visual representation of shortlisted vs rejected
   - Percentage labels on each slice
   - Green for shortlisted, red for rejected

4. **Detailed Candidate Table**
   - All candidates with key information
   - Color-coded status column

## Technical Implementation

### Dependencies
```json
{
  "jspdf": "^3.0.3",
  "jspdf-autotable": "^5.0.2"
}
```

### Key Functions

#### `exportCandidatesReportWithChart(candidates: Candidate[])`
Main function that generates the complete report with pie chart.

**Location:** `src/lib/export.ts`

**Parameters:**
- `candidates` - Array of candidate objects

**Returns:** `void` (triggers download)

#### `generatePieChartBase64(shortlisted: number, rejected: number)`
Generates a pie chart as a base64-encoded PNG image.

**Parameters:**
- `shortlisted` - Number of shortlisted candidates
- `rejected` - Number of rejected candidates
- `width` - Canvas width (default: 300px)
- `height` - Canvas height (default: 300px)

**Returns:** Base64-encoded PNG image string

### Canvas-based Chart Generation

The pie chart is generated using the HTML5 Canvas API:

```typescript
// Create canvas element
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

// Calculate angles
const shortlistedAngle = (shortlisted / total) * 2 * Math.PI;

// Draw slices with colors
ctx.fillStyle = '#10b981'; // Green for shortlisted
ctx.fillStyle = '#ef4444'; // Red for rejected

// Add percentage labels
ctx.fillText(`${percentage.toFixed(1)}%`, x, y);

// Convert to base64
const imageData = canvas.toDataURL('image/png');
```

## Color Scheme

### Pie Chart Colors
- **Shortlisted:** `#10b981` (Green) - Emerald 500
- **Rejected:** `#ef4444` (Red) - Red 500

### Status Indicators
- **Shortlisted:** Green box + text
- **Rejected:** Red box + text
- **Overridden:** Blue box + text (`#3b82f6`)

### PDF Theme
- **Primary color:** Indigo (`#4f46e5`) - Used for table headers
- **Text color:** Black for headings, gray for metadata

## RBAC Permissions

### Required Permission
Users need the `candidates.export` permission to access the download feature.

### Role Requirements
- ✅ **Owner** - Full access
- ✅ **Admin** - Full access
- ✅ **Member** - Full access
- ❌ **Viewer** - No access (shows "View Only" badge)

## Browser Compatibility

### Canvas Support
The feature requires HTML5 Canvas API support:
- ✅ Chrome/Edge 4+
- ✅ Firefox 2+
- ✅ Safari 3.1+
- ✅ Opera 9+

### PDF Generation
Works in all modern browsers with jsPDF support.

## Error Handling

### No Candidates
- The download button is disabled when no candidates exist
- Prevents empty report generation

### Chart Generation Failure
- Falls back gracefully if canvas generation fails
- Report continues without the chart
- Error is logged to console

### Zero Division Protection
- Handles cases where total candidates = 0
- Skips chart generation if no data available

## Example Output

### Report Header
```
Candidates Summary Report
Generated on: 11/7/2025, 10:30:00 AM
Total Candidates: 25
```

### Summary Statistics
```
🟢 Shortlisted: 15 (60.0%)
🔴 Rejected: 8 (32.0%)
🔵 Overridden: 2 (8.0%)
```

### Pie Chart
```
        [Visual Pie Chart]
    60.0%     |    32.0%
  (Green)     |    (Red)
```

### Candidate Table
| Name | Email | Position | Experience | Status |
|------|-------|----------|------------|--------|
| John Doe | john@example.com | Developer | 5 | **Shortlisted** |
| Jane Smith | jane@example.com | Designer | 3 | **Rejected** |

## Future Enhancements

### Potential Additions
- [ ] Bar chart comparing candidates by department
- [ ] Timeline of applications over time
- [ ] Match score distribution histogram
- [ ] Export to Excel with charts
- [ ] Email report directly to stakeholders
- [ ] Scheduled report generation
- [ ] Custom date range filtering
- [ ] Include AI analysis summaries
- [ ] Multi-page reports with detailed profiles

## Troubleshooting

### Chart Not Showing
**Issue:** Pie chart missing from PDF

**Solutions:**
- Check browser console for errors
- Ensure Canvas API is supported
- Verify candidates have valid status values
- Check if total candidates > 0

### Download Not Working
**Issue:** PDF not downloading

**Solutions:**
- Check RBAC permissions
- Verify user role (not Viewer)
- Check browser popup blockers
- Ensure candidates data is loaded

### Incorrect Percentages
**Issue:** Percentages don't add up to 100%

**Solutions:**
- Check for candidates with invalid status
- Verify status values match expected ('shortlisted', 'rejected')
- Check for null/undefined status values

## Related Files

### Implementation
- `src/lib/export.ts` - Export functions
- `src/app/candidates/page.tsx` - UI integration

### Documentation
- `RBAC_IMPLEMENTATION.md` - Permission system
- `SEARCH_FILTER_FEATURE.md` - Search functionality
- `CANDIDATE_STATUS_UPDATE.md` - Status management

## Support

For issues or questions:
1. Check the browser console for errors
2. Verify RBAC permissions are configured
3. Ensure candidates have valid status values
4. Review jsPDF documentation for PDF issues

## Changelog

### Version 1.0.0 (2025-11-07)
- ✅ Initial implementation
- ✅ Pie chart generation with Canvas API
- ✅ Summary statistics with color indicators
- ✅ Detailed candidate table with color coding
- ✅ RBAC permission integration
- ✅ Export menu with three options

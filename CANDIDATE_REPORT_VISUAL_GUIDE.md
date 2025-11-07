# Candidate Report - Visual Example

## 📄 Report Layout Preview

### Page 1 - Complete Report

```
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║  Candidates Summary Report                                   ║
║  Generated on: 11/7/2025, 10:30:00 AM                       ║
║  Total Candidates: 25                                        ║
║                                                              ║
║  Summary Statistics                                          ║
║  ─────────────────                                          ║
║  🟢 Shortlisted: 15 (60.0%)                                 ║
║  🔴 Rejected: 8 (32.0%)                                     ║
║  🔵 Overridden: 2 (8.0%)                                    ║
║                                                              ║
║  Status Distribution                                         ║
║  ──────────────────                                         ║
║          ╭─────────────────╮                                ║
║          │       60.0%     │                                ║
║          │   ●●●●●●●●●    │                                ║
║          │ ●●●●     ●●●●  │                                ║
║          │●●           ●●● │                                ║
║          │●   SHORT-    ●  │                                ║
║          │●   LISTED    ●  │                                ║
║          │●●  (Green)  ●●  │                                ║
║          │ ●●●       ●●●   │                                ║
║          │   ●●●●●●●●●    │                                ║
║          │   32.0% REJ    │                                ║
║          │   (Red)        │                                ║
║          ╰─────────────────╯                                ║
║                                                              ║
║  Detailed Candidate List                                     ║
║  ──────────────────────                                     ║
║  ┌──────────────┬───────────────────┬────────────┬─────┐   ║
║  │ Name         │ Email             │ Position   │ St. │   ║
║  ├──────────────┼───────────────────┼────────────┼─────┤   ║
║  │ John Doe     │ john@example.com  │ Developer  │ ✓   │   ║
║  │ Jane Smith   │ jane@example.com  │ Designer   │ ✗   │   ║
║  │ Bob Johnson  │ bob@example.com   │ Manager    │ ✓   │   ║
║  └──────────────┴───────────────────┴────────────┴─────┘   ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

## 🎨 Color Coding

### Header Section
- **Title:** Black, 22pt, Bold
- **Date/Meta:** Gray, 10pt

### Summary Statistics
- **Shortlisted:** Green box (`#10b981`) + percentage
- **Rejected:** Red box (`#ef4444`) + percentage  
- **Overridden:** Blue box (`#3b82f6`) + percentage

### Pie Chart
- **Chart Size:** 90x90 pixels
- **Shortlisted Slice:** Green (`#10b981`)
- **Rejected Slice:** Red (`#ef4444`)
- **Labels:** White text with percentages
- **Position:** Centered

### Candidate Table
- **Header Row:** Indigo background (`#4f46e5`)
- **Status Column:**
  - ✓ Shortlisted: Bold green text
  - ✗ Rejected: Bold red text
  - ↻ Overridden: Bold blue text
- **Font:** 9pt for table content

## 📊 Example Statistics

### Scenario 1: Balanced Distribution
```
Total: 50 candidates
Shortlisted: 25 (50%)
Rejected: 20 (40%)
Overridden: 5 (10%)

Pie Chart shows:
├─ 50% Green (Shortlisted)
└─ 40% Red (Rejected)
```

### Scenario 2: High Acceptance Rate
```
Total: 100 candidates
Shortlisted: 80 (80%)
Rejected: 15 (15%)
Overridden: 5 (5%)

Pie Chart shows:
├─ 80% Green (Shortlisted) - Large slice
└─ 15% Red (Rejected) - Small slice
```

### Scenario 3: High Rejection Rate
```
Total: 30 candidates
Shortlisted: 5 (16.7%)
Rejected: 22 (73.3%)
Overridden: 3 (10%)

Pie Chart shows:
├─ 16.7% Green (Shortlisted) - Small slice
└─ 73.3% Red (Rejected) - Large slice
```

## 📐 Layout Specifications

### Margins
- **Left/Right:** 14mm
- **Top:** 20mm
- **Bottom:** 20mm

### Spacing
- **Section Gap:** 10-15mm
- **Line Height:** 6mm
- **Chart Position:** Centered horizontally

### Font Sizes
- **Main Title:** 22pt
- **Section Headers:** 16pt
- **Body Text:** 12pt
- **Table Content:** 9pt
- **Metadata:** 10pt

## 🎯 Chart Specifications

### Pie Chart Details
```
Canvas Size: 300x300 pixels
Display Size: 90x90 pixels in PDF
Center Point: (150, 150)
Radius: 130 pixels
Label Font: 14pt Arial Bold
Label Color: White (#ffffff)
```

### Slice Calculation
```typescript
// Shortlisted angle
shortlistedAngle = (shortlisted / total) × 2π

// Start angle: -π/2 (12 o'clock position)
// End angle: -π/2 + shortlistedAngle

// Rejected fills remaining space
```

## 📱 Responsive Behavior

### Desktop View
- Full-width chart (90px)
- Comfortable table spacing
- All columns visible

### Mobile PDF Viewers
- Maintains aspect ratio
- Pinch-to-zoom supported
- Readable on small screens

## 🔢 Data Accuracy

### Percentage Calculation
```
Percentage = (Count / Total) × 100
Rounded to 1 decimal place

Examples:
- 15/25 = 60.0%
- 8/25 = 32.0%
- 2/25 = 8.0%
```

### Total Verification
```
Sum of all statuses = Total candidates
Shortlisted + Rejected + Overridden = Total

Example:
60.0% + 32.0% + 8.0% = 100.0% ✓
```

## 🎭 Edge Cases

### No Candidates
- Button disabled
- Report not generated

### All Same Status
```
Total: 10, All Shortlisted
Chart: 100% green circle
Stats: 10 (100%), 0 (0%), 0 (0%)
```

### Single Candidate
```
Total: 1, Status: Shortlisted
Chart: 100% green circle
Stats: 1 (100%), 0 (0%), 0 (0%)
```

## 📥 Download Behavior

### File Naming
```
Pattern: candidates-report-YYYY-MM-DD.pdf
Example: candidates-report-2025-11-07.pdf
```

### Browser Actions
- Automatic download trigger
- Save dialog appears
- Default location: Downloads folder

## ✨ Visual Polish

### Design Elements
- Clean, professional layout
- Consistent color scheme
- Clear hierarchy
- Adequate white space
- Easy-to-read typography
- Color-coded information

### Accessibility
- High contrast text
- Clear labels
- Readable font sizes
- Color + text indicators
- Professional appearance

## 🎨 Brand Colors

```
Primary: Indigo (#4f46e5)
Success: Green (#10b981)
Danger: Red (#ef4444)
Info: Blue (#3b82f6)
Neutral: Gray (#6b7280)
```

## 📖 Usage Context

### When to Use
✅ Monthly reports
✅ Team presentations
✅ Stakeholder updates
✅ Performance reviews
✅ Audit documentation

### When NOT to Use
❌ Real-time monitoring (use dashboard)
❌ Detailed candidate analysis (use CSV)
❌ Interactive filtering (use web UI)

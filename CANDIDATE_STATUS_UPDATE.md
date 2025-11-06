# Candidate Status Update Feature

## Overview
Candidates can now have their status updated directly from the candidate detail panel, including those with "pending" status.

## Feature Details

### Status Dropdown Selector
When you click on a candidate to view their details, you'll see a status dropdown selector in the side panel header, right below their name and position.

### Available Status Options
- **Pending** - Initial status for new candidates
- **Shortlisted** - Candidate has been shortlisted for further review
- **Interviewed** - Candidate has been interviewed
- **Hired** - Candidate has been hired
- **Rejected** - Candidate application has been rejected

### How It Works

1. **View Candidate Details**
   - Click on any candidate from the candidates list
   - Side panel opens showing full candidate details

2. **Change Status**
   - Locate the status dropdown under the candidate's name
   - Click the dropdown to see all available status options
   - Select the new status
   - Status is automatically saved to the database
   - UI updates immediately to reflect the change

3. **Visual Feedback**
   - Each status has a unique color scheme:
     - Pending: Yellow
     - Shortlisted: Green/Emerald
     - Interviewed: Blue
     - Hired: Green
     - Rejected: Red
   - The dropdown styling matches the current status color

### Permissions

#### Role-Based Access Control
- **Owner, Admin, Member**: Can update candidate status
- **Viewer**: Cannot update status (dropdown is disabled and grayed out)

The feature respects the existing RBAC system, ensuring only authorized users can make changes.

### Technical Implementation

- Updates are made via the `candidatesApi.update()` function
- Changes are immediately reflected in both:
  - The candidate detail panel
  - The main candidates list
- Error handling with alert notification if update fails
- No page reload required - updates happen in real-time

### User Experience

- **Instant Updates**: No need to close and reopen the panel
- **Clear Visual Indicators**: Color-coded status makes it easy to see current state
- **Keyboard Accessible**: Dropdown can be navigated with keyboard
- **Responsive**: Works on all screen sizes

## Benefits

1. **Workflow Management**: Easily track candidates through your hiring pipeline
2. **No Restrictions**: Can update any candidate regardless of current status
3. **Quick Actions**: Change status without navigating to a separate edit page
4. **Audit Trail**: All status changes are tracked with updated_at timestamps
5. **Permission Control**: Viewers can see status but cannot modify it

## Example Use Cases

1. **Initial Review**: Change candidate from "pending" to "shortlisted" after reviewing their resume
2. **Interview Scheduled**: Update to "interviewed" once interview is completed
3. **Hiring Decision**: Mark as "hired" or "rejected" based on final decision
4. **Reconsideration**: Move a "rejected" candidate back to "pending" if circumstances change

## Notes

- Status changes are instant and cannot be undone (though you can change status again)
- Consider adding notes to the candidate record to track reasons for status changes
- The candidate's score is not affected by status changes
- Status is independent for each job application (tracked separately in job_applications table)

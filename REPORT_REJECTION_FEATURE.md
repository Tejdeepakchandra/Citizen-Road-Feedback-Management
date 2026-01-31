# Report Rejection Feature Implementation

## Overview
This feature adds the ability for admins to reject reports directly from the issue management page. When a report is rejected, the user receives both an in-app notification and an email with the rejection reason.

## Changes Made

### 1. Database Model Updates

#### File: `backend/src/models/Report.js`
**New Fields Added:**
- `reportRejected` (Boolean): Flag indicating if report is rejected by admin
- `reportRejectionReason` (String): Admin's reason for rejection
- `reportRejectedBy` (ObjectId): Reference to the admin who rejected the report
- `reportRejectedAt` (Date): Timestamp of rejection

These fields work alongside existing completion rejection fields (`rejectionReason`, `rejectedBy`, `rejectedAt`), maintaining backward compatibility.

**Note:** The model already had `rejected` status in the enum, so no changes were needed there.

---

### 2. API Controller Updates

#### File: `backend/src/controllers/report.controller.js`
**New Function: `exports.rejectReport`**

**Endpoint:** `PUT /api/reports/:id/reject-report`

**Functionality:**
- Validates rejection reason is provided
- Checks report exists and isn't already rejected
- Updates report with rejection status and details
- Sets report status to `'rejected'` with progress to 0
- Adds rejection update to progress history
- Sends rejection email to user
- Creates in-app notification for user
- Emits real-time notification via socket
- Returns updated report data

**Error Handling:**
- 404: Report not found
- 400: Rejection reason missing or report already rejected
- 400: Cannot reject closed reports

---

### 3. API Routes

#### File: `backend/src/routes/report.routes.js`
**New Route Added:**
```javascript
router.put('/:id/reject-report', authorize('admin'), rejectReport);
```

**Key Features:**
- Admin-only endpoint (requires `admin` role)
- Protected by `authorize('admin')` middleware
- Placed in admin section of routes

---

### 4. Email Template

#### File: `backend/public/email-templates/report-rejected.html`
**New Email Template Created**

**Features:**
- Professional design with red accent color (warning)
- Shows report details:
  - Report ID
  - Title
  - Category
  - Location
  - Rejection date
  - Rejected by
- Displays rejection reason prominently
- Provides clear next steps for user
- Call-to-action button to view report details
- Support contact information

---

### 5. Notification Service

#### File: `backend/src/services/notificationEmitter.service.js`
**New Function: `exports.notifyReportRejected`**

**Features:**
- Creates real-time notification for user
- Includes rejection details in metadata
- Sets priority to `'high'`
- Tags: `['rejection', 'report', 'user-action-required']`
- Handles socket emission for live updates

---

### 6. Notification Model

#### File: `backend/src/models/Notification.js`
**Updated Enum:**
- Added `'report_rejected'` to notification type enum

---

## API Usage

### Request
```bash
PUT /api/reports/:reportId/reject-report
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "rejectionReason": "The location coordinates are incorrect and cannot be verified. Please resubmit with accurate GPS coordinates."
}
```

### Response (Success - 200)
```json
{
  "success": true,
  "message": "Report rejected successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Pothole on Main Street",
    "status": "rejected",
    "reportRejected": true,
    "reportRejectionReason": "The location coordinates are incorrect and cannot be verified. Please resubmit with accurate GPS coordinates.",
    "reportRejectedBy": "507f1f77bcf86cd799439012",
    "reportRejectedAt": "2026-01-31T10:30:00.000Z",
    "user": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "John Doe",
      "email": "john@example.com"
    },
    // ... other fields
  }
}
```

### Response (Error - 400)
```json
{
  "success": false,
  "message": "Error message",
  "error": "Rejection reason is required"
}
```

---

## User Experience Flow

1. **User submits report** → Report status: `pending`
2. **Admin reviews report** → Available in issue management
3. **Admin rejects report** → API call with reason
4. **User receives:**
   - ✉️ Email notification with rejection reason
   - 🔔 In-app notification (real-time via socket)
   - Report status changes to `rejected`
5. **User can:**
   - View rejection reason in report details
   - Submit a new report with corrections

---

## Files Modified

1. ✅ `backend/src/models/Report.js` - Added rejection fields
2. ✅ `backend/src/controllers/report.controller.js` - Added rejectReport function
3. ✅ `backend/src/routes/report.routes.js` - Added reject route
4. ✅ `backend/src/services/notificationEmitter.service.js` - Added notification function
5. ✅ `backend/src/models/Notification.js` - Added report_rejected type
6. ✅ `backend/public/email-templates/report-rejected.html` - New email template

---

## Testing Checklist

- [ ] POST request to create test report
- [ ] GET request to verify report exists
- [ ] PUT request to `/api/reports/:id/reject-report` with rejection reason
- [ ] Verify email is sent to user
- [ ] Verify in-app notification appears in real-time
- [ ] Verify report status changed to `rejected`
- [ ] Verify rejection reason is displayed to user
- [ ] Test with missing rejection reason (should fail)
- [ ] Test with non-existent report ID (should fail)
- [ ] Test rejection on already-rejected report (should fail)
- [ ] Verify only admins can reject reports

---

## Integration Notes

### Frontend Implementation Needed:
1. Add "Reject" button in admin issue management page (near "Assign" button)
2. Create rejection reason modal/form
3. Display rejection status in user's report list
4. Show rejection reason in report detail view
5. Add notification UI for rejection alerts

### Backward Compatibility:
- ✅ Existing rejection fields for task completion review are preserved
- ✅ New fields are separate and don't conflict
- ✅ Email templates don't override existing templates
- ✅ Routes don't override existing endpoints

---

## Error Prevention

The implementation includes:
- ✅ Validation of rejection reason (required)
- ✅ Check for duplicate rejections
- ✅ Prevents rejection of closed reports
- ✅ Proper error responses with HTTP status codes
- ✅ Email error handling (doesn't fail API if email fails)
- ✅ Notification error handling (doesn't fail API if notification fails)

---

## Future Enhancements (Optional)

- Add rejection history/audit trail
- Allow rejection appeal process
- Auto-categorize rejection reasons
- Track rejection metrics by category
- Add bulk rejection capability
- Add rejection templates for common reasons
- Automatic re-submission reminder after X days

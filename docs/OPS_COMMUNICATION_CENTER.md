# Ops Communication Center - Complete Implementation

## Overview
Comprehensive communication platform for Ops Admin to communicate with all schools through multiple channels: Email, SMS, In-app Notifications, and Announcements.

## Features Implemented

### 1. Bulk Email to Schools ✅
Send emails to multiple schools based on filters.

**Endpoint:** `POST /api/platform/communication/bulk-email`

**Request Body:**
```json
{
  "subject": "Important Update",
  "message": "Dear schools, we have an important update...",
  "targetTiers": ["STARTER", "PROFESSIONAL"],
  "targetStatuses": ["ACTIVE"],
  "tenantIds": ["optional-specific-ids"]
}
```

**Features:**
- Filter by tier (FREE, STARTER, PROFESSIONAL, ENTERPRISE)
- Filter by status (ACTIVE, SUSPENDED, TRIAL, etc.)
- Target specific schools by ID
- Uses professional email templates
- Tracks success/failure per school
- Returns detailed results

### 2. Bulk SMS to Schools ✅
Send SMS messages to multiple schools.

**Endpoint:** `POST /api/platform/communication/bulk-sms`

**Request Body:**
```json
{
  "message": "Your SMS message here (160 characters max)",
  "targetTiers": ["PROFESSIONAL", "ENTERPRISE"],
  "targetStatuses": ["ACTIVE"],
  "tenantIds": []
}
```

**Features:**
- Only sends to schools with phone numbers
- Same filtering as email
- SMS character limit handling
- Delivery tracking

### 3. Bulk In-App Notifications ✅
Send in-app notifications to school admins.

**Endpoint:** `POST /api/platform/communication/bulk-notification`

**Request Body:**
```json
{
  "title": "System Update",
  "message": "We've added new features...",
  "type": "INFO",
  "targetTiers": ["ALL"],
  "targetStatuses": ["ACTIVE"]
}
```

**Notification Types:**
- INFO - General information
- WARNING - Important warnings
- SUCCESS - Success messages
- ERROR - Error notifications

**Features:**
- Sends to all SUPER_ADMIN users in each school
- Appears in school dashboard
- Real-time notifications
- Read/unread tracking

### 4. Targeted Messaging ✅
Send messages to specific schools via multiple channels.

**Endpoint:** `POST /api/platform/communication/targeted-message`

**Request Body:**
```json
{
  "tenantIds": ["school-1-id", "school-2-id"],
  "subject": "Personal Message",
  "message": "Your personalized message...",
  "channels": ["email", "sms", "notification"]
}
```

**Features:**
- Multi-channel delivery
- Select specific schools
- Personalized messages
- Delivery confirmation per channel

### 5. Schedule Announcements ✅
Schedule announcements for future delivery.

**Endpoint:** `POST /api/platform/communication/schedule-announcement`

**Request Body:**
```json
{
  "title": "Upcoming Maintenance",
  "message": "System will be down for maintenance...",
  "type": "WARNING",
  "scheduledFor": "2026-01-25T10:00:00Z",
  "targetTiers": ["ALL"],
  "targetStatuses": ["ACTIVE"]
}
```

**Features:**
- Schedule for future date/time
- Auto-activation at scheduled time
- Target filtering
- Cancellation support

### 6. Communication History ✅
View all past communications.

**Endpoint:** `GET /api/platform/communication/history`

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `type` - Filter by type (announcement, email, sms, notification)

**Response:**
```json
{
  "history": [
    {
      "id": "comm-id",
      "type": "announcement",
      "title": "System Update",
      "message": "...",
      "status": "active",
      "createdAt": "2026-01-19T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

### 7. Communication Statistics ✅
Get communication metrics and analytics.

**Endpoint:** `GET /api/platform/communication/stats`

**Query Parameters:**
- `days` - Number of days to analyze (default: 30)

**Response:**
```json
{
  "announcements": {
    "total": 25,
    "active": 5,
    "recent": 10
  },
  "tenants": {
    "total": 150,
    "active": 120,
    "byTier": {
      "FREE": 50,
      "STARTER": 60,
      "PROFESSIONAL": 30,
      "ENTERPRISE": 10
    },
    "byStatus": {
      "ACTIVE": 120,
      "TRIAL": 20,
      "SUSPENDED": 10
    }
  }
}
```

### 8. Message Templates ✅
Pre-defined message templates for common scenarios.

**Endpoint:** `GET /api/platform/communication/templates`

**Templates Available:**
1. **Welcome Message** - Onboarding new schools
2. **Payment Reminder** - Billing reminders
3. **Feature Update** - New feature announcements
4. **Maintenance Notice** - System maintenance alerts
5. **Support Follow-up** - Customer support

**Template Variables:**
- `{{platformName}}` - Platform name
- `{{schoolName}}` - School name
- `{{date}}` - Current date
- `{{supportEmail}}` - Support email
- `{{supportPhone}}` - Support phone

## API Endpoints Summary

### Communication Center
```
POST   /api/platform/communication/bulk-email
POST   /api/platform/communication/bulk-sms
POST   /api/platform/communication/bulk-notification
POST   /api/platform/communication/targeted-message
POST   /api/platform/communication/schedule-announcement
GET    /api/platform/communication/history
GET    /api/platform/communication/stats
GET    /api/platform/communication/templates
```

### Announcements (Existing)
```
GET    /api/platform/announcements
POST   /api/platform/announcements
DELETE /api/platform/announcements/:id
PATCH  /api/platform/announcements/:id/status
```

## Usage Examples

### Example 1: Send Welcome Email to New Schools
```bash
POST /api/platform/communication/bulk-email
{
  "subject": "Welcome to Sync School Management",
  "message": "Dear {{schoolName}}, welcome to our platform! We're excited to have you.",
  "targetStatuses": ["TRIAL"],
  "targetTiers": ["FREE"]
}
```

### Example 2: Send Payment Reminder to Professional Tier
```bash
POST /api/platform/communication/targeted-message
{
  "tenantIds": ["school-1", "school-2"],
  "subject": "Payment Due Reminder",
  "message": "Your subscription payment is due in 3 days.",
  "channels": ["email", "notification"]
}
```

### Example 3: Announce New Feature to All Active Schools
```bash
POST /api/platform/communication/bulk-notification
{
  "title": "New Feature: Online Assessments",
  "message": "We've added online assessments! Check it out in your dashboard.",
  "type": "SUCCESS",
  "targetStatuses": ["ACTIVE"]
}
```

### Example 4: Schedule Maintenance Notice
```bash
POST /api/platform/communication/schedule-announcement
{
  "title": "Scheduled Maintenance",
  "message": "System will be down for maintenance on Jan 25, 2026 from 2-4 AM.",
  "type": "WARNING",
  "scheduledFor": "2026-01-24T18:00:00Z"
}
```

### Example 5: Send SMS to Enterprise Clients
```bash
POST /api/platform/communication/bulk-sms
{
  "message": "Premium support now available 24/7. Call us anytime!",
  "targetTiers": ["ENTERPRISE"],
  "targetStatuses": ["ACTIVE"]
}
```

## Filtering Options

### By Tier
- `FREE` - Free tier schools
- `STARTER` - Starter plan schools
- `PROFESSIONAL` - Professional plan schools
- `ENTERPRISE` - Enterprise plan schools

### By Status
- `ACTIVE` - Active subscriptions
- `TRIAL` - Trial period
- `SUSPENDED` - Suspended accounts
- `CANCELLED` - Cancelled subscriptions
- `EXPIRED` - Expired subscriptions

### By Specific Schools
- Provide array of `tenantIds` to target specific schools

## Best Practices

### Email Communication
1. **Use Templates** - Leverage pre-defined templates for consistency
2. **Personalize** - Use variables like {{schoolName}} for personalization
3. **Subject Lines** - Keep subject lines clear and concise
4. **Timing** - Send during business hours (9 AM - 5 PM)
5. **Frequency** - Don't spam - max 2-3 emails per week

### SMS Communication
6. **Character Limit** - Keep messages under 160 characters
7. **Clear CTA** - Include clear call-to-action
8. **Opt-out** - Respect opt-out requests
9. **Urgent Only** - Use SMS for urgent/time-sensitive messages
10. **Phone Numbers** - Verify phone numbers before sending

### In-App Notifications
11. **Categorize** - Use appropriate types (INFO, WARNING, SUCCESS, ERROR)
12. **Actionable** - Include links or actions when relevant
13. **Clear** - Keep messages short and clear
14. **Priority** - Use WARNING/ERROR sparingly

### Announcements
15. **Expiry** - Set expiry dates for time-sensitive announcements
16. **Status** - Deactivate outdated announcements
17. **Visibility** - Active announcements show on all school dashboards
18. **Updates** - Update existing announcements rather than creating duplicates

## Security & Permissions

### Required Roles
- **PLATFORM_SUPERADMIN** - Full access to all communication features
- **PLATFORM_SUPPORT** - Can send bulk messages and view history
- **PLATFORM_SALES** - Read-only access to communication stats

### Rate Limiting
- Email: Max 100 emails per minute
- SMS: Max 50 SMS per minute
- Notifications: Max 500 notifications per minute

### Data Privacy
- All communications are logged for audit purposes
- Personal data is handled according to GDPR/data protection laws
- Schools can opt-out of non-essential communications

## Integration with Existing Features

### Email Service
- Uses existing `emailService.ts` for SMTP
- Uses `emailTemplateService.ts` for professional templates
- Supports Azure Communication Services

### SMS Service
- Integrates with platform SMS configuration
- Uses Africa's Talking or Twilio
- Respects SMS balance and limits

### Notification Service
- Uses existing `notificationService.ts`
- Creates in-app notifications
- Real-time updates via WebSocket (if configured)

### Audit Logging
- All communications are logged
- Tracks who sent what to whom
- Includes success/failure status

## Monitoring & Analytics

### Metrics Tracked
- Total communications sent
- Success/failure rates
- Open rates (email)
- Click rates (email)
- Delivery rates (SMS)
- Read rates (notifications)

### Reports Available
- Daily communication summary
- Weekly engagement report
- Monthly analytics dashboard
- School-specific communication history

## Troubleshooting

### Email Not Sending
1. Check SMTP configuration in platform settings
2. Verify school email addresses are valid
3. Check email service logs
4. Verify Azure email configuration (if using Azure)

### SMS Not Delivering
1. Check SMS provider configuration
2. Verify phone numbers are in correct format
3. Check SMS balance
4. Verify SMS provider API credentials

### Notifications Not Appearing
1. Check school has SUPER_ADMIN users
2. Verify notification service is running
3. Check browser notifications are enabled
4. Verify WebSocket connection (if using real-time)

### Bulk Operations Failing
1. Check target filters are correct
2. Verify schools match criteria
3. Check rate limits
4. Review error logs for specific failures

## Future Enhancements

### Planned Features
- Email campaign analytics
- A/B testing for messages
- Automated drip campaigns
- SMS delivery reports
- Push notifications (mobile app)
- WhatsApp integration
- Slack integration
- Message scheduling queue
- Template builder UI
- Recipient segmentation
- Engagement scoring
- Unsubscribe management

---

**Implementation Status**: ✅ COMPLETE
**Date**: January 19, 2026
**API Endpoints**: 8 new endpoints
**Functions Added**: 8 controller functions
**Integration**: Uses existing email, SMS, and notification services

# Enhanced CRM Features - Complete Implementation

## Overview
Advanced CRM capabilities including email integration, document management, automated reminders, lead scoring, quotes/proposals, bulk operations, and advanced reporting.

## Features Implemented

### 1. Email Integration ✅
Send emails directly from CRM with tracking and templates.

**Features:**
- Send emails to leads from CRM interface
- Email templates with variable replacement
- Email tracking (sent, opened, clicked)
- Email history per lead
- CC/BCC support
- HTML email support
- Automatic activity logging

**API Endpoints:**
```
POST   /api/platform/crm/enhanced/emails/send
GET    /api/platform/crm/enhanced/emails/lead/:leadId
POST   /api/platform/crm/enhanced/email-templates
GET    /api/platform/crm/enhanced/email-templates
```

**Email Template Variables:**
- `{{schoolName}}` - Lead's school name
- `{{contactName}}` - Contact person name
- `{{contactEmail}}` - Contact email
- More variables can be added

### 2. Document Management ✅
Upload and manage proposals, contracts, and other documents.

**Features:**
- Upload documents to leads/deals
- Document categorization (PROPOSAL, CONTRACT, PRESENTATION, BROCHURE, OTHER)
- Version control support
- View tracking
- Document search and filtering
- Automatic activity logging

**API Endpoints:**
```
POST   /api/platform/crm/enhanced/documents
GET    /api/platform/crm/enhanced/documents?leadId=xxx&dealId=xxx
DELETE /api/platform/crm/enhanced/documents/:id
```

**Supported Document Types:**
- PDF, DOCX, XLSX, PPTX
- Images (PNG, JPG)
- Any file type

### 3. Follow-up Reminders ✅
Automated and manual follow-up reminders.

**Features:**
- Create reminders for leads
- Reminder types (FOLLOW_UP, CALL, EMAIL, MEETING, PROPOSAL_DUE)
- Priority levels (LOW, MEDIUM, HIGH)
- Snooze functionality
- Auto-generated reminders
- Email notifications
- "My Reminders" dashboard

**API Endpoints:**
```
POST   /api/platform/crm/enhanced/reminders
GET    /api/platform/crm/enhanced/reminders/my
PUT    /api/platform/crm/enhanced/reminders/:id/complete
PUT    /api/platform/crm/enhanced/reminders/:id/snooze
```

**Reminder Statuses:**
- PENDING - Not yet actioned
- COMPLETED - Done
- DISMISSED - Ignored
- SNOOZED - Postponed

### 4. Lead Scoring ✅
Automatic lead prioritization based on engagement and fit.

**Features:**
- Automatic score calculation
- Score components:
  - Engagement Score (0-40): Based on activities and email interactions
  - Fit Score (0-30): Based on school size, budget, decision maker
  - Intent Score (0-30): Based on actions taken
- Lead grades: A (Hot), B (Warm), C (Cold), D (Frozen)
- Manual score adjustments
- Score history tracking

**API Endpoints:**
```
POST   /api/platform/crm/enhanced/leads/:leadId/score/calculate
PUT    /api/platform/crm/enhanced/leads/:leadId/score
```

**Scoring Factors:**
- Email opens and clicks
- Website visits
- Demo requested
- Budget confirmed
- Decision maker identified
- Activity count

### 5. Quotes & Proposals ✅
Professional quote generation with PDF export.

**Features:**
- Create detailed quotes
- Line items with quantities and pricing
- Tax and discount support
- Quote versioning
- PDF generation
- Quote tracking (DRAFT, SENT, VIEWED, ACCEPTED, REJECTED, EXPIRED)
- Validity period
- Payment and delivery terms

**API Endpoints:**
```
POST   /api/platform/crm/enhanced/quotes
GET    /api/platform/crm/enhanced/quotes/lead/:leadId
GET    /api/platform/crm/enhanced/quotes/:quoteId/pdf
PUT    /api/platform/crm/enhanced/quotes/:quoteId/status
```

**Quote Number Format:** `QT-YYYY-NNNNNN`

### 6. Lead Import/Export ✅
Bulk operations for lead management.

**Features:**
- Import leads from CSV
- Export leads to CSV
- Bulk lead creation
- Error handling for failed imports
- Filter exports by status, source, assigned user

**API Endpoints:**
```
POST   /api/platform/crm/enhanced/leads/import
GET    /api/platform/crm/enhanced/leads/export
```

**CSV Format:**
```csv
School Name,Contact Name,Contact Email,Contact Phone,Status,Source,City,Province,Country,Estimated Students
```

### 7. Advanced Reporting ✅
Comprehensive CRM analytics and forecasting.

**Features:**
- Conversion funnel analysis
- Pipeline reports
- Sales forecasting
- Activity reports
- Performance metrics
- Custom date ranges

**Report Types:**
- CONVERSION - Lead conversion rates
- PIPELINE - Deal pipeline analysis
- FORECAST - Revenue forecasting
- ACTIVITY - Activity tracking
- PERFORMANCE - Sales rep performance

**API Endpoints:**
```
POST   /api/platform/crm/enhanced/reports/generate
GET    /api/platform/crm/enhanced/reports
```

**Metrics Tracked:**
- Total leads
- Converted leads
- Conversion rate
- Total revenue
- Average deal size
- Average sales cycle (days)
- Leads by status
- Leads by source
- Deals by stage

## Database Schema

### Email Templates
```sql
CREATE TABLE crm_email_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT DEFAULT 'GENERAL',
  variables TEXT[],
  isActive BOOLEAN DEFAULT true,
  createdById TEXT NOT NULL,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL
);
```

### Emails
```sql
CREATE TABLE crm_emails (
  id TEXT PRIMARY KEY,
  leadId TEXT,
  toEmail TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING',
  sentAt TIMESTAMP,
  openedAt TIMESTAMP,
  clickedAt TIMESTAMP,
  openCount INTEGER DEFAULT 0,
  clickCount INTEGER DEFAULT 0,
  sentById TEXT NOT NULL,
  createdAt TIMESTAMP DEFAULT NOW()
);
```

### Documents
```sql
CREATE TABLE crm_documents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  fileUrl TEXT NOT NULL,
  fileSize INTEGER NOT NULL,
  fileType TEXT NOT NULL,
  category TEXT DEFAULT 'OTHER',
  leadId TEXT,
  dealId TEXT,
  uploadedById TEXT NOT NULL,
  viewCount INTEGER DEFAULT 0,
  createdAt TIMESTAMP DEFAULT NOW()
);
```

### Follow-up Reminders
```sql
CREATE TABLE crm_follow_up_reminders (
  id TEXT PRIMARY KEY,
  leadId TEXT NOT NULL,
  title TEXT NOT NULL,
  reminderDate TIMESTAMP NOT NULL,
  reminderType TEXT DEFAULT 'FOLLOW_UP',
  priority TEXT DEFAULT 'MEDIUM',
  status TEXT DEFAULT 'PENDING',
  assignedToId TEXT NOT NULL,
  isAutoGenerated BOOLEAN DEFAULT false,
  createdAt TIMESTAMP DEFAULT NOW()
);
```

### Lead Scores
```sql
CREATE TABLE crm_lead_scores (
  id TEXT PRIMARY KEY,
  leadId TEXT UNIQUE NOT NULL,
  totalScore INTEGER DEFAULT 0,
  engagementScore INTEGER DEFAULT 0,
  fitScore INTEGER DEFAULT 0,
  intentScore INTEGER DEFAULT 0,
  grade TEXT DEFAULT 'C',
  lastCalculatedAt TIMESTAMP DEFAULT NOW()
);
```

### Quotes
```sql
CREATE TABLE crm_quotes (
  id TEXT PRIMARY KEY,
  quoteNumber TEXT UNIQUE NOT NULL,
  leadId TEXT NOT NULL,
  title TEXT NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  totalAmount DECIMAL(12,2) NOT NULL,
  status TEXT DEFAULT 'DRAFT',
  validUntil TIMESTAMP NOT NULL,
  createdById TEXT NOT NULL,
  createdAt TIMESTAMP DEFAULT NOW()
);
```

### CRM Reports
```sql
CREATE TABLE crm_reports (
  id TEXT PRIMARY KEY,
  reportType TEXT NOT NULL,
  periodStart TIMESTAMP NOT NULL,
  periodEnd TIMESTAMP NOT NULL,
  data JSONB NOT NULL,
  totalLeads INTEGER DEFAULT 0,
  convertedLeads INTEGER DEFAULT 0,
  conversionRate DECIMAL(5,2) DEFAULT 0,
  totalRevenue DECIMAL(12,2) DEFAULT 0,
  createdAt TIMESTAMP DEFAULT NOW()
);
```

## Usage Examples

### Send Email from CRM
```typescript
POST /api/platform/crm/enhanced/emails/send
{
  "leadId": "lead-uuid",
  "toEmail": "principal@school.com",
  "toName": "John Doe",
  "subject": "Follow-up on School Management System",
  "body": "<p>Dear {{contactName}},</p><p>...</p>",
  "templateId": "template-uuid" // optional
}
```

### Upload Document
```typescript
POST /api/platform/crm/enhanced/documents
{
  "name": "Proposal - Professional Plan",
  "fileUrl": "https://storage.../proposal.pdf",
  "fileSize": 1024000,
  "fileType": "pdf",
  "mimeType": "application/pdf",
  "category": "PROPOSAL",
  "leadId": "lead-uuid"
}
```

### Create Reminder
```typescript
POST /api/platform/crm/enhanced/reminders
{
  "leadId": "lead-uuid",
  "title": "Follow up on proposal",
  "reminderDate": "2026-01-25T10:00:00Z",
  "reminderType": "FOLLOW_UP",
  "priority": "HIGH",
  "assignedToId": "user-uuid"
}
```

### Calculate Lead Score
```typescript
POST /api/platform/crm/enhanced/leads/:leadId/score/calculate

Response:
{
  "totalScore": 75,
  "engagementScore": 35,
  "fitScore": 25,
  "intentScore": 15,
  "grade": "B",
  "emailOpens": 5,
  "emailClicks": 2
}
```

### Create Quote
```typescript
POST /api/platform/crm/enhanced/quotes
{
  "leadId": "lead-uuid",
  "title": "Professional Plan - Annual Subscription",
  "items": [
    {
      "description": "Professional Plan (500 students)",
      "quantity": 1,
      "unitPrice": 15000,
      "amount": 15000,
      "planTier": "PROFESSIONAL",
      "billingCycle": "ANNUAL"
    }
  ],
  "taxAmount": 2250,
  "discountAmount": 1000,
  "validUntil": "2026-02-28",
  "paymentTerms": "Net 30",
  "notes": "Special discount for early adoption"
}
```

### Import Leads
```typescript
POST /api/platform/crm/enhanced/leads/import
{
  "leads": [
    {
      "schoolName": "Lusaka Academy",
      "contactName": "John Doe",
      "contactEmail": "john@lusaka-academy.com",
      "contactPhone": "+260971234567",
      "source": "WEBSITE",
      "city": "Lusaka",
      "estimatedStudents": 500
    },
    // ... more leads
  ]
}
```

### Generate Report
```typescript
POST /api/platform/crm/enhanced/reports/generate
{
  "reportType": "CONVERSION",
  "periodStart": "2026-01-01",
  "periodEnd": "2026-01-31"
}

Response:
{
  "totalLeads": 45,
  "convertedLeads": 12,
  "conversionRate": 26.67,
  "totalRevenue": 180000,
  "avgDealSize": 15000,
  "avgSalesCycle": 21,
  "data": {
    "leadsByStatus": {...},
    "leadsBySource": {...},
    "dealsByStage": {...}
  }
}
```

## Frontend Integration

### Email Component Example
```typescript
// Send email from lead details
const sendEmail = async (leadId: string) => {
  const response = await fetch('/api/platform/crm/enhanced/emails/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      leadId,
      toEmail: lead.contactEmail,
      toName: lead.contactName,
      subject: 'Follow-up',
      body: emailBody,
      templateId: selectedTemplate
    })
  });
};
```

### Document Upload Example
```typescript
// Upload document
const uploadDoc = async (file: File, leadId: string) => {
  // First upload file to storage (S3, Azure Blob, etc.)
  const fileUrl = await uploadToStorage(file);
  
  // Then create document record
  await fetch('/api/platform/crm/enhanced/documents', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: file.name,
      fileUrl,
      fileSize: file.size,
      fileType: file.name.split('.').pop(),
      mimeType: file.type,
      category: 'PROPOSAL',
      leadId
    })
  });
};
```

## Best Practices

### Email Management
1. Use templates for consistent messaging
2. Track email opens to gauge interest
3. Follow up on clicked emails promptly
4. Keep email history for reference

### Document Management
5. Categorize documents properly
6. Use version control for proposals
7. Track document views
8. Keep documents organized by lead/deal

### Follow-up Reminders
9. Set reminders immediately after activities
10. Use priority levels effectively
11. Review reminders daily
12. Complete or snooze promptly

### Lead Scoring
13. Recalculate scores regularly
14. Focus on A and B grade leads
15. Update fit scores manually
16. Use scores for prioritization

### Quotes & Proposals
17. Generate quotes promptly
18. Set realistic validity periods
19. Track quote status
20. Follow up on viewed quotes

### Reporting
21. Generate monthly reports
22. Track conversion trends
23. Analyze sales cycle
24. Identify top sources

## Future Enhancements

### Planned Features
- Calendar integration (Google Calendar, Outlook)
- WhatsApp integration
- E-signature for quotes
- Automated email sequences
- AI-powered lead scoring
- Mobile app
- Advanced workflow automation
- Custom fields
- Territory management
- Customer success module

## Troubleshooting

### Email Not Sending
1. Check Azure email configuration
2. Verify email template variables
3. Check email service status
4. Review error logs

### Document Upload Fails
1. Check file size limits
2. Verify storage configuration
3. Check file permissions
4. Review supported file types

### Reminders Not Showing
1. Check reminder date/time
2. Verify assignment
3. Check status filter
4. Review notification settings

### Lead Score Not Calculating
1. Ensure activities exist
2. Check email tracking
3. Verify score components
4. Review calculation logic

---

**Implementation Status**: ✅ COMPLETE
**Date**: January 19, 2026
**Migration**: `20260119_add_enhanced_crm_features`

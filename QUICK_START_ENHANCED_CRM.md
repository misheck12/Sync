# Quick Start: Enhanced CRM Features

## ⚠️ IMPORTANT: Setup Required

Before using the enhanced CRM features, you **MUST** run this command:

### Windows:
```bash
cd backend
npx prisma generate
```

### Or use the setup script:
```bash
setup-enhanced-crm.bat
```

### Linux/Mac:
```bash
chmod +x setup-enhanced-crm.sh
./setup-enhanced-crm.sh
```

## Why This Step is Needed

The database migration has been applied, but the Prisma client needs to be regenerated to include the new models:
- EmailTemplate
- Email  
- Document
- FollowUpReminder
- LeadScore
- Quote
- QuoteItem
- CrmReport

## After Setup

Once you run `npx prisma generate`, restart your backend server:

```bash
npm run dev
```

The server should start without errors and all 21 new API endpoints will be available.

## Quick Test

Test that everything works:

```bash
# Get email templates (should return empty array initially)
curl http://localhost:3000/api/platform/crm/enhanced/email-templates \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Features Available

### 1. Email Integration
- Send emails from CRM
- Email templates
- Email tracking

### 2. Document Management
- Upload documents
- Categorize files
- Track views

### 3. Follow-up Reminders
- Create reminders
- Snooze/complete
- Priority levels

### 4. Lead Scoring
- Auto-calculate scores
- A/B/C/D grades
- Manual adjustments

### 5. Quotes & Proposals
- Generate quotes
- PDF export
- Track status

### 6. Import/Export
- Bulk import leads
- Export to CSV

### 7. Advanced Reporting
- Conversion analysis
- Pipeline reports
- Sales forecasting

## Full Documentation

- `SETUP_ENHANCED_CRM.md` - Detailed setup guide
- `docs/ENHANCED_CRM_FEATURES.md` - Complete feature documentation
- `ENHANCED_CRM_COMPLETE.md` - Implementation summary

## Troubleshooting

**Error: "Property 'emailTemplate' does not exist"**
→ Run `npx prisma generate` in backend directory

**Server won't start**
→ Check that migration was applied: `npx prisma migrate status`

**API endpoints return 404**
→ Restart server after running `npx prisma generate`

---

**Ready to go?** Run the setup command above and restart your server! 🚀

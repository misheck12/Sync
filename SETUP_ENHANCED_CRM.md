# Setup Enhanced CRM Features

## Required Steps

### 1. Regenerate Prisma Client

The database migration has been applied, but you need to regenerate the Prisma client to include the new models.

**Run this command in the backend directory:**

```bash
cd backend
npx prisma generate
```

This will update the Prisma client with the new models:
- EmailTemplate
- Email
- Document
- FollowUpReminder
- LeadScore
- Quote
- QuoteItem
- CrmReport

### 2. Restart the Backend Server

After generating the Prisma client, restart your backend server:

```bash
npm run dev
```

## Verification

Once the Prisma client is regenerated, the backend should start without errors. You can verify by checking:

1. **No TypeScript errors** - The server should compile successfully
2. **New API endpoints available** - Test with:
   ```bash
   curl http://localhost:3000/api/platform/crm/enhanced/email-templates \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

## Troubleshooting

### Error: "Property 'emailTemplate' does not exist on type 'PrismaClient'"

**Solution:** Run `npx prisma generate` in the backend directory

### Error: "Module has no exported member 'sendEmail'"

**Solution:** Already fixed - using a simple email wrapper function

### Migration already applied but models not available

**Solution:** 
1. Check that migration was applied: `npx prisma migrate status`
2. Regenerate client: `npx prisma generate`
3. Restart server

## What's Next

After setup is complete, you can:

1. **Test Email Templates**
   ```bash
   POST /api/platform/crm/enhanced/email-templates
   {
     "name": "Welcome Email",
     "subject": "Welcome to {{schoolName}}",
     "body": "<p>Hello {{contactName}}</p>",
     "category": "GENERAL"
   }
   ```

2. **Send CRM Email**
   ```bash
   POST /api/platform/crm/enhanced/emails/send
   {
     "leadId": "lead-uuid",
     "toEmail": "contact@school.com",
     "subject": "Follow-up",
     "body": "<p>Hello!</p>"
   }
   ```

3. **Upload Document**
   ```bash
   POST /api/platform/crm/enhanced/documents
   {
     "name": "Proposal.pdf",
     "fileUrl": "https://...",
     "fileSize": 1024000,
     "fileType": "pdf",
     "mimeType": "application/pdf",
     "category": "PROPOSAL",
     "leadId": "lead-uuid"
   }
   ```

4. **Create Reminder**
   ```bash
   POST /api/platform/crm/enhanced/reminders
   {
     "leadId": "lead-uuid",
     "title": "Follow up call",
     "reminderDate": "2026-01-25T10:00:00Z",
     "priority": "HIGH",
     "assignedToId": "user-uuid"
   }
   ```

5. **Calculate Lead Score**
   ```bash
   POST /api/platform/crm/enhanced/leads/:leadId/score/calculate
   ```

6. **Create Quote**
   ```bash
   POST /api/platform/crm/enhanced/quotes
   {
     "leadId": "lead-uuid",
     "title": "Professional Plan Quote",
     "items": [{
       "description": "Professional Plan",
       "quantity": 1,
       "unitPrice": 15000,
       "amount": 15000
     }],
     "validUntil": "2026-02-28"
   }
   ```

## Documentation

Full documentation available at:
- `docs/ENHANCED_CRM_FEATURES.md` - Complete feature guide
- `ENHANCED_CRM_COMPLETE.md` - Implementation summary

## Support

If you encounter any issues:
1. Check that migration is applied: `npx prisma migrate status`
2. Verify Prisma client is generated: Check `node_modules/.prisma/client`
3. Check server logs for specific errors
4. Ensure all dependencies are installed: `npm install`

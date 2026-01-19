import { Router } from 'express';
import {
    // Email Management
    sendCrmEmail,
    getLeadEmails,
    createEmailTemplate,
    getEmailTemplates,
    
    // Document Management
    uploadDocument,
    getDocuments,
    deleteDocument,
    
    // Follow-up Reminders
    createReminder,
    getMyReminders,
    completeReminder,
    snoozeReminder,
    
    // Lead Scoring
    calculateLeadScore,
    updateLeadScore,
    
    // Quotes & Proposals
    createQuote,
    getLeadQuotes,
    generateQuotePDF,
    updateQuoteStatus,
    
    // Import/Export
    importLeads,
    exportLeads,
    
    // Advanced Reporting
    generateCrmReport,
    getCrmReports,
} from '../controllers/enhancedCrmController';
import { authenticatePlatformUser } from '../middleware/platformMiddleware';

const router = Router();

// All routes require platform admin authentication
router.use(authenticatePlatformUser);

// ==========================================
// EMAIL MANAGEMENT ROUTES
// ==========================================
router.post('/emails/send', sendCrmEmail);
router.get('/emails/lead/:leadId', getLeadEmails);
router.post('/email-templates', createEmailTemplate);
router.get('/email-templates', getEmailTemplates);

// ==========================================
// DOCUMENT MANAGEMENT ROUTES
// ==========================================
router.post('/documents', uploadDocument);
router.get('/documents', getDocuments);
router.delete('/documents/:id', deleteDocument);

// ==========================================
// FOLLOW-UP REMINDERS ROUTES
// ==========================================
router.post('/reminders', createReminder);
router.get('/reminders/my', getMyReminders);
router.put('/reminders/:id/complete', completeReminder);
router.put('/reminders/:id/snooze', snoozeReminder);

// ==========================================
// LEAD SCORING ROUTES
// ==========================================
router.post('/leads/:leadId/score/calculate', calculateLeadScore);
router.put('/leads/:leadId/score', updateLeadScore);

// ==========================================
// QUOTES & PROPOSALS ROUTES
// ==========================================
router.post('/quotes', createQuote);
router.get('/quotes/lead/:leadId', getLeadQuotes);
router.get('/quotes/:quoteId/pdf', generateQuotePDF);
router.put('/quotes/:quoteId/status', updateQuoteStatus);

// ==========================================
// IMPORT/EXPORT ROUTES
// ==========================================
router.post('/leads/import', importLeads);
router.get('/leads/export', exportLeads);

// ==========================================
// ADVANCED REPORTING ROUTES
// ==========================================
router.post('/reports/generate', generateCrmReport);
router.get('/reports', getCrmReports);

export default router;

import { Router } from 'express';
import { authenticatePlatformUser } from '../middleware/platformMiddleware';
import {
    // Basic
    createLead,
    getLeads,
    getLeadDetails,
    updateLead,
    createDeal,
    getPipeline,
    updateDealStage,
    logActivity,
    createTask,
    getMyTasks,
    // Enhanced (Merged)
    sendCrmEmail,
    getLeadEmails,
    createEmailTemplate,
    getEmailTemplates,
    uploadDocument,
    getDocuments,
    deleteDocument,
    createReminder,
    getMyReminders,
    completeReminder,
    snoozeReminder,
    calculateLeadScore,
    updateLeadScore,
    createQuote,
    getLeadQuotes,
    generateQuotePDF,
    updateQuoteStatus,
    importLeads,
    exportLeads,
    generateCrmReport,
    getCrmReports
} from '../controllers/crmController';

const router = Router();

// All CRM routes require platform authentication
router.use(authenticatePlatformUser);

// ==========================================
// LEADS
// ==========================================
router.post('/leads', createLead);
router.get('/leads', getLeads);
// Import/Export (must come before :id routes if methods match, but here they are specific)
router.get('/leads/export', exportLeads);
router.post('/leads/import', importLeads);

router.get('/leads/:id', getLeadDetails);
router.put('/leads/:id', updateLead);

// Lead Scoring
router.put('/leads/:leadId/score', updateLeadScore);
router.post('/leads/:leadId/score/calculate', calculateLeadScore);

// ==========================================
// DEALS & PIPELINE
// ==========================================
router.post('/deals', createDeal);
router.get('/pipeline', getPipeline);
router.put('/deals/:id/stage', updateDealStage);

// ==========================================
// ACTIVITIES & TASKS
// ==========================================
router.post('/activities', logActivity);
router.post('/tasks', createTask);
router.get('/tasks', getMyTasks);
router.get('/tasks/my', getMyTasks); // Alias

// ==========================================
// EMAIL MANAGEMENT
// ==========================================
router.post('/emails/send', sendCrmEmail);
router.get('/emails/lead/:leadId', getLeadEmails);
router.post('/email-templates', createEmailTemplate);
router.get('/email-templates', getEmailTemplates);

// ==========================================
// DOCUMENT MANAGEMENT
// ==========================================
router.post('/documents', uploadDocument);
router.get('/documents', getDocuments);
router.delete('/documents/:id', deleteDocument);

// ==========================================
// FOLLOW-UP REMINDERS
// ==========================================
router.post('/reminders', createReminder);
router.get('/reminders/my', getMyReminders);
router.put('/reminders/:id/complete', completeReminder);
router.put('/reminders/:id/snooze', snoozeReminder);

// ==========================================
// QUOTES & PROPOSALS
// ==========================================
router.post('/quotes', createQuote);
router.get('/quotes/lead/:leadId', getLeadQuotes);
router.get('/quotes/:quoteId/pdf', generateQuotePDF);
router.put('/quotes/:quoteId/status', updateQuoteStatus);

// ==========================================
// ADVANCED REPORTING
// ==========================================
router.post('/reports/generate', generateCrmReport);
router.get('/reports', getCrmReports);

export default router;

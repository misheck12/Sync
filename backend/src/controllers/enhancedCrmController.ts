import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendEmail } from '../services/azureEmailService';
import PDFDocument from 'pdfkit';

const prisma = new PrismaClient();

// ==========================================
// EMAIL MANAGEMENT
// ==========================================

/**
 * Send email from CRM
 */
export const sendCrmEmail = async (req: Request, res: Response) => {
    try {
        const {
            leadId,
            toEmail,
            toName,
            subject,
            body,
            templateId,
            ccEmails,
            bccEmails,
        } = req.body;

        const platformUserId = (req as any).platformUser?.userId;

        // Get template if provided
        let emailBody = body;
        let emailSubject = subject;

        if (templateId) {
            const template = await prisma.emailTemplate.findUnique({
                where: { id: templateId },
            });

            if (template) {
                // Get lead details for variable replacement
                const lead = await prisma.lead.findUnique({
                    where: { id: leadId },
                });

                // Replace variables
                emailBody = template.body
                    .replace(/{{schoolName}}/g, lead?.schoolName || '')
                    .replace(/{{contactName}}/g, lead?.contactName || '')
                    .replace(/{{contactEmail}}/g, lead?.contactEmail || '');

                emailSubject = template.subject
                    .replace(/{{schoolName}}/g, lead?.schoolName || '')
                    .replace(/{{contactName}}/g, lead?.contactName || '');
            }
        }

        // Create email record
        const email = await prisma.email.create({
            data: {
                leadId,
                toEmail,
                toName,
                subject: emailSubject,
                body: emailBody,
                templateId,
                ccEmails: ccEmails || [],
                bccEmails: bccEmails || [],
                sentById: platformUserId,
                status: 'PENDING',
            },
        });

        // Send email
        try {
            await sendEmail({
                to: toEmail,
                subject: emailSubject,
                html: emailBody,
            });

            // Update email status
            await prisma.email.update({
                where: { id: email.id },
                data: {
                    status: 'SENT',
                    sentAt: new Date(),
                },
            });

            // Log activity
            if (leadId) {
                await prisma.activity.create({
                    data: {
                        leadId,
                        type: 'EMAIL',
                        subject: `Email sent: ${emailSubject}`,
                        description: `Sent email to ${toEmail}`,
                        performedById: platformUserId,
                        activityDate: new Date(),
                    },
                });
            }

            res.json({ message: 'Email sent successfully', email });
        } catch (error: any) {
            // Update email status to failed
            await prisma.email.update({
                where: { id: email.id },
                data: {
                    status: 'FAILED',
                    errorMessage: error.message,
                },
            });

            throw error;
        }
    } catch (error) {
        console.error('Send CRM email error:', error);
        res.status(500).json({ error: 'Failed to send email' });
    }
};

/**
 * Get email history for a lead
 */
export const getLeadEmails = async (req: Request, res: Response) => {
    try {
        const { leadId } = req.params;

        const emails = await prisma.email.findMany({
            where: { leadId },
            include: {
                sentBy: {
                    select: { fullName: true, email: true },
                },
                template: {
                    select: { name: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json(emails);
    } catch (error) {
        console.error('Get lead emails error:', error);
        res.status(500).json({ error: 'Failed to fetch emails' });
    }
};

/**
 * Create email template
 */
export const createEmailTemplate = async (req: Request, res: Response) => {
    try {
        const { name, subject, body, category, variables } = req.body;
        const platformUserId = (req as any).platformUser?.userId;

        const template = await prisma.emailTemplate.create({
            data: {
                name,
                subject,
                body,
                category,
                variables: variables || [],
                createdById: platformUserId,
            },
        });

        res.status(201).json(template);
    } catch (error) {
        console.error('Create email template error:', error);
        res.status(500).json({ error: 'Failed to create template' });
    }
};

/**
 * Get all email templates
 */
export const getEmailTemplates = async (req: Request, res: Response) => {
    try {
        const templates = await prisma.emailTemplate.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
        });

        res.json(templates);
    } catch (error) {
        console.error('Get email templates error:', error);
        res.status(500).json({ error: 'Failed to fetch templates' });
    }
};

// ==========================================
// DOCUMENT MANAGEMENT
// ==========================================

/**
 * Upload document
 */
export const uploadDocument = async (req: Request, res: Response) => {
    try {
        const {
            name,
            description,
            fileUrl,
            fileSize,
            fileType,
            mimeType,
            category,
            leadId,
            dealId,
        } = req.body;

        const platformUserId = (req as any).platformUser?.userId;

        const document = await prisma.document.create({
            data: {
                name,
                description,
                fileUrl,
                fileSize,
                fileType,
                mimeType,
                category,
                leadId,
                dealId,
                uploadedById: platformUserId,
            },
        });

        // Log activity if related to lead
        if (leadId) {
            await prisma.activity.create({
                data: {
                    leadId,
                    type: 'NOTE',
                    subject: `Document uploaded: ${name}`,
                    description: `Uploaded ${category} document`,
                    performedById: platformUserId,
                    activityDate: new Date(),
                },
            });
        }

        res.status(201).json(document);
    } catch (error) {
        console.error('Upload document error:', error);
        res.status(500).json({ error: 'Failed to upload document' });
    }
};

/**
 * Get documents for lead/deal
 */
export const getDocuments = async (req: Request, res: Response) => {
    try {
        const { leadId, dealId } = req.query;

        const where: any = {};
        if (leadId) where.leadId = leadId;
        if (dealId) where.dealId = dealId;

        const documents = await prisma.document.findMany({
            where,
            include: {
                uploadedBy: {
                    select: { fullName: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json(documents);
    } catch (error) {
        console.error('Get documents error:', error);
        res.status(500).json({ error: 'Failed to fetch documents' });
    }
};

/**
 * Delete document
 */
export const deleteDocument = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.document.delete({
            where: { id },
        });

        res.json({ message: 'Document deleted successfully' });
    } catch (error) {
        console.error('Delete document error:', error);
        res.status(500).json({ error: 'Failed to delete document' });
    }
};

// ==========================================
// FOLLOW-UP REMINDERS
// ==========================================

/**
 * Create follow-up reminder
 */
export const createReminder = async (req: Request, res: Response) => {
    try {
        const {
            leadId,
            title,
            description,
            reminderDate,
            reminderType,
            priority,
            assignedToId,
        } = req.body;

        const reminder = await prisma.followUpReminder.create({
            data: {
                leadId,
                title,
                description,
                reminderDate: new Date(reminderDate),
                reminderType,
                priority,
                assignedToId,
            },
        });

        res.status(201).json(reminder);
    } catch (error) {
        console.error('Create reminder error:', error);
        res.status(500).json({ error: 'Failed to create reminder' });
    }
};

/**
 * Get reminders for user
 */
export const getMyReminders = async (req: Request, res: Response) => {
    try {
        const platformUserId = (req as any).platformUser?.userId;

        const reminders = await prisma.followUpReminder.findMany({
            where: {
                assignedToId: platformUserId,
                status: 'PENDING',
                reminderDate: {
                    lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next 7 days
                },
            },
            include: {
                lead: {
                    select: { schoolName: true, contactName: true },
                },
            },
            orderBy: { reminderDate: 'asc' },
        });

        res.json(reminders);
    } catch (error) {
        console.error('Get reminders error:', error);
        res.status(500).json({ error: 'Failed to fetch reminders' });
    }
};

/**
 * Complete reminder
 */
export const completeReminder = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const reminder = await prisma.followUpReminder.update({
            where: { id },
            data: {
                status: 'COMPLETED',
                completedAt: new Date(),
            },
        });

        res.json(reminder);
    } catch (error) {
        console.error('Complete reminder error:', error);
        res.status(500).json({ error: 'Failed to complete reminder' });
    }
};

/**
 * Snooze reminder
 */
export const snoozeReminder = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { snoozeUntil } = req.body;

        const reminder = await prisma.followUpReminder.update({
            where: { id },
            data: {
                status: 'SNOOZED',
                snoozeUntil: new Date(snoozeUntil),
            },
        });

        res.json(reminder);
    } catch (error) {
        console.error('Snooze reminder error:', error);
        res.status(500).json({ error: 'Failed to snooze reminder' });
    }
};

// ==========================================
// LEAD SCORING
// ==========================================

/**
 * Calculate lead score
 */
export const calculateLeadScore = async (req: Request, res: Response) => {
    try {
        const { leadId } = req.params;

        // Get lead activities
        const activities = await prisma.activity.findMany({
            where: { leadId },
        });

        // Get emails
        const emails = await prisma.email.findMany({
            where: { leadId },
        });

        // Calculate scores
        const engagementScore = Math.min(
            activities.length * 5 + emails.filter(e => e.openCount > 0).length * 10,
            40
        );

        const emailOpens = emails.reduce((sum, e) => sum + e.openCount, 0);
        const emailClicks = emails.reduce((sum, e) => sum + e.clickCount, 0);

        // Get or create lead score
        const existingScore = await prisma.leadScore.findUnique({
            where: { leadId },
        });

        const totalScore = engagementScore + (existingScore?.fitScore || 0) + (existingScore?.intentScore || 0);

        let grade = 'D';
        if (totalScore >= 80) grade = 'A';
        else if (totalScore >= 60) grade = 'B';
        else if (totalScore >= 40) grade = 'C';

        const score = await prisma.leadScore.upsert({
            where: { leadId },
            update: {
                engagementScore,
                emailOpens,
                emailClicks,
                totalScore,
                grade,
                lastCalculatedAt: new Date(),
            },
            create: {
                leadId,
                engagementScore,
                emailOpens,
                emailClicks,
                totalScore,
                grade,
            },
        });

        res.json(score);
    } catch (error) {
        console.error('Calculate lead score error:', error);
        res.status(500).json({ error: 'Failed to calculate lead score' });
    }
};

/**
 * Update lead score manually
 */
export const updateLeadScore = async (req: Request, res: Response) => {
    try {
        const { leadId } = req.params;
        const { fitScore, intentScore, demoRequested, budgetConfirmed, decisionMaker } = req.body;

        const score = await prisma.leadScore.update({
            where: { leadId },
            data: {
                fitScore,
                intentScore,
                demoRequested,
                budgetConfirmed,
                decisionMaker,
                lastCalculatedAt: new Date(),
            },
        });

        // Recalculate total score
        const totalScore = score.engagementScore + (fitScore || score.fitScore) + (intentScore || score.intentScore);
        let grade = 'D';
        if (totalScore >= 80) grade = 'A';
        else if (totalScore >= 60) grade = 'B';
        else if (totalScore >= 40) grade = 'C';

        const updatedScore = await prisma.leadScore.update({
            where: { leadId },
            data: { totalScore, grade },
        });

        res.json(updatedScore);
    } catch (error) {
        console.error('Update lead score error:', error);
        res.status(500).json({ error: 'Failed to update lead score' });
    }
};

// ==========================================
// QUOTES & PROPOSALS
// ==========================================

/**
 * Create quote
 */
export const createQuote = async (req: Request, res: Response) => {
    try {
        const {
            leadId,
            dealId,
            title,
            description,
            items,
            taxAmount,
            discountAmount,
            validUntil,
            paymentTerms,
            deliveryTerms,
            notes,
        } = req.body;

        const platformUserId = (req as any).platformUser?.userId;

        // Generate quote number
        const year = new Date().getFullYear();
        const count = await prisma.quote.count({
            where: {
                quoteNumber: { startsWith: `QT-${year}` },
            },
        });
        const quoteNumber = `QT-${year}-${String(count + 1).padStart(6, '0')}`;

        // Calculate totals
        const subtotal = items.reduce((sum: number, item: any) => sum + Number(item.amount), 0);
        const totalAmount = subtotal + Number(taxAmount || 0) - Number(discountAmount || 0);

        const quote = await prisma.quote.create({
            data: {
                quoteNumber,
                leadId,
                dealId,
                title,
                description,
                subtotal,
                taxAmount: taxAmount || 0,
                discountAmount: discountAmount || 0,
                totalAmount,
                validUntil: new Date(validUntil),
                paymentTerms,
                deliveryTerms,
                notes,
                createdById: platformUserId,
                items: {
                    create: items.map((item: any) => ({
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        amount: item.amount,
                        planTier: item.planTier,
                        billingCycle: item.billingCycle,
                    })),
                },
            },
            include: {
                items: true,
            },
        });

        // Log activity
        await prisma.activity.create({
            data: {
                leadId,
                type: 'NOTE',
                subject: `Quote created: ${quoteNumber}`,
                description: `Created quote for ${title}`,
                performedById: platformUserId,
                activityDate: new Date(),
            },
        });

        res.status(201).json(quote);
    } catch (error) {
        console.error('Create quote error:', error);
        res.status(500).json({ error: 'Failed to create quote' });
    }
};

/**
 * Get quotes for lead
 */
export const getLeadQuotes = async (req: Request, res: Response) => {
    try {
        const { leadId } = req.params;

        const quotes = await prisma.quote.findMany({
            where: { leadId },
            include: {
                items: true,
                createdBy: {
                    select: { fullName: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json(quotes);
    } catch (error) {
        console.error('Get lead quotes error:', error);
        res.status(500).json({ error: 'Failed to fetch quotes' });
    }
};

/**
 * Generate quote PDF
 */
export const generateQuotePDF = async (req: Request, res: Response) => {
    try {
        const { quoteId } = req.params;

        const quote = await prisma.quote.findUnique({
            where: { id: quoteId },
            include: {
                lead: true,
                items: true,
            },
        });

        if (!quote) {
            return res.status(404).json({ error: 'Quote not found' });
        }

        // Create PDF
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => {
            const pdfBuffer = Buffer.concat(chunks);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=quote-${quote.quoteNumber}.pdf`);
            res.send(pdfBuffer);
        });

        // Header
        doc.fontSize(24).text('QUOTATION', { align: 'center' });
        doc.moveDown();

        // Quote details
        doc.fontSize(12);
        doc.text(`Quote #: ${quote.quoteNumber}`);
        doc.text(`Date: ${quote.createdAt.toLocaleDateString()}`);
        doc.text(`Valid Until: ${quote.validUntil.toLocaleDateString()}`);
        doc.moveDown();

        // Client info
        doc.fontSize(14).text('Prepared For:');
        doc.fontSize(10);
        doc.text(quote.lead.schoolName);
        doc.text(quote.lead.contactName);
        doc.text(quote.lead.contactEmail);
        doc.moveDown();

        // Title
        doc.fontSize(16).text(quote.title);
        if (quote.description) {
            doc.fontSize(10).text(quote.description);
        }
        doc.moveDown();

        // Items table
        doc.fontSize(12).text('Items:');
        doc.moveDown(0.5);

        const tableTop = doc.y;
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Description', 50, tableTop);
        doc.text('Qty', 300, tableTop);
        doc.text('Unit Price', 350, tableTop);
        doc.text('Amount', 450, tableTop, { align: 'right' });

        doc.font('Helvetica');
        let yPosition = tableTop + 20;
        quote.items.forEach((item) => {
            doc.text(item.description, 50, yPosition);
            doc.text(item.quantity.toString(), 300, yPosition);
            doc.text(`${quote.currency} ${Number(item.unitPrice).toFixed(2)}`, 350, yPosition);
            doc.text(`${quote.currency} ${Number(item.amount).toFixed(2)}`, 450, yPosition, { align: 'right' });
            yPosition += 20;
        });

        // Totals
        yPosition += 20;
        doc.font('Helvetica-Bold');
        doc.text('Subtotal:', 350, yPosition);
        doc.text(`${quote.currency} ${Number(quote.subtotal).toFixed(2)}`, 450, yPosition, { align: 'right' });

        yPosition += 20;
        doc.text('Tax:', 350, yPosition);
        doc.text(`${quote.currency} ${Number(quote.taxAmount).toFixed(2)}`, 450, yPosition, { align: 'right' });

        yPosition += 20;
        doc.text('Discount:', 350, yPosition);
        doc.text(`${quote.currency} ${Number(quote.discountAmount).toFixed(2)}`, 450, yPosition, { align: 'right' });

        yPosition += 20;
        doc.fontSize(12);
        doc.text('Total:', 350, yPosition);
        doc.text(`${quote.currency} ${Number(quote.totalAmount).toFixed(2)}`, 450, yPosition, { align: 'right' });

        // Terms
        if (quote.paymentTerms || quote.deliveryTerms || quote.notes) {
            doc.moveDown(3);
            doc.fontSize(12).font('Helvetica-Bold').text('Terms & Conditions:');
            doc.fontSize(10).font('Helvetica');
            if (quote.paymentTerms) doc.text(`Payment: ${quote.paymentTerms}`);
            if (quote.deliveryTerms) doc.text(`Delivery: ${quote.deliveryTerms}`);
            if (quote.notes) doc.text(`Notes: ${quote.notes}`);
        }

        doc.end();
    } catch (error) {
        console.error('Generate quote PDF error:', error);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
};

/**
 * Update quote status
 */
export const updateQuoteStatus = async (req: Request, res: Response) => {
    try {
        const { quoteId } = req.params;
        const { status } = req.body;

        const updateData: any = { status };

        if (status === 'SENT') updateData.sentAt = new Date();
        if (status === 'VIEWED') updateData.viewedAt = new Date();
        if (status === 'ACCEPTED') updateData.acceptedAt = new Date();
        if (status === 'REJECTED') updateData.rejectedAt = new Date();

        const quote = await prisma.quote.update({
            where: { id: quoteId },
            data: updateData,
        });

        res.json(quote);
    } catch (error) {
        console.error('Update quote status error:', error);
        res.status(500).json({ error: 'Failed to update quote status' });
    }
};

// ==========================================
// LEAD IMPORT/EXPORT
// ==========================================

/**
 * Import leads from CSV
 */
export const importLeads = async (req: Request, res: Response) => {
    try {
        const { leads } = req.body; // Array of lead objects
        const platformUserId = (req as any).platformUser?.userId;

        const results = [];

        for (const leadData of leads) {
            try {
                const lead = await prisma.lead.create({
                    data: {
                        schoolName: leadData.schoolName,
                        contactName: leadData.contactName,
                        contactEmail: leadData.contactEmail,
                        contactPhone: leadData.contactPhone,
                        source: leadData.source || 'IMPORT',
                        status: leadData.status || 'NEW',
                        city: leadData.city,
                        province: leadData.province,
                        country: leadData.country || 'Zambia',
                        estimatedStudents: leadData.estimatedStudents,
                        notes: leadData.notes,
                    },
                });

                results.push({ success: true, lead });
            } catch (error: any) {
                results.push({ success: false, error: error.message, data: leadData });
            }
        }

        res.json({
            message: `Imported ${results.filter(r => r.success).length} of ${leads.length} leads`,
            results,
        });
    } catch (error) {
        console.error('Import leads error:', error);
        res.status(500).json({ error: 'Failed to import leads' });
    }
};

/**
 * Export leads to CSV
 */
export const exportLeads = async (req: Request, res: Response) => {
    try {
        const { status, source, assignedToId } = req.query;

        const where: any = {};
        if (status) where.status = status;
        if (source) where.source = source;
        if (assignedToId) where.assignedToId = assignedToId;

        const leads = await prisma.lead.findMany({
            where,
            include: {
                assignedTo: {
                    select: { fullName: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Generate CSV
        const headers = [
            'School Name',
            'Contact Name',
            'Contact Email',
            'Contact Phone',
            'Status',
            'Source',
            'City',
            'Province',
            'Country',
            'Estimated Students',
            'Assigned To',
            'Created At',
        ];

        const rows = leads.map(lead => [
            lead.schoolName,
            lead.contactName,
            lead.contactEmail || '',
            lead.contactPhone || '',
            lead.status,
            lead.source,
            lead.city || '',
            lead.province || '',
            lead.country,
            lead.estimatedStudents || '',
            lead.assignedTo?.fullName || '',
            lead.createdAt.toLocaleDateString(),
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=leads-export-${Date.now()}.csv`);
        res.send(csv);
    } catch (error) {
        console.error('Export leads error:', error);
        res.status(500).json({ error: 'Failed to export leads' });
    }
};

// ==========================================
// ADVANCED REPORTING
// ==========================================

/**
 * Generate CRM report
 */
export const generateCrmReport = async (req: Request, res: Response) => {
    try {
        const { reportType, periodStart, periodEnd } = req.body;
        const platformUserId = (req as any).platformUser?.userId;

        const startDate = new Date(periodStart);
        const endDate = new Date(periodEnd);

        // Get leads in period
        const leads = await prisma.lead.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            include: {
                deals: true,
            },
        });

        // Calculate metrics
        const totalLeads = leads.length;
        const convertedLeads = leads.filter(l => l.convertedAt).length;
        const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

        const deals = leads.flatMap(l => l.deals);
        const wonDeals = deals.filter(d => d.stage === 'closed_won');
        const totalRevenue = wonDeals.reduce((sum, d) => sum + Number(d.value), 0);
        const avgDealSize = wonDeals.length > 0 ? totalRevenue / wonDeals.length : 0;

        // Calculate avg sales cycle
        const salesCycles = wonDeals
            .filter(d => d.actualCloseDate)
            .map(d => {
                const created = new Date(d.createdAt);
                const closed = new Date(d.actualCloseDate!);
                return Math.floor((closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
            });
        const avgSalesCycle = salesCycles.length > 0
            ? salesCycles.reduce((sum, days) => sum + days, 0) / salesCycles.length
            : 0;

        // Detailed data
        const data = {
            leadsByStatus: leads.reduce((acc: any, lead) => {
                acc[lead.status] = (acc[lead.status] || 0) + 1;
                return acc;
            }, {}),
            leadsBySource: leads.reduce((acc: any, lead) => {
                acc[lead.source] = (acc[lead.source] || 0) + 1;
                return acc;
            }, {}),
            dealsByStage: deals.reduce((acc: any, deal) => {
                acc[deal.stage] = (acc[deal.stage] || 0) + 1;
                return acc;
            }, {}),
            topPerformers: [], // TODO: Add sales rep performance
        };

        // Create report
        const report = await prisma.crmReport.create({
            data: {
                reportType,
                periodStart: startDate,
                periodEnd: endDate,
                data,
                totalLeads,
                convertedLeads,
                conversionRate,
                totalRevenue,
                avgDealSize,
                avgSalesCycle: Math.round(avgSalesCycle),
                generatedById: platformUserId,
            },
        });

        res.json(report);
    } catch (error) {
        console.error('Generate CRM report error:', error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
};

/**
 * Get CRM reports
 */
export const getCrmReports = async (req: Request, res: Response) => {
    try {
        const { reportType } = req.query;

        const where: any = {};
        if (reportType) where.reportType = reportType;

        const reports = await prisma.crmReport.findMany({
            where,
            include: {
                generatedBy: {
                    select: { fullName: true },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });

        res.json(reports);
    } catch (error) {
        console.error('Get CRM reports error:', error);
        res.status(500).json({ error: 'Failed to fetch reports' });
    }
};

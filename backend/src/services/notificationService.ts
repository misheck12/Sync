import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient() as any;

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

interface SMSOptions {
  to: string | string[];
  message: string;
}

// Email service
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  async initialize(tenantId: string) {
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          smtpHost: true,
          smtpPort: true,
          smtpSecure: true,
          smtpUser: true,
          smtpPassword: true,
          smtpFromEmail: true,
          smtpFromName: true,
        }
      });

      if (!tenant || !tenant.smtpHost) {
        console.log('SMTP not configured for tenant:', tenantId);
        return false;
      }

      this.transporter = nodemailer.createTransport({
        host: tenant.smtpHost,
        port: tenant.smtpPort || 587,
        secure: tenant.smtpSecure || false,
        auth: {
          user: tenant.smtpUser,
          pass: tenant.smtpPassword,
        },
      });

      return true;
    } catch (error) {
      console.error('Email service initialization error:', error);
      return false;
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      console.error('Email transporter not initialized');
      return false;
    }

    try {
      const recipients = Array.isArray(options.to) ? options.to : [options.to];

      for (const recipient of recipients) {
        await this.transporter.sendMail({
          from: process.env.SMTP_FROM_EMAIL || 'noreply@sync.com',
          to: recipient,
          subject: options.subject,
          html: options.html,
          text: options.text || options.html.replace(/<[^>]*>/g, ''),
        });
      }

      return true;
    } catch (error) {
      console.error('Send email error:', error);
      return false;
    }
  }
}

// SMS service
export class SMSService {
  private apiKey: string | null = null;
  private apiSecret: string | null = null;
  private senderId: string | null = null;
  private provider: string | null = null;

  async initialize(tenantId: string) {
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          smsProvider: true,
          smsApiKey: true,
          smsApiSecret: true,
          smsSenderId: true,
        }
      });

      if (!tenant || !tenant.smsProvider) {
        console.log('SMS not configured for tenant:', tenantId);
        return false;
      }

      this.provider = tenant.smsProvider;
      this.apiKey = tenant.smsApiKey;
      this.apiSecret = tenant.smsApiSecret;
      this.senderId = tenant.smsSenderId;

      return true;
    } catch (error) {
      console.error('SMS service initialization error:', error);
      return false;
    }
  }

  async sendSMS(options: SMSOptions): Promise<boolean> {
    if (!this.apiKey || !this.provider) {
      console.error('SMS service not initialized');
      return false;
    }

    try {
      const recipients = Array.isArray(options.to) ? options.to : [options.to];

      // TODO: Implement actual SMS sending based on provider
      // For now, just log
      console.log('SMS would be sent:', {
        provider: this.provider,
        recipients,
        message: options.message,
      });

      // Simulate success
      return true;
    } catch (error) {
      console.error('Send SMS error:', error);
      return false;
    }
  }
}

// Notification templates
export const NotificationTemplates = {
  // Homework notifications
  homeworkPosted: (homework: any) => ({
    subject: `New Homework: ${homework.title}`,
    html: `
      <h2>New Homework Posted</h2>
      <p><strong>Subject:</strong> ${homework.subjectContent.subject.name}</p>
      <p><strong>Class:</strong> ${homework.subjectContent.class.name}</p>
      <p><strong>Title:</strong> ${homework.title}</p>
      <p><strong>Instructions:</strong> ${homework.instructions || 'See details in app'}</p>
      <p><strong>Due Date:</strong> ${homework.dueDate ? new Date(homework.dueDate).toLocaleDateString() : 'No due date'}</p>
      <p>Log in to view full details and submit your work.</p>
    `,
    sms: `New homework: ${homework.title} for ${homework.subjectContent.subject.name}. Due: ${homework.dueDate ? new Date(homework.dueDate).toLocaleDateString() : 'TBA'}`,
  }),

  homeworkGraded: (submission: any) => ({
    subject: `Homework Graded: ${submission.homework.title}`,
    html: `
      <h2>Your Homework Has Been Graded</h2>
      <p><strong>Homework:</strong> ${submission.homework.title}</p>
      <p><strong>Score:</strong> ${submission.marks}/${submission.maxMarks} (${Math.round((submission.marks / submission.maxMarks) * 100)}%)</p>
      ${submission.feedback ? `<p><strong>Feedback:</strong> ${submission.feedback}</p>` : ''}
      <p>Log in to view full details.</p>
    `,
    sms: `Homework graded: ${submission.homework.title}. Score: ${submission.marks}/${submission.maxMarks}`,
  }),

  // Announcement notifications
  announcementPosted: (announcement: any) => ({
    subject: `${announcement.priority === 'URGENT' ? '🚨 URGENT: ' : ''}${announcement.title}`,
    html: `
      <h2>${announcement.title}</h2>
      <p><strong>Category:</strong> ${announcement.category}</p>
      <p><strong>Priority:</strong> ${announcement.priority}</p>
      <div>${announcement.content}</div>
      ${announcement.expiresAt ? `<p><em>Expires: ${new Date(announcement.expiresAt).toLocaleDateString()}</em></p>` : ''}
    `,
    sms: `${announcement.priority === 'URGENT' ? 'URGENT: ' : ''}${announcement.title}. ${announcement.content.substring(0, 100)}...`,
  }),

  // Forum notifications
  topicReply: (post: any, topic: any) => ({
    subject: `New reply to: ${topic.title}`,
    html: `
      <h2>New Reply in Forum</h2>
      <p><strong>Topic:</strong> ${topic.title}</p>
      <p><strong>Reply by:</strong> ${post.createdBy.fullName}</p>
      <p>${post.content}</p>
      <p>Log in to view and respond.</p>
    `,
    sms: `New reply to "${topic.title}" by ${post.createdBy.fullName}`,
  }),

  topicAnswered: (topic: any) => ({
    subject: `Your question was answered: ${topic.title}`,
    html: `
      <h2>Your Question Has Been Answered</h2>
      <p><strong>Topic:</strong> ${topic.title}</p>
      <p>A teacher has marked an answer to your question.</p>
      <p>Log in to view the answer.</p>
    `,
    sms: `Your question "${topic.title}" has been answered!`,
  }),
};

// Generate payment receipt email/SMS content
export const generatePaymentReceiptEmail = (
  guardianName: string,
  studentName: string,
  amount: number,
  paymentDate: Date,
  method: string,
  transactionId: string,
  schoolName: string
) => {
  const formattedDate = paymentDate.toLocaleDateString('en-ZM', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedAmount = new Intl.NumberFormat('en-ZM', {
    style: 'currency',
    currency: 'ZMW',
  }).format(amount);

  return {
    subject: `Payment Receipt - ${schoolName}`,
    text: `Dear ${guardianName},\n\nThank you for your payment of ${formattedAmount} for ${studentName}.\n\nTransaction ID: ${transactionId}\nPayment Method: ${method}\nDate: ${formattedDate}\n\nThank you,\n${schoolName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Payment Receipt</h2>
        <p>Dear ${guardianName},</p>
        <p>Thank you for your payment. Here are the details:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; color: #6b7280;">Student</td>
            <td style="padding: 10px 0; font-weight: bold;">${studentName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; color: #6b7280;">Amount</td>
            <td style="padding: 10px 0; font-weight: bold; color: #059669;">${formattedAmount}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; color: #6b7280;">Payment Method</td>
            <td style="padding: 10px 0;">${method}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; color: #6b7280;">Transaction ID</td>
            <td style="padding: 10px 0; font-family: monospace;">${transactionId}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #6b7280;">Date</td>
            <td style="padding: 10px 0;">${formattedDate}</td>
          </tr>
        </table>
        <p style="color: #6b7280; font-size: 14px;">Thank you for your payment.</p>
        <p style="color: #374151;">${schoolName}</p>
      </div>
    `,
    sms: `${schoolName}: Payment of ${formattedAmount} received for ${studentName}. Ref: ${transactionId}. Thank you!`,
  };
};

// Generate fee reminder email/SMS content
export const generateFeeReminderEmail = (
  studentName: string,
  outstandingAmount: number,
  dueDate: Date | null,
  schoolName: string,
  isOverdue: boolean = false
) => {
  const formattedAmount = new Intl.NumberFormat('en-ZM', {
    style: 'currency',
    currency: 'ZMW',
  }).format(outstandingAmount);
  const formattedDueDate = dueDate
    ? dueDate.toLocaleDateString('en-ZM', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    : 'N/A';

  const urgencyText = isOverdue ? 'OVERDUE: ' : '';
  const urgencyClass = isOverdue ? 'color: #dc2626;' : '';

  return {
    subject: `${urgencyText}Fee Reminder for ${studentName} - ${schoolName}`,
    text: `Dear Parent/Guardian,\n\nThis is a reminder that ${studentName} has an outstanding fee balance of ${formattedAmount}.${dueDate ? ` Payment is due by ${formattedDueDate}.` : ''}\n\nPlease make the payment at your earliest convenience.\n\nThank you,\n${schoolName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="${urgencyClass}">${urgencyText}Fee Reminder</h2>
        <p>Dear Parent/Guardian,</p>
        <p>This is a reminder regarding outstanding school fees for <strong>${studentName}</strong>.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; color: #6b7280;">Outstanding Amount</td>
            <td style="padding: 10px 0; font-weight: bold; ${isOverdue ? 'color: #dc2626;' : 'color: #059669;'}">${formattedAmount}</td>
          </tr>
          ${dueDate ? `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; color: #6b7280;">Due Date</td>
            <td style="padding: 10px 0; ${isOverdue ? 'color: #dc2626; font-weight: bold;' : ''}">${formattedDueDate}${isOverdue ? ' (OVERDUE)' : ''}</td>
          </tr>
          ` : ''}
        </table>
        <p>Please make the payment at your earliest convenience to avoid any inconvenience.</p>
        <p style="color: #374151;">${schoolName}</p>
      </div>
    `,
    sms: `${urgencyText}${schoolName}: Fee reminder for ${studentName}. Outstanding: ${formattedAmount}${dueDate ? `. Due: ${formattedDueDate}` : ''}. Please pay soon.`,
  };
};

// Send notification via email and/or SMS
export const sendNotification = async (
  tenantId: string,
  email: string | undefined,
  phone: string | undefined,
  subject: string,
  text: string,
  html?: string,
  smsMessage?: string
): Promise<{ emailSent: boolean; smsSent: boolean }> => {
  const result = { emailSent: false, smsSent: false };

  try {
    // Send Email
    if (email && (html || text)) {
      const emailService = new EmailService();
      const initialized = await emailService.initialize(tenantId);
      if (initialized) {
        result.emailSent = await emailService.sendEmail({
          to: email,
          subject,
          html: html || `<p>${text}</p>`,
          text,
        });
      }
    }

    // Send SMS
    if (phone && (smsMessage || text)) {
      const smsService = new SMSService();
      const initialized = await smsService.initialize(tenantId);
      if (initialized) {
        result.smsSent = await smsService.sendSMS({
          to: phone,
          message: smsMessage || text,
        });
      }
    }

    return result;
  } catch (error: any) {
    console.error('sendNotification error:', error);
    return result;
  }
};

// Create a single notification for a user
export const createNotification = async (
  tenantId: string,
  userId: string,
  title: string,
  message: string,
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR' = 'INFO'
) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        tenantId,
        userId,
        title,
        message,
        type,
      },
    });
    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    return null;
  }
};

// Broadcast notification to multiple users
export const broadcastNotification = async (
  tenantId: string,
  userIds: string[],
  title: string,
  message: string,
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR' = 'INFO'
) => {
  try {
    const notifications = await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        tenantId,
        userId,
        title,
        message,
        type,
      })),
    });
    return notifications;
  } catch (error) {
    console.error('Broadcast notification error:', error);
    return null;
  }
};

// Notification queue (for background processing)
export const queueNotification = async (
  tenantId: string,
  type: 'email' | 'sms' | 'both',
  recipients: string[],
  template: any
) => {
  try {
    // TODO: Implement actual queue (Redis, Bull, etc.)
    // For now, send immediately

    if (type === 'email' || type === 'both') {
      const emailService = new EmailService();
      await emailService.initialize(tenantId);
      await emailService.sendEmail({
        to: recipients,
        subject: template.subject,
        html: template.html,
      });
    }

    if (type === 'sms' || type === 'both') {
      const smsService = new SMSService();
      await smsService.initialize(tenantId);
      await smsService.sendSMS({
        to: recipients,
        message: template.sms,
      });
    }

    return true;
  } catch (error) {
    console.error('Queue notification error:', error);
    return false;
  }
};


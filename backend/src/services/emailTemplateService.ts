/**
 * Email Template Service
 * 
 * Generates beautiful branded HTML email templates with school logos,
 * colors, and details for various email types.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SchoolBranding {
    name: string;
    logoUrl?: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor?: string;
    email?: string;
    phone?: string;
    address?: string;
    website?: string;
}

interface EmailTemplateOptions {
    tenantId: string;
    recipientName: string;
    subject: string;
    preheader?: string; // Preview text in email clients
}

/**
 * Get school branding from tenant
 */
export const getSchoolBranding = async (tenantId: string): Promise<SchoolBranding> => {
    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
            name: true,
            logoUrl: true,
            primaryColor: true,
            secondaryColor: true,
            email: true,
            phone: true,
            address: true,
            domain: true,
        },
    });

    if (!tenant) {
        return {
            name: 'School',
            primaryColor: '#2563eb',
            secondaryColor: '#475569',
        };
    }

    return {
        name: tenant.name,
        logoUrl: tenant.logoUrl || undefined,
        primaryColor: tenant.primaryColor || '#2563eb',
        secondaryColor: tenant.secondaryColor || '#475569',
        accentColor: '#f59e0b',
        email: tenant.email || undefined,
        phone: tenant.phone || undefined,
        address: tenant.address || undefined,
        website: tenant.domain || undefined,
    };
};

/**
 * Base email template wrapper with school branding
 */
const baseTemplate = (branding: SchoolBranding, content: string, preheader?: string): string => {
    const year = new Date().getFullYear();

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>${branding.name}</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style>
        /* Reset */
        body, table, td, p, a { margin: 0; padding: 0; }
        body { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table { border-collapse: collapse !important; }
        img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
        
        /* Typography */
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
        
        /* Responsive */
        @media only screen and (max-width: 600px) {
            .container { width: 100% !important; padding: 10px !important; }
            .content { padding: 20px !important; }
            .header-logo { height: 40px !important; }
        }
    </style>
</head>
<body style="background-color: #f4f4f5; margin: 0; padding: 20px 0;">
    ${preheader ? `
    <!-- Preheader (preview text) -->
    <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
        ${preheader}
        &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
    </div>
    ` : ''}
    
    <!-- Email Container -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="padding: 20px 10px;">
                <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.secondaryColor} 100%); padding: 30px 40px; text-align: center;">
                            ${branding.logoUrl ? `
                            <img src="${branding.logoUrl}" alt="${branding.name}" class="header-logo" style="height: 60px; width: auto; margin-bottom: 10px;">
                            ` : `
                            <div style="width: 60px; height: 60px; background-color: rgba(255,255,255,0.2); border-radius: 12px; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center;">
                                <span style="color: #ffffff; font-size: 28px; font-weight: bold;">${branding.name.charAt(0)}</span>
                            </div>
                            `}
                            <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0; text-shadow: 0 1px 2px rgba(0,0,0,0.1);">
                                ${branding.name}
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td class="content" style="padding: 40px;">
                            ${content}
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8fafc; padding: 30px 40px; border-top: 1px solid #e2e8f0;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="text-align: center;">
                                        ${branding.website ? `
                                        <p style="margin: 0 0 10px; font-size: 14px; color: #64748b;">
                                            <a href="https://${branding.website}" style="color: ${branding.primaryColor}; text-decoration: none;">
                                                ${branding.website}
                                            </a>
                                        </p>
                                        ` : ''}
                                        
                                        ${branding.address ? `
                                        <p style="margin: 0 0 5px; font-size: 13px; color: #94a3b8;">
                                            📍 ${branding.address}
                                        </p>
                                        ` : ''}
                                        
                                        <p style="margin: 0; font-size: 13px; color: #94a3b8;">
                                            ${branding.phone ? `📞 ${branding.phone}` : ''}
                                            ${branding.phone && branding.email ? ' | ' : ''}
                                            ${branding.email ? `✉️ ${branding.email}` : ''}
                                        </p>
                                        
                                        <p style="margin: 20px 0 0; font-size: 12px; color: #cbd5e1;">
                                            © ${year} ${branding.name}. All rights reserved.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                </table>
                
                <!-- Unsubscribe -->
                <p style="margin-top: 20px; font-size: 11px; color: #94a3b8; text-align: center;">
                    This email was sent by ${branding.name}. 
                    <a href="#" style="color: #94a3b8;">Manage preferences</a>
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
};

/**
 * Announcement Email Template
 */
export const announcementTemplate = async (
    options: EmailTemplateOptions & {
        message: string;
    }
): Promise<string> => {
    const branding = await getSchoolBranding(options.tenantId);

    const content = `
        <p style="margin: 0 0 20px; font-size: 16px; color: #475569; line-height: 1.6;">
            Dear <strong>${options.recipientName}</strong>,
        </p>
        
        <div style="background-color: #f8fafc; border-left: 4px solid ${branding.primaryColor}; padding: 20px; border-radius: 0 8px 8px 0; margin: 20px 0;">
            <p style="margin: 0; font-size: 15px; color: #334155; line-height: 1.7;">
                ${options.message.replace(/\n/g, '<br>')}
            </p>
        </div>
        
        <p style="margin: 30px 0 0; font-size: 14px; color: #64748b;">
            Best regards,<br>
            <strong style="color: #334155;">${branding.name} Administration</strong>
        </p>
    `;

    return baseTemplate(branding, content, options.preheader || options.message.substring(0, 100));
};

/**
 * Payment Receipt Email Template
 */
export const paymentReceiptTemplate = async (
    options: EmailTemplateOptions & {
        studentName: string;
        amount: number;
        currency?: string;
        paymentDate: Date;
        paymentMethod: string;
        transactionId: string;
        description?: string;
        balance?: number;
    }
): Promise<string> => {
    const branding = await getSchoolBranding(options.tenantId);
    const currency = options.currency || 'ZMW';

    const content = `
        <p style="margin: 0 0 20px; font-size: 16px; color: #475569;">
            Dear <strong>${options.recipientName}</strong>,
        </p>
        
        <p style="margin: 0 0 25px; font-size: 15px; color: #475569; line-height: 1.6;">
            Thank you for your payment. This email confirms your transaction.
        </p>
        
        <!-- Receipt Card -->
        <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 12px; padding: 25px; margin: 20px 0; border: 1px solid #e2e8f0;">
            <div style="text-align: center; margin-bottom: 20px;">
                <span style="display: inline-block; background-color: #dcfce7; color: #166534; font-size: 12px; font-weight: 600; padding: 6px 12px; border-radius: 20px;">
                    ✓ PAYMENT CONFIRMED
                </span>
            </div>
            
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px dashed #e2e8f0;">
                        <span style="font-size: 13px; color: #64748b;">Student</span>
                    </td>
                    <td style="padding: 8px 0; border-bottom: 1px dashed #e2e8f0; text-align: right;">
                        <span style="font-size: 14px; color: #334155; font-weight: 600;">${options.studentName}</span>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px dashed #e2e8f0;">
                        <span style="font-size: 13px; color: #64748b;">Amount Paid</span>
                    </td>
                    <td style="padding: 8px 0; border-bottom: 1px dashed #e2e8f0; text-align: right;">
                        <span style="font-size: 18px; color: #059669; font-weight: 700;">${currency} ${options.amount.toLocaleString()}</span>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px dashed #e2e8f0;">
                        <span style="font-size: 13px; color: #64748b;">Date</span>
                    </td>
                    <td style="padding: 8px 0; border-bottom: 1px dashed #e2e8f0; text-align: right;">
                        <span style="font-size: 14px; color: #334155;">${options.paymentDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })}</span>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px dashed #e2e8f0;">
                        <span style="font-size: 13px; color: #64748b;">Method</span>
                    </td>
                    <td style="padding: 8px 0; border-bottom: 1px dashed #e2e8f0; text-align: right;">
                        <span style="font-size: 14px; color: #334155;">${options.paymentMethod}</span>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px 0;">
                        <span style="font-size: 13px; color: #64748b;">Transaction ID</span>
                    </td>
                    <td style="padding: 8px 0; text-align: right;">
                        <span style="font-size: 12px; color: #64748b; font-family: monospace; background-color: #f1f5f9; padding: 4px 8px; border-radius: 4px;">${options.transactionId}</span>
                    </td>
                </tr>
                ${options.balance !== undefined ? `
                <tr>
                    <td colspan="2" style="padding: 15px 0 0; border-top: 2px solid #e2e8f0; margin-top: 10px;">
                        <table width="100%">
                            <tr>
                                <td style="font-size: 14px; color: #64748b;">Outstanding Balance:</td>
                                <td style="text-align: right; font-size: 16px; color: ${options.balance > 0 ? '#dc2626' : '#059669'}; font-weight: 600;">
                                    ${currency} ${options.balance.toLocaleString()}
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
                ` : ''}
            </table>
        </div>
        
        ${options.description ? `
        <p style="margin: 20px 0; font-size: 14px; color: #64748b; font-style: italic;">
            Note: ${options.description}
        </p>
        ` : ''}
        
        <p style="margin: 30px 0 0; font-size: 14px; color: #64748b;">
            If you have any questions, please contact our office.
        </p>
        
        <p style="margin: 20px 0 0; font-size: 14px; color: #64748b;">
            Thank you,<br>
            <strong style="color: #334155;">${branding.name}</strong>
        </p>
    `;

    return baseTemplate(branding, content, `Payment of ${currency} ${options.amount.toLocaleString()} confirmed for ${options.studentName}`);
};

/**
 * Welcome Email Template (New Parent/User)
 */
export const welcomeEmailTemplate = async (
    options: EmailTemplateOptions & {
        email: string;
        temporaryPassword: string;
        loginUrl?: string;
        role: string;
    }
): Promise<string> => {
    const branding = await getSchoolBranding(options.tenantId);
    const loginUrl = options.loginUrl || process.env.FRONTEND_URL || 'http://localhost:5173';

    const content = `
        <p style="margin: 0 0 20px; font-size: 16px; color: #475569;">
            Dear <strong>${options.recipientName}</strong>,
        </p>
        
        <p style="margin: 0 0 25px; font-size: 15px; color: #475569; line-height: 1.6;">
            Welcome to <strong>${branding.name}</strong>! Your ${options.role.toLowerCase()} account has been created.
        </p>
        
        <!-- Credentials Card -->
        <div style="background: linear-gradient(135deg, ${branding.primaryColor}15 0%, ${branding.secondaryColor}15 100%); border-radius: 12px; padding: 25px; margin: 20px 0; border: 1px solid ${branding.primaryColor}30;">
            <h3 style="margin: 0 0 15px; font-size: 16px; color: #334155;">
                🔐 Your Login Credentials
            </h3>
            
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                    <td style="padding: 10px 0;">
                        <span style="font-size: 13px; color: #64748b;">Email:</span><br>
                        <span style="font-size: 15px; color: #334155; font-weight: 600;">${options.email}</span>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 10px 0;">
                        <span style="font-size: 13px; color: #64748b;">Temporary Password:</span><br>
                        <span style="font-size: 16px; color: #334155; font-weight: 700; font-family: monospace; background-color: #fef3c7; padding: 4px 8px; border-radius: 4px;">${options.temporaryPassword}</span>
                    </td>
                </tr>
            </table>
        </div>
        
        <!-- CTA Button -->
        <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.secondaryColor} 100%); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 40px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                Login to Your Account →
            </a>
        </div>
        
        <div style="background-color: #fef3c7; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-size: 13px; color: #92400e;">
                ⚠️ <strong>Important:</strong> Please change your password immediately after logging in for the first time.
            </p>
        </div>
        
        <p style="margin: 30px 0 0; font-size: 14px; color: #64748b;">
            Welcome aboard!<br>
            <strong style="color: #334155;">${branding.name} Team</strong>
        </p>
    `;

    return baseTemplate(branding, content, `Welcome to ${branding.name}! Your account is ready.`);
};

/**
 * Fee Reminder Email Template
 */
export const feeReminderTemplate = async (
    options: EmailTemplateOptions & {
        studentName: string;
        amount: number;
        currency?: string;
        dueDate: Date;
        feeItems?: Array<{ name: string; amount: number }>;
    }
): Promise<string> => {
    const branding = await getSchoolBranding(options.tenantId);
    const currency = options.currency || 'ZMW';
    const isOverdue = new Date() > options.dueDate;

    const content = `
        <p style="margin: 0 0 20px; font-size: 16px; color: #475569;">
            Dear <strong>${options.recipientName}</strong>,
        </p>
        
        <p style="margin: 0 0 25px; font-size: 15px; color: #475569; line-height: 1.6;">
            This is a ${isOverdue ? '<span style="color: #dc2626; font-weight: 600;">REMINDER</span>' : 'friendly reminder'} regarding pending fees for <strong>${options.studentName}</strong>.
        </p>
        
        <!-- Fee Summary Card -->
        <div style="background-color: ${isOverdue ? '#fef2f2' : '#f8fafc'}; border-radius: 12px; padding: 25px; margin: 20px 0; border: 2px solid ${isOverdue ? '#fecaca' : '#e2e8f0'};">
            <div style="text-align: center; margin-bottom: 20px;">
                <span style="font-size: 32px; font-weight: 800; color: ${isOverdue ? '#dc2626' : branding.primaryColor};">
                    ${currency} ${options.amount.toLocaleString()}
                </span>
                <p style="margin: 5px 0 0; font-size: 14px; color: ${isOverdue ? '#dc2626' : '#64748b'};">
                    ${isOverdue ? '⚠️ OVERDUE' : 'Amount Due'}
                </p>
            </div>
            
            ${options.feeItems && options.feeItems.length > 0 ? `
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 15px;">
                ${options.feeItems.map(item => `
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px dashed #e2e8f0;">
                        <span style="font-size: 14px; color: #475569;">${item.name}</span>
                    </td>
                    <td style="padding: 8px 0; border-bottom: 1px dashed #e2e8f0; text-align: right;">
                        <span style="font-size: 14px; color: #334155;">${currency} ${item.amount.toLocaleString()}</span>
                    </td>
                </tr>
                `).join('')}
            </table>
            ` : ''}
            
            <p style="margin: 15px 0 0; font-size: 14px; color: #64748b; text-align: center;">
                Due Date: <strong style="color: ${isOverdue ? '#dc2626' : '#334155'};">${options.dueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
            </p>
        </div>
        
        <p style="margin: 25px 0; font-size: 14px; color: #475569; line-height: 1.6;">
            Please ensure payment is made ${isOverdue ? 'as soon as possible' : 'before the due date'} to avoid any inconvenience. For payment options, please contact our bursar's office.
        </p>
        
        <p style="margin: 30px 0 0; font-size: 14px; color: #64748b;">
            Thank you for your cooperation.<br>
            <strong style="color: #334155;">${branding.name} Finance Department</strong>
        </p>
    `;

    return baseTemplate(branding, content, `Fee reminder for ${options.studentName}: ${currency} ${options.amount.toLocaleString()} ${isOverdue ? 'OVERDUE' : 'due'}`);
};

/**
 * Password Reset Email Template
 */
export const passwordResetTemplate = async (
    options: EmailTemplateOptions & {
        resetLink: string;
        expiresIn?: string;
    }
): Promise<string> => {
    const branding = await getSchoolBranding(options.tenantId);

    const content = `
        <p style="margin: 0 0 20px; font-size: 16px; color: #475569;">
            Dear <strong>${options.recipientName}</strong>,
        </p>
        
        <p style="margin: 0 0 25px; font-size: 15px; color: #475569; line-height: 1.6;">
            We received a request to reset your password. Click the button below to set a new password.
        </p>
        
        <!-- CTA Button -->
        <div style="text-align: center; margin: 30px 0;">
            <a href="${options.resetLink}" style="display: inline-block; background: linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.secondaryColor} 100%); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 40px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                Reset Password
            </a>
        </div>
        
        <div style="background-color: #f8fafc; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-size: 13px; color: #64748b;">
                🔒 This link will expire in ${options.expiresIn || '1 hour'}. If you didn't request this, please ignore this email.
            </p>
        </div>
        
        <p style="margin: 25px 0; font-size: 13px; color: #94a3b8;">
            If the button doesn't work, copy and paste this link:<br>
            <a href="${options.resetLink}" style="color: ${branding.primaryColor}; word-break: break-all;">${options.resetLink}</a>
        </p>
        
        <p style="margin: 30px 0 0; font-size: 14px; color: #64748b;">
            Stay secure,<br>
            <strong style="color: #334155;">${branding.name}</strong>
        </p>
    `;

    return baseTemplate(branding, content, `Reset your password for ${branding.name}`);
};

/**
 * Generic notification template
 */
export const notificationTemplate = async (
    options: EmailTemplateOptions & {
        message: string;
        ctaText?: string;
        ctaUrl?: string;
        type?: 'info' | 'warning' | 'success' | 'error';
    }
): Promise<string> => {
    const branding = await getSchoolBranding(options.tenantId);

    const typeColors = {
        info: { bg: '#eff6ff', border: '#3b82f6', icon: 'ℹ️' },
        warning: { bg: '#fef3c7', border: '#f59e0b', icon: '⚠️' },
        success: { bg: '#dcfce7', border: '#22c55e', icon: '✅' },
        error: { bg: '#fef2f2', border: '#ef4444', icon: '❌' },
    };
    const style = typeColors[options.type || 'info'];

    const content = `
        <p style="margin: 0 0 20px; font-size: 16px; color: #475569;">
            Dear <strong>${options.recipientName}</strong>,
        </p>
        
        <div style="background-color: ${style.bg}; border-left: 4px solid ${style.border}; padding: 20px; border-radius: 0 8px 8px 0; margin: 20px 0;">
            <p style="margin: 0; font-size: 15px; color: #334155; line-height: 1.7;">
                ${style.icon} ${options.message.replace(/\n/g, '<br>')}
            </p>
        </div>
        
        ${options.ctaText && options.ctaUrl ? `
        <div style="text-align: center; margin: 30px 0;">
            <a href="${options.ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.secondaryColor} 100%); color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 30px; border-radius: 8px;">
                ${options.ctaText}
            </a>
        </div>
        ` : ''}
        
        <p style="margin: 30px 0 0; font-size: 14px; color: #64748b;">
            Best regards,<br>
            <strong style="color: #334155;">${branding.name}</strong>
        </p>
    `;

    return baseTemplate(branding, content, options.message.substring(0, 100));
};

export default {
    getSchoolBranding,
    announcementTemplate,
    paymentReceiptTemplate,
    welcomeEmailTemplate,
    feeReminderTemplate,
    passwordResetTemplate,
    notificationTemplate,
};

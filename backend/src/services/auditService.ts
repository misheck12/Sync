/**
 * Audit Service for Multi-Tenant Architecture
 * Tracks all important actions for compliance and debugging
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ==========================================
// TYPES
// ==========================================

export enum AuditAction {
    CREATE = 'CREATE',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE',
    LOGIN = 'LOGIN',
    LOGOUT = 'LOGOUT',
    PAYMENT = 'PAYMENT',
    EXPORT = 'EXPORT',
    IMPORT = 'IMPORT',
    PERMISSION_CHANGE = 'PERMISSION_CHANGE',
    CONFIG_CHANGE = 'CONFIG_CHANGE',
}

export interface AuditLogEntry {
    tenantId: string;
    userId: string;
    action: AuditAction;
    entityType: string;
    entityId?: string;
    oldValue?: Record<string, any>;
    newValue?: Record<string, any>;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
}

// ==========================================
// AUDIT LOGGING FUNCTIONS
// ==========================================

/**
 * Create an audit log entry
 */
export const createAuditLog = async (entry: AuditLogEntry): Promise<void> => {
    try {
        await prisma.auditLog.create({
            data: {
                tenantId: entry.tenantId,
                userId: entry.userId,
                action: entry.action,
                entityType: entry.entityType,
                entityId: entry.entityId || null,
                oldValue: (entry.oldValue || null) as any,
                newValue: (entry.newValue || null) as any,
                metadata: (entry.metadata || null) as any,
                ipAddress: entry.ipAddress || null,
                userAgent: entry.userAgent || null,
            },
        });
    } catch (error) {
        // Log to console but don't fail the main operation
        console.error('Failed to create audit log:', error);
    }
};

/**
 * Log a CREATE action
 */
export const logCreate = async (
    tenantId: string,
    userId: string,
    entityType: string,
    entityId: string,
    newValue: Record<string, any>,
    req?: { ip?: string; headers?: { 'user-agent'?: string } }
): Promise<void> => {
    await createAuditLog({
        tenantId,
        userId,
        action: AuditAction.CREATE,
        entityType,
        entityId,
        newValue: sanitizeValue(newValue),
        ipAddress: req?.ip,
        userAgent: req?.headers?.['user-agent'],
    });
};

/**
 * Log an UPDATE action
 */
export const logUpdate = async (
    tenantId: string,
    userId: string,
    entityType: string,
    entityId: string,
    oldValue: Record<string, any>,
    newValue: Record<string, any>,
    req?: { ip?: string; headers?: { 'user-agent'?: string } }
): Promise<void> => {
    await createAuditLog({
        tenantId,
        userId,
        action: AuditAction.UPDATE,
        entityType,
        entityId,
        oldValue: sanitizeValue(oldValue),
        newValue: sanitizeValue(newValue),
        ipAddress: req?.ip,
        userAgent: req?.headers?.['user-agent'],
    });
};

/**
 * Log a DELETE action
 */
export const logDelete = async (
    tenantId: string,
    userId: string,
    entityType: string,
    entityId: string,
    oldValue: Record<string, any>,
    req?: { ip?: string; headers?: { 'user-agent'?: string } }
): Promise<void> => {
    await createAuditLog({
        tenantId,
        userId,
        action: AuditAction.DELETE,
        entityType,
        entityId,
        oldValue: sanitizeValue(oldValue),
        ipAddress: req?.ip,
        userAgent: req?.headers?.['user-agent'],
    });
};

/**
 * Log a LOGIN action
 */
export const logLogin = async (
    tenantId: string,
    userId: string,
    success: boolean,
    req?: { ip?: string; headers?: { 'user-agent'?: string } }
): Promise<void> => {
    await createAuditLog({
        tenantId,
        userId,
        action: AuditAction.LOGIN,
        entityType: 'User',
        entityId: userId,
        metadata: { success },
        ipAddress: req?.ip,
        userAgent: req?.headers?.['user-agent'],
    });
};

/**
 * Log a PAYMENT action
 */
export const logPayment = async (
    tenantId: string,
    userId: string,
    paymentId: string,
    paymentData: Record<string, any>,
    req?: { ip?: string; headers?: { 'user-agent'?: string } }
): Promise<void> => {
    await createAuditLog({
        tenantId,
        userId,
        action: AuditAction.PAYMENT,
        entityType: 'Payment',
        entityId: paymentId,
        newValue: sanitizeValue(paymentData),
        ipAddress: req?.ip,
        userAgent: req?.headers?.['user-agent'],
    });
};

/**
 * Log an EXPORT action
 */
export const logExport = async (
    tenantId: string,
    userId: string,
    exportType: string,
    recordCount: number,
    req?: { ip?: string; headers?: { 'user-agent'?: string } }
): Promise<void> => {
    await createAuditLog({
        tenantId,
        userId,
        action: AuditAction.EXPORT,
        entityType: exportType,
        metadata: { recordCount },
        ipAddress: req?.ip,
        userAgent: req?.headers?.['user-agent'],
    });
};

/**
 * Log a CONFIG_CHANGE action (settings, features, etc.)
 */
export const logConfigChange = async (
    tenantId: string,
    userId: string,
    configType: string,
    oldValue: Record<string, any>,
    newValue: Record<string, any>,
    req?: { ip?: string; headers?: { 'user-agent'?: string } }
): Promise<void> => {
    await createAuditLog({
        tenantId,
        userId,
        action: AuditAction.CONFIG_CHANGE,
        entityType: configType,
        oldValue: sanitizeValue(oldValue),
        newValue: sanitizeValue(newValue),
        ipAddress: req?.ip,
        userAgent: req?.headers?.['user-agent'],
    });
};

// ==========================================
// QUERY FUNCTIONS
// ==========================================

/**
 * Get audit logs for a tenant
 */
export const getAuditLogs = async (
    tenantId: string,
    options: {
        entityType?: string;
        entityId?: string;
        userId?: string;
        action?: AuditAction;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
        offset?: number;
    } = {}
) => {
    const { entityType, entityId, userId, action, startDate, endDate, limit = 50, offset = 0 } = options;

    const where: any = { tenantId };

    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
    }

    const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
            include: {
                user: {
                    select: {
                        fullName: true,
                        email: true,
                        role: true,
                    },
                },
            },
        }),
        prisma.auditLog.count({ where }),
    ]);

    return { logs, total, limit, offset };
};

/**
 * Get audit history for a specific entity
 */
export const getEntityHistory = async (
    tenantId: string,
    entityType: string,
    entityId: string
) => {
    return prisma.auditLog.findMany({
        where: {
            tenantId,
            entityType,
            entityId,
        },
        orderBy: { createdAt: 'desc' },
        include: {
            user: {
                select: {
                    fullName: true,
                    email: true,
                },
            },
        },
    });
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Sanitize values to remove sensitive data before logging
 */
const sanitizeValue = (value: Record<string, any>): Record<string, any> => {
    if (!value) return value;

    const sensitiveFields = [
        'password',
        'passwordHash',
        'token',
        'secret',
        'apiKey',
        'apiSecret',
        'smtpPassword',
        'smsApiSecret',
    ];

    const sanitized = { ...value };

    for (const field of sensitiveFields) {
        if (field in sanitized) {
            sanitized[field] = '[REDACTED]';
        }
    }

    return sanitized;
};

/**
 * Clean up old audit logs (retention policy)
 */
export const cleanupOldLogs = async (retentionDays: number = 365): Promise<number> => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await prisma.auditLog.deleteMany({
        where: {
            createdAt: {
                lt: cutoffDate,
            },
        },
    });

    return result.count;
};

export default {
    createAuditLog,
    logCreate,
    logUpdate,
    logDelete,
    logLogin,
    logPayment,
    logExport,
    logConfigChange,
    getAuditLogs,
    getEntityHistory,
    cleanupOldLogs,
    AuditAction,
};

import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { TenantRequest, getTenantId, handleControllerError } from '../utils/tenantContext';

const prisma = new PrismaClient();

export const getAuditLogs = async (req: TenantRequest, res: Response) => {
    try {
        const tenantId = getTenantId(req);
        const { page = '1', limit = '50', entityType, action, userId, startDate, endDate } = req.query;

        const p = parseInt(page as string);
        const l = parseInt(limit as string);
        const skip = (p - 1) * l;

        const where: any = { tenantId };

        if (entityType && entityType !== 'ALL') where.entityType = entityType;
        if (action && action !== 'ALL') where.action = action;
        if (userId && userId !== 'ALL') where.userId = userId;

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate as string);
            if (endDate) where.createdAt.lte = new Date(endDate as string);
        }

        const [logs, total] = await prisma.$transaction([
            prisma.auditLog.findMany({
                where,
                include: {
                    user: { select: { id: true, fullName: true, email: true, role: true } }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: l
            }),
            prisma.auditLog.count({ where })
        ]);

        res.json({
            data: logs,
            meta: {
                total,
                page: p,
                limit: l,
                totalPages: Math.ceil(total / l)
            }
        });

    } catch (error) {
        handleControllerError(res, error, 'getAuditLogs');
    }
};

export const getAuditFilters = async (req: TenantRequest, res: Response) => {
    try {
        const tenantId = getTenantId(req);
        // Get distinct actions/entityTypes for filters
        // Prisma distinct is useful
        const actions = await prisma.auditLog.findMany({
            where: { tenantId },
            distinct: ['action'],
            select: { action: true }
        });

        const entityTypes = await prisma.auditLog.findMany({
            where: { tenantId },
            distinct: ['entityType'],
            select: { entityType: true }
        });

        res.json({
            actions: actions.map(a => a.action),
            entityTypes: entityTypes.map(e => e.entityType)
        });
    } catch (error) {
        handleControllerError(res, error, 'getAuditFilters');
    }
};

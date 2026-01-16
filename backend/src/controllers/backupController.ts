import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { TenantRequest, getTenantId, handleControllerError, getUserId } from '../utils/tenantContext';

const prisma = new PrismaClient();

export const downloadBackup = async (req: TenantRequest, res: Response) => {
    try {
        const tenantId = getTenantId(req);
        const userId = getUserId(req);

        const snapshot = {
            timestamp: new Date().toISOString(),
            tenantId,
            students: await prisma.student.findMany({ where: { tenantId } }),
            classes: await prisma.class.findMany({ where: { tenantId } }),
            subjects: await prisma.subject.findMany({ where: { tenantId } }),
            payments: await prisma.payment.findMany({ where: { tenantId } }),
            attendance: await prisma.attendance.findMany({ where: { tenantId } }),
            academicTerms: await prisma.academicTerm.findMany({ where: { tenantId } }),
            // Don't export sensitive user auth data
            users: await prisma.user.findMany({
                where: { tenantId },
                select: { id: true, email: true, fullName: true, role: true, isActive: true }
            })
        };

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="backup-${new Date().toISOString().split('T')[0]}.json"`);
        res.send(JSON.stringify(snapshot, null, 2));

        // Log this action
        await prisma.auditLog.create({
            data: {
                tenantId,
                userId,
                action: 'BACKUP_EXPORT',
                entityType: 'SYSTEM',
                metadata: { timestamp: snapshot.timestamp }
            }
        });

    } catch (error) {
        handleControllerError(res, error, 'downloadBackup');
    }
};

import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { TenantRequest, getTenantId, handleControllerError } from '../utils/tenantContext';
import { z } from 'zod';

const prisma = new PrismaClient();

const templateSchema = z.object({
    name: z.string(),
    type: z.enum(['EMAIL', 'SMS']),
    subject: z.string().optional(),
    content: z.string(),
    variables: z.array(z.string()).optional()
});

export const getTemplates = async (req: TenantRequest, res: Response) => {
    try {
        const tenantId = getTenantId(req);
        const templates = await prisma.notificationTemplate.findMany({
            where: { tenantId },
            orderBy: { name: 'asc' }
        });
        res.json(templates);
    } catch (error) {
        handleControllerError(res, error, 'getTemplates');
    }
};

export const upsertTemplate = async (req: TenantRequest, res: Response) => {
    try {
        const tenantId = getTenantId(req);
        const { name, type, subject, content, variables } = templateSchema.parse(req.body);

        const template = await prisma.notificationTemplate.upsert({
            where: {
                tenantId_name_type: {
                    tenantId,
                    name,
                    type
                }
            },
            update: {
                subject,
                content,
                variables: variables || [],
                updatedAt: new Date()
            },
            create: {
                tenantId,
                name,
                type,
                subject,
                content,
                variables: variables || []
            }
        });

        res.json(template);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ errors: error.errors });
        }
        handleControllerError(res, error, 'upsertTemplate');
    }
};

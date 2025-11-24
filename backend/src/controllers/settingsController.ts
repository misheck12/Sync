import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const updateSettingsSchema = z.object({
  schoolName: z.string().min(2),
  schoolAddress: z.string().optional(),
  schoolPhone: z.string().optional(),
  schoolEmail: z.string().email().optional().or(z.literal('')),
  schoolWebsite: z.string().url().optional().or(z.literal('')),
  currentTermId: z.string().uuid().optional().nullable(),
  
  // SMTP
  smtpHost: z.string().optional().or(z.literal('')),
  smtpPort: z.number().optional().nullable(),
  smtpSecure: z.boolean().optional(),
  smtpUser: z.string().optional().or(z.literal('')),
  smtpPassword: z.string().optional().or(z.literal('')),
  smtpFromEmail: z.string().email().optional().or(z.literal('')),
  smtpFromName: z.string().optional().or(z.literal('')),

  // SMS
  smsProvider: z.string().optional().or(z.literal('')),
  smsApiKey: z.string().optional().or(z.literal('')),
  smsApiSecret: z.string().optional().or(z.literal('')),
  smsSenderId: z.string().optional().or(z.literal('')),
});

export const getSettings = async (req: Request, res: Response) => {
  try {
    let settings = await prisma.schoolSettings.findFirst({
      include: {
        currentTerm: true
      }
    });

    if (!settings) {
      settings = await prisma.schoolSettings.create({
        data: {
          schoolName: 'My School',
        },
        include: {
          currentTerm: true
        }
      });
    }

    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const data = updateSettingsSchema.parse(req.body);

    const existing = await prisma.schoolSettings.findFirst();

    let settings;
    if (existing) {
      settings = await prisma.schoolSettings.update({
        where: { id: existing.id },
        data,
      });
    } else {
      settings = await prisma.schoolSettings.create({
        data,
      });
    }

    res.json(settings);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    console.error('Update settings error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

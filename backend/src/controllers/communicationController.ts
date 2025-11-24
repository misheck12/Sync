import { Request, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { z } from 'zod';
import { sendEmail } from '../services/emailService';
import { broadcastNotification, createNotification } from '../services/notificationService';

const prisma = new PrismaClient();

const sendAnnouncementSchema = z.object({
  subject: z.string().min(1),
  message: z.string().min(1),
  targetRoles: z.array(z.nativeEnum(Role)).optional(), // If empty, send to all? Or require specific roles
  sendEmail: z.boolean().default(false),
  sendNotification: z.boolean().default(true),
});

export const sendAnnouncement = async (req: Request, res: Response) => {
  try {
    const { subject, message, targetRoles, sendEmail: shouldSendEmail, sendNotification } = sendAnnouncementSchema.parse(req.body);

    // 1. Find target users
    const whereClause: any = { isActive: true };
    if (targetRoles && targetRoles.length > 0) {
      whereClause.role = { in: targetRoles };
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: { id: true, email: true, fullName: true },
    });

    if (users.length === 0) {
      return res.status(404).json({ message: 'No users found for the selected roles' });
    }

    const userIds = users.map(u => u.id);
    const emails = users.map(u => u.email);

    // 2. Send Notifications
    if (sendNotification) {
      await broadcastNotification(userIds, subject, message, 'INFO');
    }

    // 3. Send Emails (Async to not block response)
    if (shouldSendEmail) {
      // Send individually or use BCC? For now, let's loop (simple but slow for large lists)
      // In production, use a queue (BullMQ)
      Promise.all(users.map(user => 
        sendEmail(user.email, subject, `<p>Dear ${user.fullName},</p><p>${message}</p>`)
      )).catch(err => console.error('Background email sending failed', err));
    }

    res.json({ message: `Announcement sent to ${users.length} users` });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    console.error('Send announcement error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMyNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;

    await prisma.notification.updateMany({
      where: { id, userId }, // Ensure ownership
      data: { isRead: true },
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update notification' });
  }
};

export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update notifications' });
  }
};

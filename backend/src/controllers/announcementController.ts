import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { TenantRequest, getTenantId, getUserId } from '../utils/tenantContext';

const prisma = new PrismaClient() as any;

// Validation schema
const createAnnouncementSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  category: z.enum(['GENERAL', 'EXAM', 'EVENT', 'HOLIDAY', 'EMERGENCY', 'ACADEMIC', 'ADMINISTRATIVE']).default('GENERAL'),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  publishAt: z.string().optional(),
  expiresAt: z.string().optional(),
  sendSMS: z.boolean().default(false),
  sendEmail: z.boolean().default(false),
  targetAudience: z.string().default('ALL'), // ALL, TEACHERS, PARENTS, STUDENTS
  classIds: z.array(z.string()).default([]),
  attachments: z.array(z.string()).default([]),
});

// Create announcement (Admin/Teacher)
export const createAnnouncement = async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);
    const data = createAnnouncementSchema.parse(req.body);

    const announcement = await prisma.announcement.create({
      data: {
        tenantId,
        createdById: userId,
        title: data.title,
        content: data.content,
        category: data.category,
        priority: data.priority,
        publishAt: data.publishAt ? new Date(data.publishAt) : null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        sendSMS: data.sendSMS,
        sendEmail: data.sendEmail,
        targetAudience: data.targetAudience,
        classIds: data.classIds,
        attachments: data.attachments,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
          }
        }
      }
    });

    // TODO: Send SMS/Email notifications if enabled
    if (data.sendSMS || data.sendEmail) {
      // Queue notification job
      console.log('Queuing notifications for announcement:', announcement.id);
    }

    res.status(201).json(announcement);
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ error: 'Failed to create announcement' });
  }
};

// Get announcements
export const getAnnouncements = async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);
    const { category, priority, unreadOnly } = req.query;

    const where: any = {
      tenantId,
      isPublished: true,
      OR: [
        { publishAt: null },
        { publishAt: { lte: new Date() } }
      ],
      AND: [
        {
          OR: [
            { expiresAt: null },
            { expiresAt: { gte: new Date() } }
          ]
        }
      ]
    };

    if (category) {
      where.category = category as string;
    }

    if (priority) {
      where.priority = priority as string;
    }

    const announcements = await prisma.announcement.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
          }
        },
        reads: {
          where: { userId },
          select: { id: true, readAt: true }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    // Filter unread if requested
    let filtered = announcements;
    if (unreadOnly === 'true') {
      filtered = announcements.filter(a => a.reads.length === 0);
    }

    // Add isRead flag
    const result = filtered.map(a => ({
      ...a,
      isRead: a.reads.length > 0,
      readAt: a.reads[0]?.readAt || null,
    }));

    res.json(result);
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
};

// Get single announcement
export const getAnnouncement = async (req: TenantRequest, res: Response) => {
  try {
    const { announcementId } = req.params;
    const userId = getUserId(req);

    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
          }
        },
        reads: {
          where: { userId },
          select: { id: true, readAt: true }
        },
        _count: {
          select: {
            reads: true,
          }
        }
      }
    });

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    res.json({
      ...announcement,
      isRead: announcement.reads.length > 0,
      readAt: announcement.reads[0]?.readAt || null,
    });
  } catch (error) {
    console.error('Get announcement error:', error);
    res.status(500).json({ error: 'Failed to fetch announcement' });
  }
};

// Mark announcement as read
export const markAsRead = async (req: TenantRequest, res: Response) => {
  try {
    const { announcementId } = req.params;
    const userId = getUserId(req);

    // Check if already read
    const existing = await prisma.announcementRead.findUnique({
      where: {
        announcementId_userId: {
          announcementId,
          userId,
        }
      }
    });

    if (existing) {
      return res.json({ success: true, alreadyRead: true });
    }

    await prisma.announcementRead.create({
      data: {
        announcementId,
        userId,
      }
    });

    res.json({ success: true, alreadyRead: false });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
};

// Get announcement stats (Admin/Teacher)
export const getAnnouncementStats = async (req: TenantRequest, res: Response) => {
  try {
    const { announcementId } = req.params;

    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId },
      include: {
        reads: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                role: true,
              }
            }
          }
        }
      }
    });

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    // Calculate stats
    const totalReads = announcement.reads.length;
    const readsByRole = announcement.reads.reduce((acc: any, read: any) => {
      const role = read.user.role;
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});

    res.json({
      totalReads,
      readsByRole,
      reads: announcement.reads,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

// Update announcement (Creator or Admin)
export const updateAnnouncement = async (req: TenantRequest, res: Response) => {
  try {
    const { announcementId } = req.params;
    const userId = getUserId(req);
    const data = createAnnouncementSchema.partial().parse(req.body);

    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId }
    });

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    // Only creator can update
    if (announcement.createdById !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this announcement' });
    }

    const updated = await prisma.announcement.update({
      where: { id: announcementId },
      data: {
        ...data,
        publishAt: data.publishAt ? new Date(data.publishAt) : undefined,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
          }
        }
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Update announcement error:', error);
    res.status(500).json({ error: 'Failed to update announcement' });
  }
};

// Delete announcement (Creator or Admin)
export const deleteAnnouncement = async (req: TenantRequest, res: Response) => {
  try {
    const { announcementId } = req.params;
    const userId = getUserId(req);

    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId }
    });

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    // Only creator can delete
    if (announcement.createdById !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this announcement' });
    }

    await prisma.announcement.delete({
      where: { id: announcementId }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
};

// Get unread count
export const getUnreadCount = async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);

    const count = await prisma.announcement.count({
      where: {
        tenantId,
        isPublished: true,
        OR: [
          { publishAt: null },
          { publishAt: { lte: new Date() } }
        ],
        AND: [
          {
            OR: [
              { expiresAt: null },
              { expiresAt: { gte: new Date() } }
            ]
          }
        ],
        reads: {
          none: {
            userId,
          }
        }
      }
    });

    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
};

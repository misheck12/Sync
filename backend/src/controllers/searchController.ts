import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { TenantRequest, getTenantId, getUserId } from '../utils/tenantContext';

const prisma = new PrismaClient() as any;

// Global search
export const globalSearch = async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const { q, type } = req.query;

    if (!q || typeof q !== 'string' || q.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const searchTerm = q.toLowerCase();
    const results: any = {
      homework: [],
      resources: [],
      forums: [],
      topics: [],
      announcements: [],
      students: [],
    };

    // Search homework
    if (!type || type === 'homework') {
      results.homework = await prisma.homework.findMany({
        where: {
          subjectContent: { tenantId },
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
            { instructions: { contains: searchTerm, mode: 'insensitive' } },
          ]
        },
        include: {
          subjectContent: {
            include: {
              class: true,
              subject: true,
            }
          }
        },
        take: 10,
      });
    }

    // Search resources
    if (!type || type === 'resources') {
      results.resources = await prisma.resource.findMany({
        where: {
          subjectContent: { tenantId },
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
          ]
        },
        include: {
          subjectContent: {
            include: {
              class: true,
              subject: true,
            }
          }
        },
        take: 10,
      });
    }

    // Search forums
    if (!type || type === 'forums') {
      results.forums = await prisma.forum.findMany({
        where: {
          tenantId,
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
          ]
        },
        include: {
          class: true,
          subject: true,
        },
        take: 10,
      });
    }

    // Search forum topics
    if (!type || type === 'topics') {
      results.topics = await prisma.forumTopic.findMany({
        where: {
          forum: { tenantId },
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { content: { contains: searchTerm, mode: 'insensitive' } },
          ]
        },
        include: {
          forum: true,
          createdBy: {
            select: {
              fullName: true,
            }
          }
        },
        take: 10,
      });
    }

    // Search announcements
    if (!type || type === 'announcements') {
      results.announcements = await prisma.announcement.findMany({
        where: {
          tenantId,
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { content: { contains: searchTerm, mode: 'insensitive' } },
          ]
        },
        include: {
          createdBy: {
            select: {
              fullName: true,
            }
          }
        },
        take: 10,
      });
    }

    // Search students (admin/teacher only)
    if (!type || type === 'students') {
      results.students = await prisma.student.findMany({
        where: {
          tenantId,
          OR: [
            { firstName: { contains: searchTerm, mode: 'insensitive' } },
            { lastName: { contains: searchTerm, mode: 'insensitive' } },
            { admissionNumber: { contains: searchTerm, mode: 'insensitive' } },
          ]
        },
        include: {
          class: true,
        },
        take: 10,
      });
    }

    // Calculate total results
    const totalResults = Object.values(results).reduce((acc: number, arr: any) => acc + arr.length, 0);

    res.json({
      query: q,
      totalResults,
      results,
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
};

// Search forums
export const searchForums = async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Search query required' });
    }

    const forums = await prisma.forum.findMany({
      where: {
        tenantId,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ]
      },
      include: {
        class: true,
        subject: true,
        _count: {
          select: {
            topics: true,
          }
        }
      },
    });

    res.json(forums);
  } catch (error) {
    console.error('Forum search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
};

// Search topics
export const searchTopics = async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const { q, forumId } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Search query required' });
    }

    const where: any = {
      forum: { tenantId },
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } },
      ]
    };

    if (forumId) {
      where.forumId = forumId;
    }

    const topics = await prisma.forumTopic.findMany({
      where,
      include: {
        forum: true,
        createdBy: {
          select: {
            fullName: true,
          }
        },
        _count: {
          select: {
            posts: true,
          }
        }
      },
    });

    res.json(topics);
  } catch (error) {
    console.error('Topic search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
};

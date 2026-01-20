import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { TenantRequest, getTenantId, getUserId, getUserRole } from '../utils/tenantContext';

const prisma = new PrismaClient() as any;

// Validation schemas
const createForumSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['GENERAL', 'SUBJECT', 'CLASS', 'QA']).default('GENERAL'),
  classId: z.string().optional(),
  subjectId: z.string().optional(),
});

const createTopicSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
});

const createPostSchema = z.object({
  content: z.string().min(1),
  parentPostId: z.string().optional(),
});

// Create forum (Teacher/Admin)
export const createForum = async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);
    const data = createForumSchema.parse(req.body);

    const forum = await prisma.forum.create({
      data: {
        tenantId,
        createdById: userId,
        ...data,
      },
      include: {
        class: true,
        subject: true,
        createdBy: {
          select: {
            id: true,
            fullName: true,
          }
        }
      }
    });

    res.status(201).json(forum);
  } catch (error) {
    console.error('Create forum error:', error);
    res.status(500).json({ error: 'Failed to create forum' });
  }
};

// Get forums
export const getForums = async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const { classId, subjectId, type } = req.query;

    const where: any = { tenantId };

    if (classId) where.classId = classId as string;
    if (subjectId) where.subjectId = subjectId as string;
    if (type) where.type = type as string;

    const forums = await prisma.forum.findMany({
      where,
      include: {
        class: true,
        subject: true,
        createdBy: {
          select: {
            id: true,
            fullName: true,
          }
        },
        _count: {
          select: {
            topics: true,
          }
        }
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    res.json(forums);
  } catch (error) {
    console.error('Get forums error:', error);
    res.status(500).json({ error: 'Failed to fetch forums' });
  }
};

// Get single forum with topics
export const getForum = async (req: TenantRequest, res: Response) => {
  try {
    const { forumId } = req.params;

    const forum = await prisma.forum.findUnique({
      where: { id: forumId },
      include: {
        class: true,
        subject: true,
        createdBy: {
          select: {
            id: true,
            fullName: true,
          }
        },
        topics: {
          include: {
            createdBy: {
              select: {
                id: true,
                fullName: true,
                profilePictureUrl: true,
              }
            },
            _count: {
              select: {
                posts: true,
              }
            }
          },
          orderBy: [
            { isPinned: 'desc' },
            { updatedAt: 'desc' }
          ]
        }
      }
    });

    if (!forum) {
      return res.status(404).json({ error: 'Forum not found' });
    }

    res.json(forum);
  } catch (error) {
    console.error('Get forum error:', error);
    res.status(500).json({ error: 'Failed to fetch forum' });
  }
};

// Create topic
export const createTopic = async (req: TenantRequest, res: Response) => {
  try {
    const { forumId } = req.params;
    const userId = getUserId(req);
    const data = createTopicSchema.parse(req.body);

    const topic = await prisma.forumTopic.create({
      data: {
        forumId,
        createdById: userId,
        ...data,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            profilePictureUrl: true,
          }
        }
      }
    });

    res.status(201).json(topic);
  } catch (error) {
    console.error('Create topic error:', error);
    res.status(500).json({ error: 'Failed to create topic' });
  }
};

// Get topic with posts
export const getTopic = async (req: TenantRequest, res: Response) => {
  try {
    const { topicId } = req.params;
    const userId = getUserId(req);

    // Increment view count
    await prisma.forumTopic.update({
      where: { id: topicId },
      data: { views: { increment: 1 } }
    });

    const topic = await prisma.forumTopic.findUnique({
      where: { id: topicId },
      include: {
        forum: {
          include: {
            class: true,
            subject: true,
          }
        },
        createdBy: {
          select: {
            id: true,
            fullName: true,
            profilePictureUrl: true,
            role: true,
          }
        },
        posts: {
          where: {
            parentPostId: null, // Only top-level posts
          },
          include: {
            createdBy: {
              select: {
                id: true,
                fullName: true,
                profilePictureUrl: true,
                role: true,
              }
            },
            replies: {
              include: {
                createdBy: {
                  select: {
                    id: true,
                    fullName: true,
                    profilePictureUrl: true,
                    role: true,
                  }
                }
              },
              orderBy: { createdAt: 'asc' }
            },
            postLikes: {
              where: { userId },
              select: { id: true }
            }
          },
          orderBy: [
            { isAnswer: 'desc' },
            { likes: 'desc' },
            { createdAt: 'asc' }
          ]
        }
      }
    });

    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    res.json(topic);
  } catch (error) {
    console.error('Get topic error:', error);
    res.status(500).json({ error: 'Failed to fetch topic' });
  }
};

// Create post (reply)
export const createPost = async (req: TenantRequest, res: Response) => {
  try {
    const { topicId } = req.params;
    const userId = getUserId(req);
    const data = createPostSchema.parse(req.body);

    const post = await prisma.forumPost.create({
      data: {
        topicId,
        createdById: userId,
        ...data,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            profilePictureUrl: true,
            role: true,
          }
        }
      }
    });

    // Update topic's updatedAt
    await prisma.forumTopic.update({
      where: { id: topicId },
      data: { updatedAt: new Date() }
    });

    res.status(201).json(post);
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
};

// Like/unlike post
export const togglePostLike = async (req: TenantRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const userId = getUserId(req);

    // Check if already liked
    const existingLike = await prisma.forumPostLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        }
      }
    });

    if (existingLike) {
      // Unlike
      await prisma.forumPostLike.delete({
        where: { id: existingLike.id }
      });

      await prisma.forumPost.update({
        where: { id: postId },
        data: { likes: { decrement: 1 } }
      });

      res.json({ liked: false });
    } else {
      // Like
      await prisma.forumPostLike.create({
        data: { postId, userId }
      });

      await prisma.forumPost.update({
        where: { id: postId },
        data: { likes: { increment: 1 } }
      });

      res.json({ liked: true });
    }
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
};

// Mark post as answer (Teacher only)
export const markAsAnswer = async (req: TenantRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const role = getUserRole(req);

    if (role !== 'TEACHER' && role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Only teachers can mark answers' });
    }

    const post = await prisma.forumPost.update({
      where: { id: postId },
      data: { isAnswer: true }
    });

    // Mark topic as resolved
    await prisma.forumTopic.update({
      where: { id: post.topicId },
      data: { isResolved: true }
    });

    res.json(post);
  } catch (error) {
    console.error('Mark answer error:', error);
    res.status(500).json({ error: 'Failed to mark as answer' });
  }
};

// Pin/unpin topic (Teacher/Admin)
export const toggleTopicPin = async (req: TenantRequest, res: Response) => {
  try {
    const { topicId } = req.params;

    const topic = await prisma.forumTopic.findUnique({
      where: { id: topicId }
    });

    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    const updated = await prisma.forumTopic.update({
      where: { id: topicId },
      data: { isPinned: !topic.isPinned }
    });

    res.json(updated);
  } catch (error) {
    console.error('Toggle pin error:', error);
    res.status(500).json({ error: 'Failed to toggle pin' });
  }
};

// Lock/unlock topic (Teacher/Admin)
export const toggleTopicLock = async (req: TenantRequest, res: Response) => {
  try {
    const { topicId } = req.params;

    const topic = await prisma.forumTopic.findUnique({
      where: { id: topicId }
    });

    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    const updated = await prisma.forumTopic.update({
      where: { id: topicId },
      data: { isLocked: !topic.isLocked }
    });

    res.json(updated);
  } catch (error) {
    console.error('Toggle lock error:', error);
    res.status(500).json({ error: 'Failed to toggle lock' });
  }
};

// Delete topic (Creator or Admin)
export const deleteTopic = async (req: TenantRequest, res: Response) => {
  try {
    const { topicId } = req.params;
    const userId = getUserId(req);
    const role = getUserRole(req);

    const topic = await prisma.forumTopic.findUnique({
      where: { id: topicId }
    });

    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    // Only creator or admin can delete
    if (topic.createdById !== userId && role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Not authorized to delete this topic' });
    }

    await prisma.forumTopic.delete({
      where: { id: topicId }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete topic error:', error);
    res.status(500).json({ error: 'Failed to delete topic' });
  }
};

// Delete post (Creator or Admin)
export const deletePost = async (req: TenantRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const userId = getUserId(req);
    const role = getUserRole(req);

    const post = await prisma.forumPost.findUnique({
      where: { id: postId }
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Only creator or admin can delete
    if (post.createdById !== userId && role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }

    await prisma.forumPost.delete({
      where: { id: postId }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
};

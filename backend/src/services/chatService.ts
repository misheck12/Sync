import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getConversationsForUser = async (userId: string) => {
  const conversations = await prisma.conversation.findMany({
    where: {
      participants: {
        some: { userId },
      },
    },
    include: {
      participants: { include: { user: { select: { id: true, fullName: true } } } },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return conversations;
};

export const getMessages = async (conversationId: string, limit = 50, skip = 0) => {
  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
    skip,
    take: limit,
  });
  return messages;
};

export const createConversation = async (userIds: string[]) => {
  // Create conversation and participants in a transaction
  const conversation = await prisma.conversation.create({
    data: {
      participants: {
        create: userIds.map((uid) => ({ userId: uid })),
      },
    },
    include: { participants: true },
  });
  return conversation;
};

export const addMessage = async (conversationId: string, senderId: string, content: string) => {
  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId,
      content,
    },
  });

  // Update conversation updatedAt
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  return message;
};

import { PrismaClient, NotificationType } from '@prisma/client';

const prisma = new PrismaClient();

export const createNotification = async (
  userId: string,
  title: string,
  message: string,
  type: NotificationType = 'INFO'
) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
      },
    });
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

export const broadcastNotification = async (
  userIds: string[],
  title: string,
  message: string,
  type: NotificationType = 'INFO'
) => {
  try {
    // Use createMany for bulk insertion
    await prisma.notification.createMany({
      data: userIds.map(userId => ({
        userId,
        title,
        message,
        type,
      })),
    });
    return true;
  } catch (error) {
    console.error('Error broadcasting notification:', error);
    return false;
  }
};

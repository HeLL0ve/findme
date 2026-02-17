import { NotificationType } from '@prisma/client';
import { prisma } from '../../config/prisma';

type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
};

export async function createNotification(input: CreateNotificationInput) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      ...(input.link ? { link: input.link } : {}),
    },
  });
}

import { NotificationType } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { sendTelegramUserNotification } from '../telegram/telegram.service';

type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
};

export async function createNotification(input: CreateNotificationInput) {
  const created = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      ...(input.link ? { link: input.link } : {}),
    },
  });

  void sendTelegramUserNotification({
    userId: input.userId,
    title: input.title,
    message: input.message,
    ...(input.link ? { link: input.link } : {}),
  });

  return created;
}

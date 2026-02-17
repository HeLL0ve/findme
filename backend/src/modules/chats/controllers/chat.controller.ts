import { NextFunction, Request, Response } from 'express';
import { prisma } from '../../../config/prisma';
import { ApiError } from '../../../shared/errors/apiError';
import { createNotification } from '../../notifications/notifications.service';

type ChatParams = { id: string };
type MessageParams = { id: string; messageId: string };

const EDIT_WINDOW_MINUTES = 15;

function isParticipant(userId: string, chat: { user1Id: string; user2Id: string }) {
  return chat.user1Id === userId || chat.user2Id === userId;
}

function canEditMessage(createdAt: Date) {
  const ms = Date.now() - createdAt.getTime();
  return ms <= EDIT_WINDOW_MINUTES * 60 * 1000;
}

export async function listChatsController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;

    const chats = await prisma.chat.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      include: {
        ad: {
          select: {
            id: true,
            petName: true,
            type: true,
            status: true,
            photos: { take: 1 },
          },
        },
        user1: { select: { id: true, name: true, email: true, avatarUrl: true } },
        user2: { select: { id: true, name: true, email: true, avatarUrl: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { sender: { select: { id: true, name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(chats);
  } catch (err) {
    return next(err);
  }
}

export async function getChatController(req: Request<ChatParams>, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const chat = await prisma.chat.findUnique({
      where: { id },
      include: {
        ad: { select: { id: true, petName: true, type: true, status: true } },
        user1: { select: { id: true, name: true, email: true, avatarUrl: true } },
        user2: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    if (!chat) return next(ApiError.notFound('Чат не найден'));
    if (!isParticipant(userId, chat)) return next(ApiError.forbidden('Недостаточно прав'));

    return res.json(chat);
  } catch (err) {
    return next(err);
  }
}

export async function createChatController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { adId, otherUserId } = req.body as { adId?: string; otherUserId?: string };

    if (!adId) return next(ApiError.validation({ adId: 'Поле adId обязательно' }));

    const ad = await prisma.ad.findUnique({ where: { id: adId } });
    if (!ad) return next(ApiError.notFound('Объявление не найдено'));

    const authorId = ad.userId;
    let writerId: string;

    if (userId === authorId) {
      if (!otherUserId) {
        return next(ApiError.validation({ otherUserId: 'Поле otherUserId обязательно для автора объявления' }));
      }
      const otherUser = await prisma.user.findUnique({ where: { id: otherUserId } });
      if (!otherUser) return next(ApiError.notFound('Пользователь не найден'));
      writerId = otherUserId;
    } else {
      writerId = userId;
    }

    if (authorId === writerId) {
      return next(ApiError.validation({ otherUserId: 'Нельзя создать чат с самим собой' }));
    }

    const existing = await prisma.chat.findFirst({
      where: { adId, user1Id: authorId, user2Id: writerId },
    });
    if (existing) return res.json(existing);

    const chat = await prisma.chat.create({
      data: {
        adId,
        user1Id: authorId,
        user2Id: writerId,
      },
    });

    return res.status(201).json(chat);
  } catch (err) {
    return next(err);
  }
}

export async function deleteChatController(req: Request<ChatParams>, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const chat = await prisma.chat.findUnique({ where: { id } });
    if (!chat) return next(ApiError.notFound('Чат не найден'));
    if (!isParticipant(userId, chat)) return next(ApiError.forbidden('Недостаточно прав'));

    await prisma.chat.delete({ where: { id } });
    return res.json({ success: true });
  } catch (err) {
    return next(err);
  }
}

export async function listMessagesController(req: Request<ChatParams>, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const chat = await prisma.chat.findUnique({ where: { id } });
    if (!chat) return next(ApiError.notFound('Чат не найден'));
    if (!isParticipant(userId, chat)) return next(ApiError.forbidden('Недостаточно прав'));

    const messages = await prisma.message.findMany({
      where: { chatId: id },
      orderBy: { createdAt: 'asc' },
      take: 300,
      include: { sender: { select: { id: true, name: true } } },
    });

    return res.json(messages);
  } catch (err) {
    return next(err);
  }
}

export async function sendMessageController(req: Request<ChatParams>, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { content } = req.body as { content?: string };

    if (!content || !content.trim()) {
      return next(ApiError.validation({ content: 'Текст сообщения обязателен' }));
    }

    const chat = await prisma.chat.findUnique({
      where: { id },
      include: { ad: { select: { id: true, petName: true } } },
    });
    if (!chat) return next(ApiError.notFound('Чат не найден'));
    if (!isParticipant(userId, chat)) return next(ApiError.forbidden('Недостаточно прав'));

    const message = await prisma.message.create({
      data: {
        chatId: id,
        senderId: userId,
        content: content.trim(),
      },
      include: { sender: { select: { id: true, name: true } } },
    });

    const recipientId = chat.user1Id === userId ? chat.user2Id : chat.user1Id;
    await createNotification({
      userId: recipientId,
      type: 'CHAT_MESSAGE',
      title: 'Новое сообщение',
      message: chat.ad.petName ? `В чате по «${chat.ad.petName}» новое сообщение.` : 'Вам пришло новое сообщение в чате.',
      link: `/chats/${chat.id}`,
    });

    return res.status(201).json(message);
  } catch (err) {
    return next(err);
  }
}

export async function editMessageController(req: Request<MessageParams>, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { id: chatId, messageId } = req.params;
    const { content } = req.body as { content?: string };

    if (!content || !content.trim()) {
      return next(ApiError.validation({ content: 'Текст сообщения обязателен' }));
    }

    const chat = await prisma.chat.findUnique({ where: { id: chatId } });
    if (!chat) return next(ApiError.notFound('Чат не найден'));
    if (!isParticipant(userId, chat)) return next(ApiError.forbidden('Недостаточно прав'));

    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message || message.chatId !== chatId) return next(ApiError.notFound('Сообщение не найдено'));
    if (message.senderId !== userId) return next(ApiError.forbidden('Редактировать можно только свои сообщения'));
    if (!canEditMessage(message.createdAt)) {
      return next(ApiError.forbidden(`Сообщение можно редактировать только в течение ${EDIT_WINDOW_MINUTES} минут`));
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: {
        content: content.trim(),
        editedAt: new Date(),
      },
      include: { sender: { select: { id: true, name: true } } },
    });

    return res.json(updated);
  } catch (err) {
    return next(err);
  }
}

export async function deleteMessageController(req: Request<MessageParams>, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { id: chatId, messageId } = req.params;

    const chat = await prisma.chat.findUnique({ where: { id: chatId } });
    if (!chat) return next(ApiError.notFound('Чат не найден'));
    if (!isParticipant(userId, chat)) return next(ApiError.forbidden('Недостаточно прав'));

    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message || message.chatId !== chatId) return next(ApiError.notFound('Сообщение не найдено'));
    if (message.senderId !== userId) return next(ApiError.forbidden('Удалять можно только свои сообщения'));

    await prisma.message.delete({ where: { id: messageId } });
    return res.json({ success: true, id: messageId });
  } catch (err) {
    return next(err);
  }
}

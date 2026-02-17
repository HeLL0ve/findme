import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../config/prisma';
import { ApiError } from '../../../shared/errors/apiError';

type ChatParams = { id: string };

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
        user1: { select: { id: true, name: true, email: true } },
        user2: { select: { id: true, name: true, email: true } },
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
        ad: {
          select: { id: true, petName: true, type: true, status: true },
        },
        user1: { select: { id: true, name: true, email: true } },
        user2: { select: { id: true, name: true, email: true } },
      },
    });

    if (!chat) return next(ApiError.notFound('Чат не найден'));
    if (chat.user1Id !== userId && chat.user2Id !== userId) return next(ApiError.forbidden('Недостаточно прав'));

    return res.json(chat);
  } catch (err) {
    return next(err);
  }
}

export async function createChatController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { adId, otherUserId } = req.body as { adId?: string; otherUserId?: string };

    if (!adId) return next(ApiError.validation('adId обязателен'));

    const ad = await prisma.ad.findUnique({ where: { id: adId } });
    if (!ad) return next(ApiError.notFound('Объявление не найдено'));

    const authorId = ad.userId;
    let writerId: string;

    if (userId === authorId) {
      if (!otherUserId) return next(ApiError.validation('otherUserId обязателен для автора объявления'));
      const other = await prisma.user.findUnique({ where: { id: otherUserId } });
      if (!other) return next(ApiError.notFound('Пользователь не найден'));
      writerId = otherUserId;
    } else {
      writerId = userId;
    }

    if (authorId === writerId) return next(ApiError.validation('Нельзя создать чат с самим собой'));

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

export async function listMessagesController(req: Request<ChatParams>, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const chat = await prisma.chat.findUnique({ where: { id } });
    if (!chat) return next(ApiError.notFound('Чат не найден'));
    if (chat.user1Id !== userId && chat.user2Id !== userId) return next(ApiError.forbidden('Недостаточно прав'));

    const messages = await prisma.message.findMany({
      where: { chatId: id },
      orderBy: { createdAt: 'asc' },
      take: 200,
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

    if (!content || !content.trim()) return next(ApiError.validation('content обязателен'));

    const chat = await prisma.chat.findUnique({ where: { id } });
    if (!chat) return next(ApiError.notFound('Чат не найден'));
    if (chat.user1Id !== userId && chat.user2Id !== userId) return next(ApiError.forbidden('Недостаточно прав'));

    const message = await prisma.message.create({
      data: {
        chatId: id,
        senderId: userId,
        content: content.trim(),
      },
      include: { sender: { select: { id: true, name: true } } },
    });

    return res.status(201).json(message);
  } catch (err) {
    return next(err);
  }
}

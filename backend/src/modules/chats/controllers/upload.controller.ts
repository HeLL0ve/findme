import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../../../shared/errors/apiError';
import { prisma } from '../../../config/prisma';
import { createNotification } from '../../notifications/notifications.service';

const uploadDir = path.resolve(process.cwd(), 'uploads', 'chat-images');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadDir),
  filename: (_req, file, callback) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    callback(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: {
    files: 1,
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    if (file.mimetype.startsWith('image/')) {
      callback(null, true);
      return;
    }
    callback(new ApiError('VALIDATION_ERROR', 'Можно загружать только изображения', 400));
  },
});

export const uploadImageMiddleware = upload.single('image');

type ChatParams = { id: string };

function isParticipant(userId: string, chat: { user1Id: string; user2Id: string }) {
  return chat.user1Id === userId || chat.user2Id === userId;
}

export async function uploadChatImageController(
  req: Request<ChatParams>,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      return next(ApiError.validation({ image: 'Не выбран файл' }));
    }

    const chat = await prisma.chat.findUnique({
      where: { id },
      include: { ad: { select: { id: true, petName: true } } },
    });

    if (!chat) return next(ApiError.notFound('Чат не найден'));
    if (!isParticipant(userId, chat)) return next(ApiError.forbidden('Недостаточно прав'));

    const imageUrl = `/uploads/chat-images/${path.basename(file.path)}`;

    const message = await prisma.message.create({
      data: {
        chatId: id,
        senderId: userId,
        content: '[Изображение]',
        imageUrl,
      },
      include: { sender: { select: { id: true, name: true } } },
    });

    const recipientId = chat.user1Id === userId ? chat.user2Id : chat.user1Id;
    await createNotification({
      userId: recipientId,
      type: 'CHAT_MESSAGE',
      title: 'Новое сообщение',
      message: chat.ad.petName
        ? `В чате по «${chat.ad.petName}» новое изображение.`
        : 'Вам пришло новое изображение в чате.',
      link: `/chats/${chat.id}`,
    });

    return res.status(201).json(message);
  } catch (err) {
    return next(err);
  }
}

import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { NextFunction, Request, Response } from 'express';
import { prisma } from '../../../config/prisma';
import { ApiError } from '../../../shared/errors/apiError';

const avatarDir = path.resolve(process.cwd(), 'uploads', 'avatars');
if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, avatarDir),
  filename: (_req, file, callback) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    callback(null, `${Date.now()}-${safeName}`);
  },
});

const avatarUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (file.mimetype.startsWith('image/')) {
      callback(null, true);
      return;
    }
    callback(new ApiError('VALIDATION_ERROR', 'Можно загружать только изображения', 400));
  },
});

export const uploadAvatarMiddleware = avatarUpload.single('avatar');

export async function uploadAvatarController(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      return next(ApiError.validation({ avatar: 'Файл не загружен' }));
    }

    const userId = req.user!.userId;
    const avatarUrl = `/uploads/avatars/${path.basename(req.file.path)}`;

    await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });

    return res.json({ avatarUrl });
  } catch (err) {
    return next(err);
  }
}

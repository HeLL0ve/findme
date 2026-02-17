import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../../../shared/errors/apiError';

const uploadDir = path.resolve(process.cwd(), 'uploads', 'ads');
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
    files: 8,
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

export const uploadMiddleware = upload.array('photos', 8);

export async function uploadPhotosController(req: Request, res: Response, next: NextFunction) {
  try {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      return next(ApiError.validation({ photos: 'Не выбраны файлы' }));
    }

    const urls = files.map((file) => `/uploads/ads/${path.basename(file.path)}`);
    return res.json({ urls });
  } catch (err) {
    return next(err);
  }
}

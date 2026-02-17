import { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { Prisma } from '@prisma/client';
import { ApiError } from '../shared/errors/apiError';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.status || 400).json({
      code: err.code,
      message: err.message,
      ...(err.details !== undefined ? { details: err.details } : {}),
    });
  }

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Файл слишком большой (максимум 5 МБ)' });
    }
    return res.status(400).json({ code: 'VALIDATION_ERROR', message: err.message });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return res.status(500).json({
      code: 'PRISMA_ERROR',
      message: 'Ошибка доступа к базе данных. Проверьте миграции Prisma.',
      details: { prismaCode: err.code },
    });
  }

  if (err instanceof Prisma.PrismaClientInitializationError) {
    return res.status(500).json({
      code: 'PRISMA_INIT_ERROR',
      message: 'Не удалось подключиться к базе данных.',
    });
  }

  if (err instanceof Error) {
    console.error(err);
    return res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера' });
  }

  console.error(err);
  return res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера' });
}

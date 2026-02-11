import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../config/prisma';
import { ApiError } from '../../../shared/errors/apiError';

export async function getProfileController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        telegramUsername: true,
        role: true,
        isBlocked: true,
        notificationSettings: { select: { notifyWeb: true, notifyTelegram: true } },
      },
    });

    if (!user) return next(ApiError.notFound('Пользователь не найден'));

    return res.json(user);
  } catch (err) {
    return next(err);
  }
}

export async function updateProfileController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { name, phone, telegramUsername, notifyWeb, notifyTelegram } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(telegramUsername !== undefined && { telegramUsername }),
        ...((notifyWeb !== undefined || notifyTelegram !== undefined) && {
          notificationSettings: {
            upsert: {
              create: {
                notifyWeb: notifyWeb ?? true,
                notifyTelegram: notifyTelegram ?? false,
              },
              update: {
                ...(notifyWeb !== undefined && { notifyWeb: !!notifyWeb }),
                ...(notifyTelegram !== undefined && { notifyTelegram: !!notifyTelegram }),
              },
            },
          },
        }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        telegramUsername: true,
        role: true,
        notificationSettings: { select: { notifyWeb: true, notifyTelegram: true } },
      },
    });

    return res.json(user);
  } catch (err) {
    return next(err);
  }
}

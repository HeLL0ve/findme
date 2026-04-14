import { NextFunction, Request, Response } from 'express';
import { prisma } from '../../config/prisma';

/**
 * Публичная статистика платформы (доступна без авторизации)
 */
export async function publicStatsController(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const [usersTotal, adsTotal, adsApproved, chatsTotal] = await Promise.all([
      prisma.user.count(),
      prisma.ad.count(),
      prisma.ad.count({ where: { status: 'APPROVED' } }),
      prisma.chat.count(),
    ]);

    return res.json({
      users: usersTotal,
      ads: adsTotal,
      foundPets: adsApproved,
      chats: chatsTotal,
    });
  } catch (err) {
    return next(err);
  }
}

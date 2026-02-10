import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../config/prisma';
import { AuthError } from '../../auth/auth.errors';

export async function getProfileController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, phone: true, telegramUsername: true, role: true, isBlocked: true },
    });

    if (!user) return next(new AuthError('USER_NOT_FOUND', 'Пользователь не найден', 404));

    return res.json(user);
  } catch (err) {
    return next(err);
  }
}

export async function updateProfileController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { name, phone, telegramUsername } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { ...(name !== undefined && { name }), ...(phone !== undefined && { phone }), ...(telegramUsername !== undefined && { telegramUsername }) },
      select: { id: true, email: true, name: true, phone: true, telegramUsername: true, role: true },
    });

    return res.json(user);
  } catch (err) {
    return next(err);
  }
}

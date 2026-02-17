import { NextFunction, Request, Response } from 'express';
import { prisma } from '../../../config/prisma';
import { ApiError } from '../../../shared/errors/apiError';

export async function getPublicUserProfileController(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        telegramUsername: true,
        createdAt: true,
      },
    });

    if (!user) return next(ApiError.notFound('Пользователь не найден'));

    const ads = await prisma.ad.findMany({
      where: {
        userId: id,
        status: { in: ['APPROVED', 'ARCHIVED'] },
      },
      select: {
        id: true,
        petName: true,
        animalType: true,
        breed: true,
        color: true,
        type: true,
        status: true,
        photos: { take: 1, select: { photoUrl: true } },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return res.json({ user, ads });
  } catch (err) {
    return next(err);
  }
}

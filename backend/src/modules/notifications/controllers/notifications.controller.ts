import { NextFunction, Request, Response } from 'express';
import { prisma } from '../../../config/prisma';
import { ApiError } from '../../../shared/errors/apiError';

type ListNotificationsQuery = {
  take?: string | string[];
  skip?: string | string[];
  unread?: string | string[];
};

function getSingleQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseBool(value: string | undefined) {
  if (!value) return undefined;
  if (value === '1' || value === 'true') return true;
  if (value === '0' || value === 'false') return false;
  return undefined;
}

export async function listNotificationsController(
  req: Request<Record<string, never>, unknown, unknown, ListNotificationsQuery>,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user!.userId;
    const take = Number(getSingleQueryValue(req.query.take) ?? 30);
    const skip = Number(getSingleQueryValue(req.query.skip) ?? 0);
    const unread = parseBool(getSingleQueryValue(req.query.unread));

    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        ...(unread !== undefined ? { isRead: unread ? false : true } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: Number.isFinite(take) ? Math.min(Math.max(take, 1), 100) : 30,
      skip: Number.isFinite(skip) ? Math.max(skip, 0) : 0,
    });

    return res.json(notifications);
  } catch (err) {
    return next(err);
  }
}

export async function unreadCountController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const unread = await prisma.notification.count({
      where: { userId, isRead: false },
    });
    return res.json({ unread });
  } catch (err) {
    return next(err);
  }
}

export async function markNotificationReadController(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) return next(ApiError.notFound('Уведомление не найдено'));
    if (notification.userId !== userId) return next(ApiError.forbidden('Недостаточно прав'));

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });

    return res.json(updated);
  } catch (err) {
    return next(err);
  }
}

export async function markAllNotificationsReadController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return res.json({ success: true });
  } catch (err) {
    return next(err);
  }
}

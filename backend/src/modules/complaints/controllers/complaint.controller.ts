import { NextFunction, Request, Response } from 'express';
import { prisma } from '../../../config/prisma';
import { ApiError } from '../../../shared/errors/apiError';
import { createNotification } from '../../notifications/notifications.service';
import { createComplaintSchema } from '../schemas/complaint.schemas';

type MyComplaintsQuery = {
  kind?: string | string[];
};

function getSingleQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function createComplaintController(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createComplaintSchema.safeParse(req.body);
    if (!parsed.success) return next(ApiError.validation(parsed.error.flatten()));

    const reporterId = req.user!.userId;
    const data = parsed.data;

    let adId: string | undefined;
    let targetUserId: string | undefined;

    if (data.kind === 'REPORT') {
      if (data.targetType === 'AD') {
        const ad = await prisma.ad.findUnique({
          where: { id: data.targetId! },
          select: { id: true, userId: true },
        });

        if (!ad) return next(ApiError.notFound('Объявление не найдено'));
        if (ad.userId === reporterId) {
          return next(ApiError.validation({ targetId: 'Нельзя пожаловаться на собственное объявление' }));
        }
        adId = ad.id;
      } else if (data.targetType === 'USER') {
        const user = await prisma.user.findUnique({
          where: { id: data.targetId! },
          select: { id: true },
        });
        if (!user) return next(ApiError.notFound('Пользователь не найден'));
        if (user.id === reporterId) {
          return next(ApiError.validation({ targetId: 'Нельзя пожаловаться на самого себя' }));
        }
        targetUserId = user.id;
      }
    }

    const existingPending = await prisma.complaint.findFirst({
      where: {
        reporterId,
        kind: data.kind,
        targetType: data.kind === 'SUPPORT' ? 'NONE' : (data.targetType as 'AD' | 'USER'),
        ...(adId ? { adId } : {}),
        ...(targetUserId ? { targetUserId } : {}),
        status: 'PENDING',
      },
    });

    if (existingPending) {
      return next(ApiError.conflict('Похожее обращение уже отправлено и находится на рассмотрении'));
    }

    const complaint = await prisma.complaint.create({
      data: {
        reporterId,
        kind: data.kind,
        targetType: data.kind === 'SUPPORT' ? 'NONE' : (data.targetType as 'AD' | 'USER'),
        ...(adId ? { adId } : {}),
        ...(targetUserId ? { targetUserId } : {}),
        reason: data.reason.trim(),
        ...(data.description ? { description: data.description.trim() } : {}),
      },
      include: {
        ad: { select: { id: true, petName: true, status: true } },
        targetUser: { select: { id: true, name: true, email: true } },
      },
    });

    await createNotification({
      userId: reporterId,
      type: 'COMPLAINT_SUBMITTED',
      title: data.kind === 'SUPPORT' ? 'Обращение отправлено' : 'Жалоба отправлена',
      message:
        data.kind === 'SUPPORT'
          ? 'Ваше обращение в поддержку отправлено администрации.'
          : 'Ваша жалоба принята и отправлена на рассмотрение администрации.',
      link: '/notifications',
    });

    return res.status(201).json(complaint);
  } catch (err) {
    return next(err);
  }
}

export async function listMyComplaintsController(
  req: Request<Record<string, never>, unknown, unknown, MyComplaintsQuery>,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user!.userId;
    const kind = getSingleQueryValue(req.query.kind);

    if (kind && !['REPORT', 'SUPPORT'].includes(kind)) {
      return next(ApiError.validation({ kind: 'Недопустимый тип обращения' }));
    }

    const complaints = await prisma.complaint.findMany({
      where: {
        reporterId: userId,
        ...(kind ? { kind: kind as 'REPORT' | 'SUPPORT' } : {}),
      },
      include: {
        ad: { select: { id: true, petName: true, status: true } },
        targetUser: { select: { id: true, name: true, email: true } },
        reviewedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return res.json(complaints);
  } catch (err) {
    return next(err);
  }
}

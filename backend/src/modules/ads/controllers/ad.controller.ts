import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../config/prisma';
import { createAdSchema, updateAdSchema } from '../schemas/ad.schemas';
import { ApiError } from '../../../shared/errors/apiError';
import { sendAdApprovedToTelegram } from '../services/telegram.service';

const PUBLIC_STATUSES = new Set(['APPROVED', 'ARCHIVED']);

function parseBool(value: unknown) {
  if (value === '1' || value === 'true' || value === true) return true;
  if (value === '0' || value === 'false' || value === false) return false;
  return undefined;
}

export async function listAdsController(req: Request, res: Response, next: NextFunction) {
  try {
    const { type, status, animalType, breed, color, city, q, userId, my, take, skip } = req.query as Record<string, string | undefined>;
    const isAdmin = req.user?.role === 'ADMIN';
    const isMy = parseBool(my);

    const where: any = {};
    if (type) where.type = type;
    if (animalType) where.animalType = { contains: animalType, mode: 'insensitive' };
    if (breed) where.breed = { contains: breed, mode: 'insensitive' };
    if (color) where.color = { contains: color, mode: 'insensitive' };
    if (city) where.location = { city: { contains: city, mode: 'insensitive' } };

    if (q) {
      where.OR = [
        { petName: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { animalType: { contains: q, mode: 'insensitive' } },
        { breed: { contains: q, mode: 'insensitive' } },
        { location: { address: { contains: q, mode: 'insensitive' } } },
        { location: { city: { contains: q, mode: 'insensitive' } } },
      ];
    }

    if (isMy) {
      if (!req.user) return next(new ApiError('UNAUTHORIZED', 'Требуется авторизация', 401));
      where.userId = req.user.userId;
    } else if (userId && isAdmin) {
      where.userId = userId;
    }

    if (status) {
      if (!isAdmin && !isMy && !PUBLIC_STATUSES.has(status)) {
        return next(ApiError.forbidden('Недоступный статус'));
      }
      where.status = status;
    } else if (!isAdmin && !isMy) {
      where.status = 'APPROVED';
    }

    const rawTake = Number(take ?? 20);
    const rawSkip = Number(skip ?? 0);
    const takeNum = Number.isFinite(rawTake) ? Math.min(Math.max(rawTake, 1), 100) : 20;
    const skipNum = Number.isFinite(rawSkip) ? Math.max(rawSkip, 0) : 0;

    const ads = await prisma.ad.findMany({
      where,
      include: {
        photos: true,
        location: true,
        user: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: takeNum,
      skip: skipNum,
    });

    return res.json(ads);
  } catch (err) {
    return next(err);
  }
}

export async function listPendingAdsController(_req: Request, res: Response, next: NextFunction) {
  try {
    const ads = await prisma.ad.findMany({
      where: { status: 'PENDING' },
      include: { photos: true, location: true, user: { select: { id: true, name: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(ads);
  } catch (err) {
    return next(err);
  }
}

export async function listMyAdsController(req: Request, res: Response, next: NextFunction) {
  try {
    const ads = await prisma.ad.findMany({
      where: { userId: req.user!.userId },
      include: { photos: true, location: true },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(ads);
  } catch (err) {
    return next(err);
  }
}

export async function getAdController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const ad = await prisma.ad.findUnique({
      where: { id },
      include: { photos: true, location: true, user: { select: { id: true, name: true, phone: true, email: true } } },
    });

    if (!ad) return next(ApiError.notFound('Объявление не найдено'));

    const isOwner = req.user?.userId === ad.userId;
    const isAdmin = req.user?.role === 'ADMIN';
    if (!isAdmin && !isOwner && !PUBLIC_STATUSES.has(ad.status)) {
      return next(ApiError.notFound('Объявление не найдено'));
    }

    return res.json(ad);
  } catch (err) {
    return next(err);
  }
}

export async function createAdController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;

    const parsed = createAdSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(ApiError.validation(parsed.error.flatten()));
    }

    const data = parsed.data;

    const ad = await prisma.ad.create({
      data: {
        userId,
        type: data.type,
        status: 'PENDING',
        petName: data.petName,
        animalType: data.animalType,
        breed: data.breed,
        color: data.color,
        description: data.description,
        ...(data.location && {
          location: {
            create: {
              address: data.location.address ?? null,
              city: data.location.city ?? null,
              latitude: data.location.latitude ?? 0,
              longitude: data.location.longitude ?? 0,
            },
          },
        }),
        ...(data.photos && data.photos.length > 0 && {
          photos: { create: data.photos.map((p: string) => ({ photoUrl: p })) },
        }),
      },
      include: { photos: true, location: true },
    });

    return res.status(201).json(ad);
  } catch (err) {
    return next(err);
  }
}

export async function updateAdController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const parsed = updateAdSchema.safeParse(req.body);
    if (!parsed.success) return next(ApiError.validation(parsed.error.flatten()));

    const existing = await prisma.ad.findUnique({ where: { id }, include: { location: true } });
    if (!existing) return next(ApiError.notFound('Объявление не найдено'));

    const isOwner = req.user?.userId === existing.userId;
    const isAdmin = req.user?.role === 'ADMIN';
    if (!isOwner && !isAdmin) return next(ApiError.forbidden('Недостаточно прав'));

    const data = parsed.data;
    if (data.status && !isAdmin && data.status !== 'ARCHIVED') {
      return next(ApiError.forbidden('Недоступное изменение статуса'));
    }

    const updateData: any = {
      ...(data.type !== undefined && { type: data.type }),
      ...(data.petName !== undefined && { petName: data.petName }),
      ...(data.animalType !== undefined && { animalType: data.animalType }),
      ...(data.breed !== undefined && { breed: data.breed }),
      ...(data.color !== undefined && { color: data.color }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.status !== undefined && { status: data.status }),
    };

    if (data.location) {
      updateData.location = {
        upsert: {
          create: {
            address: data.location.address ?? null,
            city: data.location.city ?? null,
            latitude: data.location.latitude ?? 0,
            longitude: data.location.longitude ?? 0,
          },
          update: {
            ...(data.location.address !== undefined && { address: data.location.address }),
            ...(data.location.city !== undefined && { city: data.location.city }),
            ...(data.location.latitude !== undefined && { latitude: data.location.latitude }),
            ...(data.location.longitude !== undefined && { longitude: data.location.longitude }),
          },
        },
      };
    }

    if (data.photos) {
      updateData.photos = {
        deleteMany: {},
        create: data.photos.map((p) => ({ photoUrl: p })),
      };
    }

    const ad = await prisma.ad.update({
      where: { id },
      data: updateData,
      include: { photos: true, location: true },
    });

    return res.json(ad);
  } catch (err) {
    return next(err);
  }
}

export async function markFoundController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const ad = await prisma.ad.findUnique({ where: { id } });
    if (!ad) return next(ApiError.notFound('Объявление не найдено'));

    const isOwner = req.user?.userId === ad.userId;
    const isAdmin = req.user?.role === 'ADMIN';
    if (!isOwner && !isAdmin) return next(ApiError.forbidden('Недостаточно прав'));

    const updated = await prisma.ad.update({ where: { id }, data: { status: 'ARCHIVED' } });
    return res.json(updated);
  } catch (err) {
    return next(err);
  }
}

export async function moderateAdController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { status } = req.body as { status: 'APPROVED' | 'REJECTED' | 'ARCHIVED' };

    if (!['APPROVED', 'REJECTED', 'ARCHIVED'].includes(status)) return next(ApiError.validation('Неверный статус'));

    const ad = await prisma.ad.update({ where: { id }, data: { status }, include: { photos: true, location: true, user: { select: { id: true, name: true, phone: true, email: true } } } });

    if (status === 'APPROVED') {
      await sendAdApprovedToTelegram(ad);
    }

    return res.json(ad);
  } catch (err) {
    return next(err);
  }
}

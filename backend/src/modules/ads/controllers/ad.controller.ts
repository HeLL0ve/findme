import { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../../../config/prisma';
import { createAdSchema, updateAdSchema } from '../schemas/ad.schemas';
import { ApiError } from '../../../shared/errors/apiError';
import { sendAdApprovedToTelegram } from '../services/telegram.service';

const PUBLIC_STATUSES = new Set(['APPROVED', 'ARCHIVED']);

type AdParams = { id: string };
type ListAdsQuery = {
  type?: string | string[];
  status?: string | string[];
  animalType?: string | string[];
  breed?: string | string[];
  color?: string | string[];
  city?: string | string[];
  q?: string | string[];
  userId?: string | string[];
  my?: string | string[];
  take?: string | string[];
  skip?: string | string[];
};

function getSingleQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseBool(value: unknown) {
  if (value === '1' || value === 'true' || value === true) return true;
  if (value === '0' || value === 'false' || value === false) return false;
  return undefined;
}

function normalizeNullable(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export async function listAdsController(
  req: Request<Record<string, never>, unknown, unknown, ListAdsQuery>,
  res: Response,
  next: NextFunction,
) {
  try {
    const type = getSingleQueryValue(req.query.type);
    const status = getSingleQueryValue(req.query.status);
    const animalType = getSingleQueryValue(req.query.animalType);
    const breed = getSingleQueryValue(req.query.breed);
    const color = getSingleQueryValue(req.query.color);
    const city = getSingleQueryValue(req.query.city);
    const q = getSingleQueryValue(req.query.q);
    const userId = getSingleQueryValue(req.query.userId);
    const my = getSingleQueryValue(req.query.my);
    const take = getSingleQueryValue(req.query.take);
    const skip = getSingleQueryValue(req.query.skip);
    const isAdmin = req.user?.role === 'ADMIN';
    const isMy = parseBool(my);

    const where: Prisma.AdWhereInput = {};

    if (type && (type === 'LOST' || type === 'FOUND')) {
      where.type = type;
    }
    if (animalType) {
      where.animalType = { contains: animalType, mode: 'insensitive' };
    }
    if (breed) {
      where.breed = { contains: breed, mode: 'insensitive' };
    }
    if (color) {
      where.color = { contains: color, mode: 'insensitive' };
    }
    if (city) {
      where.location = { city: { contains: city, mode: 'insensitive' } };
    }

    if (q) {
      where.OR = [
        { petName: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { animalType: { contains: q, mode: 'insensitive' } },
        { breed: { contains: q, mode: 'insensitive' } },
        { color: { contains: q, mode: 'insensitive' } },
        { location: { address: { contains: q, mode: 'insensitive' } } },
        { location: { city: { contains: q, mode: 'insensitive' } } },
      ];
    }

    if (isMy) {
      if (!req.user) {
        return next(ApiError.unauthorized());
      }
      where.userId = req.user.userId;
    } else if (userId && isAdmin) {
      where.userId = userId;
    }

    if (status) {
      if (!isAdmin && !isMy && !PUBLIC_STATUSES.has(status)) {
        return next(ApiError.forbidden('Недоступный статус'));
      }
      if (['PENDING', 'APPROVED', 'REJECTED', 'ARCHIVED'].includes(status)) {
        where.status = status as 'PENDING' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';
      }
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
        user: { select: { id: true, name: true, phone: true, avatarUrl: true } },
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
      include: {
        photos: true,
        location: true,
        user: { select: { id: true, name: true, phone: true, avatarUrl: true } },
      },
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

export async function getAdController(req: Request<AdParams>, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const ad = await prisma.ad.findUnique({
      where: { id },
      include: {
        photos: true,
        location: true,
        user: { select: { id: true, name: true, phone: true, email: true, avatarUrl: true } },
      },
    });

    if (!ad) {
      return next(ApiError.notFound('Объявление не найдено'));
    }

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
    const createData: Prisma.AdCreateInput = {
      user: { connect: { id: userId } },
      type: data.type,
      status: 'PENDING',
      description: data.description.trim(),
    };

    if (data.petName !== undefined) {
      createData.petName = normalizeNullable(data.petName);
    }
    if (data.animalType !== undefined) {
      createData.animalType = normalizeNullable(data.animalType);
    }
    if (data.breed !== undefined) {
      createData.breed = normalizeNullable(data.breed);
    }
    if (data.color !== undefined) {
      createData.color = normalizeNullable(data.color);
    }

    if (data.location) {
      createData.location = {
        create: {
          address: data.location.address !== undefined ? normalizeNullable(data.location.address) : null,
          city: data.location.city !== undefined ? normalizeNullable(data.location.city) : null,
          latitude: data.location.latitude ?? 0,
          longitude: data.location.longitude ?? 0,
        },
      };
    }

    if (data.photos && data.photos.length > 0) {
      createData.photos = { create: data.photos.map((photoUrl) => ({ photoUrl })) };
    }

    const ad = await prisma.ad.create({
      data: createData,
      include: { photos: true, location: true },
    });

    return res.status(201).json(ad);
  } catch (err) {
    return next(err);
  }
}

export async function updateAdController(req: Request<AdParams>, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const parsed = updateAdSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(ApiError.validation(parsed.error.flatten()));
    }

    const existing = await prisma.ad.findUnique({ where: { id } });
    if (!existing) {
      return next(ApiError.notFound('Объявление не найдено'));
    }

    const isOwner = req.user?.userId === existing.userId;
    const isAdmin = req.user?.role === 'ADMIN';
    if (!isOwner && !isAdmin) {
      return next(ApiError.forbidden('Недостаточно прав'));
    }

    const data = parsed.data;
    if (data.status && !isAdmin && data.status !== 'ARCHIVED') {
      return next(ApiError.forbidden('Недоступное изменение статуса'));
    }

    const updateData: Prisma.AdUpdateInput = {};

    if (data.type !== undefined) {
      updateData.type = data.type;
    }
    if (data.petName !== undefined) {
      updateData.petName = normalizeNullable(data.petName);
    }
    if (data.animalType !== undefined) {
      updateData.animalType = normalizeNullable(data.animalType);
    }
    if (data.breed !== undefined) {
      updateData.breed = normalizeNullable(data.breed);
    }
    if (data.color !== undefined) {
      updateData.color = normalizeNullable(data.color);
    }
    if (data.description !== undefined) {
      updateData.description = data.description.trim();
    }
    if (data.status !== undefined) {
      updateData.status = data.status;
    }

    if (data.location) {
      const locationUpdate: Prisma.LocationUpdateWithoutAdInput = {};
      if (data.location.address !== undefined) {
        locationUpdate.address = normalizeNullable(data.location.address);
      }
      if (data.location.city !== undefined) {
        locationUpdate.city = normalizeNullable(data.location.city);
      }
      if (data.location.latitude !== undefined) {
        locationUpdate.latitude = data.location.latitude;
      }
      if (data.location.longitude !== undefined) {
        locationUpdate.longitude = data.location.longitude;
      }

      updateData.location = {
        upsert: {
          create: {
            address: data.location.address !== undefined ? normalizeNullable(data.location.address) : null,
            city: data.location.city !== undefined ? normalizeNullable(data.location.city) : null,
            latitude: data.location.latitude ?? 0,
            longitude: data.location.longitude ?? 0,
          },
          update: locationUpdate,
        },
      };
    }

    if (data.photos) {
      updateData.photos = {
        deleteMany: {},
        create: data.photos.map((photoUrl) => ({ photoUrl })),
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

export async function markFoundController(req: Request<AdParams>, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const ad = await prisma.ad.findUnique({ where: { id } });
    if (!ad) {
      return next(ApiError.notFound('Объявление не найдено'));
    }

    const isOwner = req.user?.userId === ad.userId;
    const isAdmin = req.user?.role === 'ADMIN';
    if (!isOwner && !isAdmin) {
      return next(ApiError.forbidden('Недостаточно прав'));
    }

    const updated = await prisma.ad.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });
    return res.json(updated);
  } catch (err) {
    return next(err);
  }
}

export async function moderateAdController(req: Request<AdParams>, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { status } = req.body as { status?: 'APPROVED' | 'REJECTED' | 'ARCHIVED' };

    if (!status || !['APPROVED', 'REJECTED', 'ARCHIVED'].includes(status)) {
      return next(ApiError.validation({ status: 'Неверный статус' }));
    }

    const ad = await prisma.ad.update({
      where: { id },
      data: { status },
      include: {
        photos: true,
        location: true,
        user: { select: { id: true, name: true, phone: true, email: true, avatarUrl: true } },
      },
    });

    if (status === 'APPROVED') {
      await sendAdApprovedToTelegram(ad);
    }

    return res.json(ad);
  } catch (err) {
    return next(err);
  }
}

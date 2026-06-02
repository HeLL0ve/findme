import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { prisma } from '../../../config/prisma';
import { env } from '../../../config/env';
import { ApiError } from '../../../shared/errors/apiError';
import { createNotification } from '../../notifications/notifications.service';
import { createAdSchema, updateAdSchema } from '../schemas/ad.schemas';
import { sendAdApprovedToTelegram } from '../services/telegram.service';

const PUBLIC_STATUSES = new Set(['APPROVED', 'ARCHIVED']);

function normalizePhotoUrl(photoUrl: string) {
  if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) return photoUrl;
  const baseUrl = env.publicApiUrl.replace(/\/+$/, '');
  if (photoUrl.startsWith('/')) return `${baseUrl}${photoUrl}`;
  return `${baseUrl}/${photoUrl}`;
}

async function fetchClipSimilarity(
  source: {
    petName?: string | null;
    animalType?: string | null;
    breed?: string | null;
    color?: string | null;
    description?: string | null;
    location?: { city?: string | null; address?: string | null } | null;
    photos?: Array<{ photoUrl: string }>;
  },
  candidates: Array<{ id: string; photoUrls: string[]; description?: string | null; breed?: string | null; color?: string | null; animalType?: string | null; location?: { city?: string | null; address?: string | null } | null }>,
) {
  try {
    const response = await fetch(`${env.clipServiceUrl.replace(/\/+$/, '')}/similar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source, candidates }),
    });

    if (!response.ok) return null;

    const result = await response.json();
    if (!Array.isArray(result)) return null;
    return result as Array<{ id: string; clipScore?: number; phashDistance?: number }>;
  } catch {
    return null;
  }
}

async function fetchTextSimilarity(
  source: {
    petName?: string | null;
    animalType?: string | null;
    breed?: string | null;
    color?: string | null;
    description?: string | null;
    location?: { city?: string | null; address?: string | null; latitude?: number | null; longitude?: number | null } | null;
  },
  candidates: Array<{
    id: string;
    animalType?: string | null;
    breed?: string | null;
    color?: string | null;
    description?: string | null;
    location?: { city?: string | null; address?: string | null; latitude?: number | null; longitude?: number | null } | null;
  }>,
) {
  try {
    const response = await fetch(`${env.textServiceUrl.replace(/\/+$/, '')}/semantic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source, candidates }),
    });

    if (!response.ok) return null;

    const result = await response.json();
    if (!Array.isArray(result)) return null;
    return result as Array<{ id: string; semanticScore?: number; distanceKm?: number }>;
  } catch {
    return null;
  }
}

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
  since?: string | string[]; // 'week' | 'month'
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

function getPhotoHash(photoUrl: string) {
  return crypto.createHash('sha256').update(photoUrl).digest('hex');
}

function mapPhotoCreateData(photoUrls: string[]) {
  return photoUrls.map((photoUrl) => ({
    photoUrl,
    photoHash: getPhotoHash(photoUrl),
  }));
}

function normalizeText(value?: string | null) {
  return value?.trim().toLowerCase() ?? '';
}

function extractKeywords(text: string) {
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .split(/[^а-яa-z0-9]+/gi)
        .filter((word) => word.length >= 3),
    ),
  );
}

function countSharedKeywords(source: string[], target: string[]) {
  const set = new Set(target);
  return source.reduce((count, word) => (set.has(word) ? count + 1 : count), 0);
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
    const since = getSingleQueryValue(req.query.since);
    const isAdmin = req.user?.role === 'ADMIN';
    const isMy = parseBool(my);

    const where: Prisma.AdWhereInput = {};

    if (type && (type === 'LOST' || type === 'FOUND')) where.type = type;
    if (animalType) where.animalType = { contains: animalType, mode: 'insensitive' };
    if (breed) where.breed = { contains: breed, mode: 'insensitive' };
    if (color) where.color = { contains: color, mode: 'insensitive' };
    if (city) where.location = { city: { contains: city, mode: 'insensitive' } };

    if (since === 'week') {
      where.createdAt = { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
    } else if (since === 'month') {
      where.createdAt = { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
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
      if (!req.user) return next(ApiError.unauthorized());
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

    if (!ad) return next(ApiError.notFound('Объявление не найдено'));

    const isOwner = req.user?.userId === ad.userId;
    const isAdmin = req.user?.role === 'ADMIN';
    if (!isAdmin && !isOwner && !PUBLIC_STATUSES.has(ad.status)) {
      return next(ApiError.notFound('Объявление не найдено'));
    }

    // Increment views (fire-and-forget, don't block response)
    void prisma.ad.update({ where: { id }, data: { views: { increment: 1 } } }).catch(() => {});

    return res.json(ad);
  } catch (err) {
    return next(err);
  }
}

export async function getSimilarAdsController(
  req: Request<AdParams, unknown, unknown, { take?: string | string[] }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;
    const take = Number(getSingleQueryValue(req.query.take) ?? 6);
    const takeNum = Number.isFinite(take) ? Math.min(Math.max(take, 1), 20) : 6;

    const ad = await prisma.ad.findUnique({
      where: { id },
      include: { photos: true, location: true },
    });

    if (!ad) return next(ApiError.notFound('Объявление не найдено'));

    const isOwner = req.user?.userId === ad.userId;
    const isAdmin = req.user?.role === 'ADMIN';
    if (!isOwner && !isAdmin && !PUBLIC_STATUSES.has(ad.status)) {
      return next(ApiError.forbidden('Недостаточно прав'));
    }

    const oppositeType = ad.type === 'LOST' ? 'FOUND' : 'LOST';
    const sourceCity = normalizeText(ad.location?.city);
    const sourceBreed = normalizeText(ad.breed);
    const sourceType = normalizeText(ad.animalType);
    const sourceColor = normalizeText(ad.color);
    const sourceAddress = normalizeText(ad.location?.address);
    const sourceDescription = normalizeText(ad.description);
    const sourceDescriptionKeywords = extractKeywords(sourceDescription);

    const searchFilters: Prisma.AdWhereInput[] = [];
    if (ad.petName) searchFilters.push({ petName: { contains: ad.petName, mode: 'insensitive' } });
    if (ad.animalType) searchFilters.push({ animalType: { contains: ad.animalType, mode: 'insensitive' } });
    if (ad.breed) searchFilters.push({ breed: { contains: ad.breed, mode: 'insensitive' } });
    if (ad.color) searchFilters.push({ color: { contains: ad.color, mode: 'insensitive' } });
    if (ad.location?.city) searchFilters.push({ location: { city: { contains: ad.location.city, mode: 'insensitive' } } });
    if (ad.location?.address) searchFilters.push({ location: { address: { contains: ad.location.address, mode: 'insensitive' } } });
    if (ad.description) searchFilters.push({ description: { contains: ad.description, mode: 'insensitive' } });

    const candidates = await prisma.ad.findMany({
      where: {
        type: oppositeType,
        status: 'APPROVED',
        id: { not: id },
        ...(searchFilters.length > 0 ? { OR: searchFilters } : {}),
        // Если у источника указан тип животного — берём только тех же
        ...(ad.animalType ? { animalType: { equals: ad.animalType, mode: 'insensitive' } } : {}),
      },
      include: { photos: true, location: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const clipCandidates = candidates.map((candidate) => ({
      id: candidate.id,
      animalType: candidate.animalType,
      breed: candidate.breed,
      color: candidate.color,
      description: candidate.description,
      location: { city: candidate.location?.city, address: candidate.location?.address },
      photoUrls: candidate.photos.map((photo) => normalizePhotoUrl(photo.photoUrl)),
    }));

    const clipScores = await fetchClipSimilarity(
      {
        petName: ad.petName,
        animalType: ad.animalType,
        breed: ad.breed,
        color: ad.color,
        description: ad.description,
        location: { city: ad.location?.city, address: ad.location?.address },
        photos: ad.photos.map((photo) => ({ photoUrl: normalizePhotoUrl(photo.photoUrl) })),
      },
      clipCandidates,
    );

    const clipScoreMap = new Map<string, { clipScore?: number; phashDistance?: number }>(
      clipScores?.map((item) => [item.id, { clipScore: item.clipScore, phashDistance: item.phashDistance }]) ?? [],
    );

    const textCandidates = candidates.map((candidate) => ({
      id: candidate.id,
      animalType: candidate.animalType,
      breed: candidate.breed,
      color: candidate.color,
      description: candidate.description,
      location: {
        city: candidate.location?.city,
        address: candidate.location?.address,
        latitude: candidate.location?.latitude ?? null,
        longitude: candidate.location?.longitude ?? null,
      },
    }));

    const textScores = await fetchTextSimilarity(
      {
        petName: ad.petName,
        animalType: ad.animalType,
        breed: ad.breed,
        color: ad.color,
        description: ad.description,
        location: {
          city: ad.location?.city,
          address: ad.location?.address,
          latitude: ad.location?.latitude ?? null,
          longitude: ad.location?.longitude ?? null,
        },
      },
      textCandidates,
    );

    const textScoreMap = new Map<string, { semanticScore?: number; distanceKm?: number }>(
      textScores?.map((item) => [item.id, { semanticScore: item.semanticScore, distanceKm: item.distanceKm }]) ?? [],
    );

    const scoredAds = await Promise.all(
      candidates.map(async (candidate) => {
        let score = 0;
        const candidateCity = normalizeText(candidate.location?.city);
        const candidateBreed = normalizeText(candidate.breed);
        const candidateType = normalizeText(candidate.animalType);
        const candidateColor = normalizeText(candidate.color);
        const candidateAddress = normalizeText(candidate.location?.address);
        const candidateDescription = normalizeText(candidate.description);
        const candidateDescriptionKeywords = extractKeywords(candidateDescription);

        if (sourceType && candidateType && sourceType === candidateType) score += 20;
        if (sourceBreed && candidateBreed && sourceBreed === candidateBreed) score += 20;
        if (sourceColor && candidateColor && sourceColor === candidateColor) score += 10;
        if (sourceCity && candidateCity && sourceCity === candidateCity) score += 20;
        if (sourceAddress && candidateAddress && sourceAddress === candidateAddress) score += 15;
        if (sourceAddress && candidateAddress && (sourceAddress.includes(candidateAddress) || candidateAddress.includes(sourceAddress))) score += 10;

        if (ad.photos.length > 0 && candidate.photos.length > 0) {
          const sourceHashes = new Set(ad.photos.map((photo) => photo.photoHash).filter(Boolean));
          const candidateHashes = new Set(candidate.photos.map((photo) => photo.photoHash).filter(Boolean));
          const sharedHashes = Array.from(sourceHashes).filter((hash) => hash && candidateHashes.has(hash));
          if (sharedHashes.length > 0) score += 40;
        }

        const sharedWords = countSharedKeywords(sourceDescriptionKeywords, candidateDescriptionKeywords);
        score += Math.min(sharedWords, 10) * 4;

        const nameMatch = ad.petName && candidate.petName && normalizeText(ad.petName) === normalizeText(candidate.petName);
        if (nameMatch) score += 10;

        const external = clipScoreMap.get(candidate.id);
        const semantic = textScoreMap.get(candidate.id);
        if (external?.phashDistance !== undefined && external.phashDistance <= 12) score += 18;
        if (external?.clipScore !== undefined) score += Math.round(external.clipScore * 30 + 4);
        if (semantic?.semanticScore !== undefined) score += Math.round(semantic.semanticScore * 30 + 5);
        if (semantic?.distanceKm !== undefined) score += Math.max(0, 12 - Math.round(semantic.distanceKm / 5));

        console.log(`[BACKEND] Ad ${candidate.id}:`, {
          sourceType,
          candidateType,
          baseScore: score - (external?.clipScore ? Math.round(external.clipScore * 30 + 4) : 0) - (semantic?.semanticScore ? Math.round(semantic.semanticScore * 30 + 5) : 0),
          clipScore: external?.clipScore,
          semanticScore: semantic?.semanticScore,
          finalScore: score
        });

        return { ad: candidate, score };
      }),
    );

    const filteredAds = scoredAds.filter((item) => item.score > 5);

    const result = filteredAds
      .sort((left, right) => right.score - left.score)
      .slice(0, takeNum)
      .map((item) => ({ ...item.ad, similarityScore: item.score }));

    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

export async function createAdController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;

    const parsed = createAdSchema.safeParse(req.body);
    if (!parsed.success) return next(ApiError.validation(parsed.error.flatten()));

    const data = parsed.data;
    const createData: Prisma.AdCreateInput = {
      user: { connect: { id: userId } },
      type: data.type,
      status: 'PENDING',
      description: data.description.trim(),
    };

    if (data.petName !== undefined) createData.petName = normalizeNullable(data.petName);
    if (data.animalType !== undefined) createData.animalType = normalizeNullable(data.animalType);
    if (data.breed !== undefined) createData.breed = normalizeNullable(data.breed);
    if (data.color !== undefined) createData.color = normalizeNullable(data.color);

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
      createData.photos = { create: mapPhotoCreateData(data.photos) };
    }

    const ad = await prisma.ad.create({
      data: createData,
      include: { photos: true, location: true },
    });

    await createNotification({
      userId,
      type: 'AD_MODERATION_SUBMITTED',
      title: 'Объявление отправлено на модерацию',
      message: `Объявление ${ad.petName ? `«${ad.petName}»` : ''} принято и ожидает проверки.`,
      link: `/ads/${ad.id}`,
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
    if (!parsed.success) return next(ApiError.validation(parsed.error.flatten()));

    const existing = await prisma.ad.findUnique({ where: { id } });
    if (!existing) return next(ApiError.notFound('Объявление не найдено'));

    const isOwner = req.user?.userId === existing.userId;
    const isAdmin = req.user?.role === 'ADMIN';
    if (!isOwner && !isAdmin) return next(ApiError.forbidden('Недостаточно прав'));

    const data = parsed.data;
    if (data.status && !isAdmin && data.status !== 'ARCHIVED') {
      return next(ApiError.forbidden('Недоступное изменение статуса'));
    }

    const updateData: Prisma.AdUpdateInput = {};
    if (data.type !== undefined) updateData.type = data.type;
    if (data.petName !== undefined) updateData.petName = normalizeNullable(data.petName);
    if (data.animalType !== undefined) updateData.animalType = normalizeNullable(data.animalType);
    if (data.breed !== undefined) updateData.breed = normalizeNullable(data.breed);
    if (data.color !== undefined) updateData.color = normalizeNullable(data.color);
    if (data.description !== undefined) updateData.description = data.description.trim();
    if (data.status !== undefined) updateData.status = data.status;

    // Если пользователь (не админ) редактирует одобренное объявление, отправляем его на модерацию
    const isContentUpdate = data.type !== undefined || data.petName !== undefined || 
                           data.animalType !== undefined || data.breed !== undefined || 
                           data.color !== undefined || data.description !== undefined || 
                           data.location !== undefined || data.photos !== undefined;
    
    if (isOwner && !isAdmin && existing.status === 'APPROVED' && isContentUpdate) {
      updateData.status = 'PENDING';
    }

    if (data.location) {
      const locationUpdate: Prisma.LocationUpdateWithoutAdInput = {};
      if (data.location.address !== undefined) locationUpdate.address = normalizeNullable(data.location.address);
      if (data.location.city !== undefined) locationUpdate.city = normalizeNullable(data.location.city);
      if (data.location.latitude !== undefined) locationUpdate.latitude = data.location.latitude;
      if (data.location.longitude !== undefined) locationUpdate.longitude = data.location.longitude;

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
        create: mapPhotoCreateData(data.photos),
      };
    }

    const ad = await prisma.ad.update({
      where: { id },
      data: updateData,
      include: {
        photos: true,
        location: true,
        user: { select: { id: true, name: true, phone: true, email: true, avatarUrl: true } },
      },
    });

    // Уведомления
    if (isOwner && !isAdmin && existing.status === 'APPROVED' && isContentUpdate && ad.status === 'PENDING') {
      await createNotification({
        userId: ad.userId,
        type: 'AD_MODERATION_SUBMITTED',
        title: 'Объявление отправлено на модерацию',
        message: `Объявление ${ad.petName ? `«${ad.petName}»` : ''} изменено и отправлено на повторную модерацию.`,
        link: `/ads/${ad.id}`,
      });
    }

    const restoredFromArchive = existing.status === 'ARCHIVED' && ad.status === 'APPROVED';
    if (restoredFromArchive) {
      const telegramResult = await sendAdApprovedToTelegram(ad);
      if (!telegramResult.ok) {
        console.warn('[ads] restored ad was not published to telegram', {
          adId: ad.id,
          skipped: telegramResult.skipped,
          error: telegramResult.error,
        });
      }
    }

    return res.json(ad);
  } catch (err) {
    return next(err);
  }
}

export async function markFoundController(req: Request<AdParams>, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const ad = await prisma.ad.findUnique({ where: { id } });
    if (!ad) return next(ApiError.notFound('Объявление не найдено'));

    const isOwner = req.user?.userId === ad.userId;
    const isAdmin = req.user?.role === 'ADMIN';
    if (!isOwner && !isAdmin) return next(ApiError.forbidden('Недостаточно прав'));

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
    const { status, reason } = req.body as { status?: 'APPROVED' | 'REJECTED' | 'ARCHIVED'; reason?: string };

    if (!status || !['APPROVED', 'REJECTED', 'ARCHIVED'].includes(status)) {
      return next(ApiError.validation({ status: 'Неверный статус' }));
    }

    if (status === 'REJECTED' && (!reason || !reason.trim())) {
      return next(ApiError.validation({ reason: 'Укажите причину отклонения' }));
    }

    const ad = await prisma.ad.findUnique({
      where: { id },
      include: {
        photos: true,
        location: true,
        user: { select: { id: true, name: true, phone: true, email: true, avatarUrl: true } },
      },
    });

    if (!ad) return next(ApiError.notFound('Объявление не найдено'));

    if (status === 'REJECTED') {
      await createNotification({
        userId: ad.userId,
        type: 'AD_REJECTED',
        title: 'Объявление отклонено',
        message: `Объявление ${ad.petName ? `«${ad.petName}» ` : ''}отклонено. Причина: ${reason!.trim()}`,
      });

      const updatedAd = await prisma.ad.update({
        where: { id },
        data: { status: 'REJECTED' },
        include: {
          photos: true,
          location: true,
          user: { select: { id: true, name: true, phone: true, email: true, avatarUrl: true } },
        },
      });

      return res.json(updatedAd);
    }

    const updatedAd = await prisma.ad.update({
      where: { id },
      data: { status },
      include: {
        photos: true,
        location: true,
        user: { select: { id: true, name: true, phone: true, email: true, avatarUrl: true } },
      },
    });

    if (status === 'APPROVED') {
      const telegramResult = await sendAdApprovedToTelegram(updatedAd);
      if (!telegramResult.ok) {
        console.warn('[ads] approved ad was not published to telegram', {
          adId: updatedAd.id,
          skipped: telegramResult.skipped,
          error: telegramResult.error,
        });
      }

      await createNotification({
        userId: updatedAd.userId,
        type: 'AD_APPROVED',
        title: 'Объявление одобрено',
        message: `Ваше объявление ${updatedAd.petName ? `«${updatedAd.petName}»` : ''} опубликовано.`,
        link: `/ads/${updatedAd.id}`,
      });
    }

    return res.json(updatedAd);
  } catch (err) {
    return next(err);
  }
}

export async function deleteAdController(req: Request<AdParams>, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const ad = await prisma.ad.findUnique({ where: { id } });
    
    if (!ad) return next(ApiError.notFound('Объявление не найдено'));

    const isOwner = req.user?.userId === ad.userId;
    const isAdmin = req.user?.role === 'ADMIN';
    if (!isOwner && !isAdmin) return next(ApiError.forbidden('Недостаточно прав'));

    await prisma.ad.delete({ where: { id } });
    
    return res.json({ deleted: true, id });
  } catch (err) {
    return next(err);
  }
}

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../config/prisma';
import { createAdSchema } from '../schemas/ad.schemas';

export async function listAdsController(req: Request, res: Response, next: NextFunction) {
  try {
    const { type, status, animalType, q } = req.query as any;

    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (animalType) where.animalType = animalType;
    if (q) where.OR = [{ petName: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }];

    const ads = await prisma.ad.findMany({ where, include: { photos: true, user: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' } });

    return res.json(ads);
  } catch (err) {
    return next(err);
  }
}

export async function getAdController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const ad = await prisma.ad.findUnique({ where: { id }, include: { photos: true, location: true, user: { select: { id: true, name: true, phone: true } } } });
    if (!ad) return res.status(404).json({ code: 'NOT_FOUND' });
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
      return res.status(400).json({ code: 'VALIDATION_ERROR', details: parsed.error.flatten() });
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
        ...(data.location && { location: { create: { address: data.location.address ?? null, latitude: data.location.latitude ?? 0, longitude: data.location.longitude ?? 0 } } }),
        ...(data.photos && data.photos.length > 0 && { photos: { create: data.photos.map((p: string) => ({ photoUrl: p })) } }),
      },
      include: { photos: true, location: true },
    });

    return res.status(201).json(ad);
  } catch (err) {
    return next(err);
  }
}

export async function moderateAdController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { status } = req.body as { status: 'APPROVED' | 'REJECTED' | 'ARCHIVED' };

    if (!['APPROVED', 'REJECTED', 'ARCHIVED'].includes(status)) return res.status(400).json({ code: 'INVALID_STATUS' });

    const ad = await prisma.ad.update({ where: { id }, data: { status } });

    return res.json(ad);
  } catch (err) {
    return next(err);
  }
}

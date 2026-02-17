import { NextFunction, Request, Response } from 'express';
import { prisma } from '../../../config/prisma';
import { ApiError } from '../../../shared/errors/apiError';
import { reviewComplaintSchema } from '../../complaints/schemas/complaint.schemas';

type ComplaintQuery = {
  status?: string | string[];
};

function getSingleQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function listComplaintsController(
  req: Request<Record<string, never>, unknown, unknown, ComplaintQuery>,
  res: Response,
  next: NextFunction,
) {
  try {
    const status = getSingleQueryValue(req.query.status);
    if (status && !['PENDING', 'RESOLVED', 'REJECTED'].includes(status)) {
      return next(ApiError.validation({ status: 'Недопустимый статус' }));
    }

    const query: Parameters<typeof prisma.complaint.findMany>[0] = {
      include: {
        reporter: { select: { id: true, name: true, email: true, avatarUrl: true } },
        ad: { select: { id: true, petName: true, type: true, status: true, userId: true } },
        targetUser: { select: { id: true, name: true, email: true, avatarUrl: true } },
        reviewedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    };
    if (status) {
      query.where = { status: status as 'PENDING' | 'RESOLVED' | 'REJECTED' };
    }

    const complaints = await prisma.complaint.findMany(query);

    return res.json(complaints);
  } catch (err) {
    return next(err);
  }
}

export async function reviewComplaintController(req: Request<{ id: string }>, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const parsed = reviewComplaintSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(ApiError.validation(parsed.error.flatten()));
    }

    const complaint = await prisma.complaint.findUnique({ where: { id } });
    if (!complaint) {
      return next(ApiError.notFound('Жалоба не найдена'));
    }

    const reviewed = await prisma.complaint.update({
      where: { id },
      data: {
        status: parsed.data.status,
        reviewComment: parsed.data.reviewComment?.trim() || null,
        reviewedById: req.user!.userId,
        reviewedAt: new Date(),
      },
      include: {
        reporter: { select: { id: true, name: true, email: true, avatarUrl: true } },
        ad: { select: { id: true, petName: true, type: true, status: true, userId: true } },
        targetUser: { select: { id: true, name: true, email: true, avatarUrl: true } },
        reviewedBy: { select: { id: true, name: true, email: true } },
      },
    });

    return res.json(reviewed);
  } catch (err) {
    return next(err);
  }
}

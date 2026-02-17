import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../config/prisma';

export async function adminStatsController(_req: Request, res: Response, next: NextFunction) {
  try {
    const [
      usersTotal,
      usersBlocked,
      adsTotal,
      adsPending,
      adsApproved,
      adsRejected,
      adsArchived,
      chatsTotal,
      messagesTotal,
      complaintsTotal,
      complaintsPending,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isBlocked: true } }),
      prisma.ad.count(),
      prisma.ad.count({ where: { status: 'PENDING' } }),
      prisma.ad.count({ where: { status: 'APPROVED' } }),
      prisma.ad.count({ where: { status: 'REJECTED' } }),
      prisma.ad.count({ where: { status: 'ARCHIVED' } }),
      prisma.chat.count(),
      prisma.message.count(),
      prisma.complaint.count(),
      prisma.complaint.count({ where: { status: 'PENDING' } }),
    ]);

    return res.json({
      users: { total: usersTotal, blocked: usersBlocked },
      ads: {
        total: adsTotal,
        pending: adsPending,
        approved: adsApproved,
        rejected: adsRejected,
        archived: adsArchived,
      },
      chats: { total: chatsTotal, messages: messagesTotal },
      complaints: { total: complaintsTotal, pending: complaintsPending },
    });
  } catch (err) {
    return next(err);
  }
}

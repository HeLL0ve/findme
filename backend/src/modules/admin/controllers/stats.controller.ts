import { NextFunction, Request, Response } from 'express';
import { prisma } from '../../../config/prisma';

type StatsRange = 'today' | 'week' | 'month' | 'quarter';
type StatsQuery = { range?: string | string[] };

type TimelinePoint = {
  date: string;
  label: string;
  users: number;
  ads: number;
  messages: number;
  complaints: number;
};

function getSingleQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeRange(value: string | undefined): StatsRange {
  if (value === 'today' || value === 'week' || value === 'month' || value === 'quarter') return value;
  return 'week';
}

function startOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

async function buildDailyTimeline(days: number): Promise<TimelinePoint[]> {
  const now = new Date();
  const start = startOfDay(now);

  const points = Array.from({ length: days }, (_, index) => {
    const pointStart = new Date(start);
    pointStart.setDate(start.getDate() - (days - 1 - index));
    const pointEnd = new Date(pointStart);
    pointEnd.setDate(pointStart.getDate() + 1);
    return { pointStart, pointEnd };
  });

  return Promise.all(
    points.map(async ({ pointStart, pointEnd }) => {
      const [users, ads, messages, complaints] = await Promise.all([
        prisma.user.count({ where: { createdAt: { gte: pointStart, lt: pointEnd } } }),
        prisma.ad.count({ where: { createdAt: { gte: pointStart, lt: pointEnd } } }),
        prisma.message.count({ where: { createdAt: { gte: pointStart, lt: pointEnd } } }),
        prisma.complaint.count({ where: { createdAt: { gte: pointStart, lt: pointEnd } } }),
      ]);

      return {
        date: pointStart.toISOString(),
        label: pointStart.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
        users,
        ads,
        messages,
        complaints,
      };
    }),
  );
}

async function buildHourlyTimelineForToday(): Promise<TimelinePoint[]> {
  const start = startOfDay(new Date());

  const points = Array.from({ length: 24 }, (_, hour) => {
    const pointStart = new Date(start);
    pointStart.setHours(hour, 0, 0, 0);
    const pointEnd = new Date(pointStart);
    pointEnd.setHours(hour + 1, 0, 0, 0);
    return { hour, pointStart, pointEnd };
  });

  return Promise.all(
    points.map(async ({ hour, pointStart, pointEnd }) => {
      const [users, ads, messages, complaints] = await Promise.all([
        prisma.user.count({ where: { createdAt: { gte: pointStart, lt: pointEnd } } }),
        prisma.ad.count({ where: { createdAt: { gte: pointStart, lt: pointEnd } } }),
        prisma.message.count({ where: { createdAt: { gte: pointStart, lt: pointEnd } } }),
        prisma.complaint.count({ where: { createdAt: { gte: pointStart, lt: pointEnd } } }),
      ]);

      return {
        date: pointStart.toISOString(),
        label: `${String(hour).padStart(2, '0')}:00`,
        users,
        ads,
        messages,
        complaints,
      };
    }),
  );
}

export async function adminStatsController(
  req: Request<Record<string, never>, unknown, unknown, StatsQuery>,
  res: Response,
  next: NextFunction,
) {
  try {
    const range = normalizeRange(getSingleQueryValue(req.query.range));

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

    const timeline =
      range === 'today'
        ? await buildHourlyTimelineForToday()
        : await buildDailyTimeline(range === 'week' ? 7 : range === 'month' ? 30 : 90);

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
      range,
      timeline,
    });
  } catch (err) {
    return next(err);
  }
}

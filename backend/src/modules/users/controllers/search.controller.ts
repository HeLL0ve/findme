import { Request, Response } from 'express';
import { prisma } from '../../../prisma/client';

export const searchController = {
  async searchUsers(req: Request, res: Response) {
    try {
      const { query, limit = 20, skip = 0 } = req.query;

      if (!query || typeof query !== 'string' || query.trim().length < 2) {
        return res.json({ users: [], total: 0 });
      }

      const searchQuery = `%${query.trim()}%`;

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where: {
            OR: [
              { name: { contains: query.toString(), mode: 'insensitive' } },
              { email: { contains: query.toString(), mode: 'insensitive' } },
            ],
            isBlocked: false,
          },
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            createdAt: true,
          },
          skip: Number(skip) || 0,
          take: Math.min(Number(limit) || 20, 100),
          orderBy: { createdAt: 'desc' },
        }),
        prisma.user.count({
          where: {
            OR: [
              { name: { contains: query.toString(), mode: 'insensitive' } },
              { email: { contains: query.toString(), mode: 'insensitive' } },
            ],
            isBlocked: false,
          },
        }),
      ]);

      res.json({ users, total });
    } catch (error) {
      console.error('Error searching users:', error);
      res.status(500).json({ error: 'Failed to search users' });
    }
  },
};

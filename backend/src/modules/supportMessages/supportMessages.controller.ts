import { Request, Response } from 'express';
import { prisma } from '../../prisma/client';

export const supportMessagesController = {
  async getAdminChatMessages(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const messages = await prisma.supportMessage.findMany({
        where: { userId },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
        take: 50,
      });

      res.json({ messages });
    } catch (error) {
      console.error('Error fetching admin chat messages:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  },

  async sendMessageToAdmin(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const { text } = req.body;
      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return res.status(400).json({ error: 'Message text is required' });
      }

      const message = await prisma.supportMessage.create({
        data: {
          userId,
          senderId: userId,
          text: text.trim(),
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              role: true,
            },
          },
        },
      });

      // TODO: Notify admins via WebSocket
      // wsServer.broadcastToAdmins({
      //   type: 'new-user-message',
      //   data: message,
      // });

      res.status(201).json(message);
    } catch (error) {
      console.error('Error sending message to admin:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  },

  // Admin endpoint to get all support messages
  async getAllSupportMessages(req: Request, res: Response) {
    try {
      const userRole = (req as any).user?.role;
      if (userRole !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const messages = await prisma.supportMessage.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
          sender: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ messages });
    } catch (error) {
      console.error('Error fetching all support messages:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  },

  // Admin endpoint to reply to a user
  async replyToSupportMessage(req: Request, res: Response) {
    try {
      const adminId = (req as any).user?.userId;
      const { userId } = req.params;
      const { text } = req.body;

      const userRole = (req as any).user?.role;
      if (userRole !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return res.status(400).json({ error: 'Message text is required' });
      }

      const message = await prisma.supportMessage.create({
        data: {
          userId,
          senderId: adminId,
          text: text.trim(),
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              role: true,
            },
          },
        },
      });

      // TODO: Notify user via WebSocket
      // wsServer.broadcastToUser(userId, {
      //   type: 'admin-message',
      //   data: message,
      // });

      res.status(201).json(message);
    } catch (error) {
      console.error('Error replying to support message:', error);
      res.status(500).json({ error: 'Failed to send reply' });
    }
  },
};

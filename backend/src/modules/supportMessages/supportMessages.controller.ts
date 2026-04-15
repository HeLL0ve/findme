import { Request, Response } from 'express';
import { prisma } from '../../config/prisma';

export const supportMessagesController = {
  async getAdminChatMessages(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      console.log('[getAdminChatMessages] userId:', userId);
      
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
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
        take: 50,
      });

      console.log('[getAdminChatMessages] found messages:', messages.length);
      res.json({ messages });
    } catch (error) {
      console.error('Error fetching admin chat messages:', error);
      res.status(500).json({ error: 'Failed to fetch messages', details: error instanceof Error ? error.message : String(error) });
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
      });

      // Then fetch with relations
      const fullMessage = await prisma.supportMessage.findUnique({
        where: { id: message.id },
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

      if (!fullMessage) {
        return res.status(500).json({ error: 'Failed to fetch created message' });
      }

      res.status(201).json(fullMessage);
    } catch (error) {
      console.error('Error sending message to admin:', error);
      res.status(500).json({ error: 'Failed to send message', details: error instanceof Error ? error.message : String(error) });
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
      const userId = req.params.userId as string;
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
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
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

import { WebSocketServer, WebSocket } from 'ws';
import type { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/prisma';
import { createNotification } from '../modules/notifications/notifications.service';

type WsData = {
  userId?: string;
  role?: string;
  chats: Set<string>;
};

type WsWithData = WebSocket & { data?: WsData };

const connections = new Set<WsWithData>();
const userConnections = new Map<string, Set<WsWithData>>();

function send(ws: WebSocket, payload: any) {
  if (ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify(payload));
}

function broadcast(payload: any) {
  for (const ws of connections) send(ws, payload);
}

function addUserConnection(userId: string, ws: WsWithData) {
  if (!userConnections.has(userId)) userConnections.set(userId, new Set());
  userConnections.get(userId)!.add(ws);
}

function removeUserConnection(userId: string, ws: WsWithData) {
  const set = userConnections.get(userId);
  if (!set) return;
  set.delete(ws);
  if (set.size === 0) userConnections.delete(userId);
}

function broadcastOnlineCount() {
  broadcast({ type: 'online:count', count: connections.size });
}

export function initWsServer(server: HttpServer) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WsWithData, req) => {
    const url = new URL(req.url || '', 'http://localhost');
    const token = url.searchParams.get('token');
    const data: WsData = { chats: new Set() };

    if (token) {
      try {
        const payload = jwt.verify(token, env.jwtAccessSecret) as { userId: string; role: string };
        data.userId = payload.userId;
        data.role = payload.role;
        addUserConnection(payload.userId, ws);
      } catch (_) {
        // ignore invalid token
      }
    }

    ws.data = data;
    connections.add(ws);
    broadcastOnlineCount();

    send(ws, { type: 'online:count', count: connections.size });

    ws.on('message', async (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        const type = msg?.type as string;

        if (type === 'ping') {
          return send(ws, { type: 'pong' });
        }

        if (type === 'chat:join') {
          if (typeof msg.chatId === 'string') ws.data?.chats.add(msg.chatId);
          return send(ws, { type: 'chat:joined', chatId: msg.chatId });
        }

        if (type === 'chat:send') {
          const chatId = msg.chatId as string;
          const content = msg.content as string;
          const userId = ws.data?.userId;

          if (!userId) return send(ws, { type: 'error', code: 'UNAUTHORIZED' });
          if (!chatId || !content || !content.trim()) return send(ws, { type: 'error', code: 'INVALID_MESSAGE' });

          const chat = await prisma.chat.findUnique({
            where: { id: chatId },
            include: { ad: { select: { petName: true } } },
          });
          if (!chat) return send(ws, { type: 'error', code: 'CHAT_NOT_FOUND' });
          if (chat.user1Id !== userId && chat.user2Id !== userId) return send(ws, { type: 'error', code: 'FORBIDDEN' });

          const message = await prisma.message.create({
            data: { chatId, senderId: userId, content: content.trim() },
            include: { sender: { select: { id: true, name: true } } },
          });

          const payload = { type: 'chat:new', chatId, message };

          const targets = [chat.user1Id, chat.user2Id];
          for (const uid of targets) {
            const sockets = userConnections.get(uid);
            if (!sockets) continue;
            for (const s of sockets) send(s, payload);
          }

          const recipientId = chat.user1Id === userId ? chat.user2Id : chat.user1Id;
          await createNotification({
            userId: recipientId,
            type: 'CHAT_MESSAGE',
            title: 'Новое сообщение',
            message: chat.ad.petName ? `В чате по «${chat.ad.petName}» новое сообщение.` : 'Вам пришло новое сообщение в чате.',
            link: `/chats/${chatId}`,
          });

          return;
        }
      } catch (err) {
        send(ws, { type: 'error', code: 'BAD_REQUEST' });
      }
    });

    ws.on('close', () => {
      connections.delete(ws);
      if (ws.data?.userId) removeUserConnection(ws.data.userId, ws);
      broadcastOnlineCount();
    });
  });
}

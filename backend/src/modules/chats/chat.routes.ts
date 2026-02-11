import { Router } from 'express';
import { authMiddleware } from '../auth/middleware/auth.middleware';
import {
  listChatsController,
  createChatController,
  getChatController,
  listMessagesController,
  sendMessageController,
} from './controllers/chat.controller';

const router = Router();

router.get('/', authMiddleware, listChatsController);
router.post('/', authMiddleware, createChatController);
router.get('/:id', authMiddleware, getChatController);
router.get('/:id/messages', authMiddleware, listMessagesController);
router.post('/:id/messages', authMiddleware, sendMessageController);

export default router;

import { Router } from 'express';
import { authMiddleware } from '../auth/middleware/auth.middleware';
import {
  createChatController,
  deleteChatController,
  deleteMessageController,
  editMessageController,
  getChatController,
  listChatsController,
  listMessagesController,
  sendMessageController,
} from './controllers/chat.controller';

const router = Router();

router.get('/', authMiddleware, listChatsController);
router.post('/', authMiddleware, createChatController);
router.get('/:id', authMiddleware, getChatController);
router.delete('/:id', authMiddleware, deleteChatController);
router.get('/:id/messages', authMiddleware, listMessagesController);
router.post('/:id/messages', authMiddleware, sendMessageController);
router.patch('/:id/messages/:messageId', authMiddleware, editMessageController);
router.delete('/:id/messages/:messageId', authMiddleware, deleteMessageController);

export default router;

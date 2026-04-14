import { Router } from 'express';
import { supportMessagesController } from './supportMessages.controller';
import { authMiddleware } from '../auth/middleware/auth.middleware';

const router = Router();

// User routes (authenticated)
router.get('/with-admin/messages', authMiddleware, supportMessagesController.getAdminChatMessages);
router.post('/with-admin/message', authMiddleware, supportMessagesController.sendMessageToAdmin);

// Admin routes
router.get('/admin/all', authMiddleware, supportMessagesController.getAllSupportMessages);
router.post('/admin/reply/:userId', authMiddleware, supportMessagesController.replyToSupportMessage);

export default router;
